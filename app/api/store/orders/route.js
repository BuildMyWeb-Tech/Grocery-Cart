// app/api/store/orders/route.js
import prisma from '@/lib/prisma';
import authSeller from '@/middlewares/authSeller';
import verifyEmployeeToken, { hasPermission, PERMISSIONS } from '@/middlewares/authEmployee';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const STORE_TRANSITIONS = {
  PENDING:          ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['PACKED', 'CANCELLED'],
  PACKED:           ['SHIPPED', 'CANCELLED'],
  SHIPPED:          ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED:        ['RETURNED'],
  CANCELLED:        [],
  RETURNED:         [],
};

const PRE_SHIPPED = new Set(['PENDING', 'CONFIRMED', 'PACKED']);

async function resolveStoreAuth(request) {
  const employee = verifyEmployeeToken(request);
  if (employee) return { storeId: employee.storeId, employee, source: 'employee' };

  const { userId } = getAuth(request);
  if (!userId) return { storeId: null };
  const storeId = await authSeller(userId);
  return { storeId, source: 'owner' };
}

async function restoreInventory(tx, orderId) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      storeId: true,
      orderItems: { select: { variantId: true, quantity: true } },
    },
  });
  if (!order) return;

  for (const item of order.orderItems) {
    const variant = await tx.productVariant.findUnique({
      where: { id: item.variantId },
      select: { stock: true },
    });
    if (!variant) continue;

    const newStock = variant.stock + item.quantity;

    await tx.productVariant.update({
      where: { id: item.variantId },
      data: { stock: newStock },
    });

    await tx.inventory.upsert({
      where: { variantId: item.variantId },
      update: { quantity: newStock },
      create: {
        variantId: item.variantId,
        storeId: order.storeId,
        quantity: newStock,
        lowStock: 10,
      },
    });
  }
}

// GET /api/store/orders — Store's own orders
export async function GET(request) {
  try {
    const { storeId, employee, source } = await resolveStoreAuth(request);
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (source === 'employee' && !hasPermission(employee, PERMISSIONS.VIEW_ORDERS)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const dateFrom     = searchParams.get('dateFrom');
    const dateTo       = searchParams.get('dateTo');
    const search       = searchParams.get('search');
    const page         = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit        = Math.min(100, parseInt(searchParams.get('limit') || '20'));

    const where = { storeId };

    if (statusFilter && statusFilter !== 'ALL') where.status = statusFilter;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          address: true,
          orderItems: {
            include: {
              variant: {
                select: {
                  id: true, color: true, size: true, price: true, sku: true,
                  product: { select: { id: true, name: true, images: true } },
                },
              },
            },
          },
          timeline: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ orders, total, page, limit });
  } catch (error) {
    console.error('GET /api/store/orders error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// POST /api/store/orders — Update order status
export async function POST(request) {
  try {
    const { storeId, employee, source } = await resolveStoreAuth(request);
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (source === 'employee' && !hasPermission(employee, PERMISSIONS.UPDATE_ORDER_STATUS)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { orderId, status, note } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, storeId },
      select: { id: true, status: true },
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const allowed = STORE_TRANSITIONS[order.status] || [];

    if (!allowed.includes(status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${order.status} to ${status}. Allowed: ${
            allowed.join(', ') || 'none'
          }`,
        },
        { status: 400 }
      );
    }

    if (status === 'CANCELLED' && !PRE_SHIPPED.has(order.status)) {
      return NextResponse.json(
        { error: 'Orders can only be cancelled before they are shipped' },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status } });

      await tx.orderTimeline.create({
        data: { orderId, status, changedBy: 'STORE', note: note || null },
      });

      if (status === 'CANCELLED' || status === 'RETURNED') {
        await restoreInventory(tx, orderId);
      }
    });

    return NextResponse.json({
      message: `Order updated to ${status}`,
      inventoryRestored: ['CANCELLED', 'RETURNED'].includes(status),
    });
  } catch (error) {
    console.error('POST /api/store/orders error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}