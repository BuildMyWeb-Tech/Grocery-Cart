// app/api/reports/top-products/route.js
import prisma from '@/lib/prisma';
import authAdmin from '@/middlewares/authAdmin';
import authSeller from '@/middlewares/authSeller';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { buildDateRange, round2, EXCLUDED_STATUSES } from '@/lib/reportUtils';

async function resolveRole(request) {
  const { userId } = getAuth(request);
  if (!userId) return { role: null, storeId: null };
  const isAdminUser = await authAdmin(userId);
  if (isAdminUser) return { role: 'ADMIN', storeId: null };
  const storeId = await authSeller(userId);
  if (storeId) return { role: 'STORE', storeId };
  return { role: null, storeId: null };
}

// GET /api/reports/top-products
export async function GET(request) {
  try {
    const { role, storeId: myStoreId } = await resolveRole(request);
    if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const period      = searchParams.get('period') || 'month';
    const from        = searchParams.get('from');
    const to          = searchParams.get('to');
    const filterStore = searchParams.get('storeId');
    const limit       = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const dateRange     = buildDateRange(period, from, to);
    const scopedStoreId = role === 'ADMIN' ? filterStore || undefined : myStoreId;

    // Get qualifying order IDs from Order table
    const orders = await prisma.order.findMany({
      where: {
        createdAt: dateRange,
        status: { notIn: EXCLUDED_STATUSES },
        ...(scopedStoreId ? { storeId: scopedStoreId } : {}),
      },
      select: { id: true },
    });

    const orderIds = orders.map((o) => o.id);
    if (orderIds.length === 0) {
      return NextResponse.json({ products: [], meta: { period, total: 0 } });
    }

    // Aggregate OrderItems by productId
    const items = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: { orderId: { in: orderIds } },
      _sum: { price: true, quantity: true },
      _count: { orderId: true },
      orderBy: { _sum: { price: 'desc' } },
      take: limit,
    });

    if (items.length === 0) {
      return NextResponse.json({ products: [], meta: { period, total: 0 } });
    }

    // Fetch product metadata
    const productIds = items.map((i) => i.productId);
    const products   = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        images: true,
        slug: true,
        store: { select: { id: true, name: true, username: true } },
        categories: {
          include: { category: { select: { name: true } } },
        },
      },
    });
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

    const totalRevenue = items.reduce((s, i) => s + (i._sum.price || 0), 0);

    const result = items.map((item) => {
      const p   = productMap[item.productId] || {};
      const rev = round2(item._sum.price || 0);
      return {
        productId: item.productId,
        name:      p.name || 'Unknown Product',
        image:     p.images?.[0] || null,
        slug:      p.slug || '',
        store:     p.store || null,
        categories: (p.categories || []).map((c) => c.category.name),
        revenue:   rev,
        quantity:  item._sum.quantity || 0,
        orders:    item._count.orderId || 0,
        share:     totalRevenue > 0 ? round2((rev / totalRevenue) * 100) : 0,
      };
    });

    return NextResponse.json({
      products: result,
      meta: { period, total: round2(totalRevenue), count: result.length },
    });
  } catch (error) {
    console.error('GET /api/reports/top-products error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}