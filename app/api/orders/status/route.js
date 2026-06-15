// app/api/orders/status/route.js
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import authSeller from '@/middlewares/authSeller';
import authAdmin  from '@/middlewares/authAdmin';
import verifyEmployeeToken, { hasPermission, PERMISSIONS } from '@/middlewares/authEmployee';

const STORE_TRANSITIONS = {
  PENDING:          ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['PACKED',    'CANCELLED'],
  PACKED:           ['SHIPPED',   'CANCELLED'],
  SHIPPED:          ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED:        ['RETURNED'],
  CANCELLED:        [],
  RETURNED:         [],
};

const ADMIN_TRANSITIONS = {
  PENDING:          ['CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  CONFIRMED:        ['PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
  PACKED:           ['SHIPPED', 'DELIVERED', 'CANCELLED'],
  SHIPPED:          ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED:        ['RETURNED'],
  CANCELLED:        ['PENDING'],
  RETURNED:         [],
};

// Customer can cancel only before PACKED
const CUSTOMER_CANCELLABLE = new Set(['PENDING', 'CONFIRMED']);
// ✅ Customer can request return only when DELIVERED
const CUSTOMER_RETURNABLE  = new Set(['DELIVERED']);
const PRE_SHIPPED          = new Set(['PENDING', 'CONFIRMED', 'PACKED']);

async function restoreInventory(tx, orderId) {
  const order = await tx.order.findUnique({
    where:  { id: orderId },
    select: { storeId: true, orderItems: { select: { variantId: true, quantity: true } } },
  });
  if (!order) return;

  for (const item of order.orderItems) {
    const variant = await tx.productVariant.findUnique({ where: { id: item.variantId }, select: { stock: true } });
    if (!variant) continue;
    const newStock = variant.stock + item.quantity;
    await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: newStock } });
    await tx.inventory.upsert({
      where:  { variantId: item.variantId },
      update: { quantity: newStock },
      create: { variantId: item.variantId, storeId: order.storeId, quantity: newStock, lowStock: 10 },
    });
  }
}

export async function PUT(request) {
  try {
    const employee = verifyEmployeeToken(request);
    const { userId } = await auth();

    let role = null, storeId = null, isCustomer = false;

    if (employee) {
      if (!hasPermission(employee, PERMISSIONS.UPDATE_ORDER_STATUS))
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      role = 'STORE'; storeId = employee.storeId;
    } else if (userId) {
      const isAdminUser = await authAdmin(userId);
      if (isAdminUser) {
        role = 'ADMIN';
      } else {
        storeId = await authSeller(userId);
        if (storeId) { role = 'STORE'; }
        else          { role = 'CUSTOMER'; isCustomer = true; }
      }
    }

    if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId, newStatus, note } = await request.json();
    if (!orderId || !newStatus)
      return NextResponse.json({ error: 'orderId and newStatus are required' }, { status: 400 });

    const order = await prisma.order.findUnique({
      where:  { id: orderId },
      select: { id: true, status: true, storeId: true, userId: true },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // ✅ Customer: can cancel before PACKED, or request return when DELIVERED
    if (isCustomer) {
      if (order.userId !== userId)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      if (newStatus === 'CANCELLED') {
        if (!CUSTOMER_CANCELLABLE.has(order.status))
          return NextResponse.json({ error: 'Order cannot be cancelled at this stage' }, { status: 400 });
      } else if (newStatus === 'RETURNED') {
        if (!CUSTOMER_RETURNABLE.has(order.status))
          return NextResponse.json({ error: 'Only delivered orders can be returned' }, { status: 400 });
      } else {
        return NextResponse.json({ error: 'Customers can only cancel or return orders' }, { status: 400 });
      }
    }

    if (role === 'STORE' && !isCustomer && order.storeId !== storeId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (!isCustomer) {
      const transitionMap = role === 'ADMIN' ? ADMIN_TRANSITIONS : STORE_TRANSITIONS;
      const allowed = transitionMap[order.status] || [];
      if (!allowed.includes(newStatus))
        return NextResponse.json({ error: `Cannot transition from ${order.status} to ${newStatus}` }, { status: 400 });
      if (newStatus === 'CANCELLED' && !PRE_SHIPPED.has(order.status))
        return NextResponse.json({ error: 'Cannot cancel after shipping' }, { status: 400 });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({ where: { id: orderId }, data: { status: newStatus } });
      await tx.orderTimeline.create({
        data: { orderId, status: newStatus, changedBy: isCustomer ? 'CUSTOMER' : role, note: note || null },
      });
      if (newStatus === 'CANCELLED' || newStatus === 'RETURNED') {
        await restoreInventory(tx, orderId);
      }
      return updated;
    });

    return NextResponse.json({
      message:           `Order status updated to ${newStatus}`,
      order:             updatedOrder,
      inventoryRestored: ['CANCELLED', 'RETURNED'].includes(newStatus),
    });
  } catch (error) {
    console.error('PUT /api/orders/status error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request) {
  try {
    const { userId } = await auth();
    const employee   = verifyEmployeeToken(request);

    let role = null, storeId = null;

    if (employee) {
      role = 'STORE'; storeId = employee.storeId;
    } else if (userId) {
      const isAdminUser = await authAdmin(userId);
      if (isAdminUser) { role = 'ADMIN'; }
      else {
        storeId = await authSeller(userId);
        role    = storeId ? 'STORE' : 'CUSTOMER';
      }
    }

    if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true, storeId: true } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    if (role === 'STORE' && order.storeId !== storeId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const transitionMap = role === 'ADMIN' ? ADMIN_TRANSITIONS : STORE_TRANSITIONS;
    return NextResponse.json({ currentStatus: order.status, allowedTransitions: transitionMap[order.status] || [] });
  } catch (error) {
    console.error('GET /api/orders/status error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}