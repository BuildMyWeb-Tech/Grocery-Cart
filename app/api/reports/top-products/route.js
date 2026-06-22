// app/api/reports/top-products/route.js
import prisma from '@/lib/prisma';
import authAdmin from '@/middlewares/authAdmin';
import authSeller from '@/middlewares/authSeller';
import verifyEmployeeToken, { hasPermission, PERMISSIONS } from '@/middlewares/authEmployee';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { buildDateRange, round2, EXCLUDED_STATUSES } from '@/lib/reportUtils';

async function resolveRole(request) {
  const employee = verifyEmployeeToken(request);
  if (employee) {
    if (!hasPermission(employee, PERMISSIONS.VIEW_REPORTS)) {
      return { role: null, storeId: null, permissionDenied: true };
    }
    return { role: 'STORE', storeId: employee.storeId };
  }

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
    const { role, storeId: myStoreId, permissionDenied } = await resolveRole(request);
    if (permissionDenied) return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const period      = searchParams.get('period') || 'month';
    const from        = searchParams.get('from');
    const to          = searchParams.get('to');
    const filterStore = searchParams.get('storeId');
    const limit       = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const dateRange     = buildDateRange(period, from, to);
    const scopedStoreId = role === 'ADMIN' ? filterStore || undefined : myStoreId;

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

    // OrderItem.price is a per-unit price (confirmed by every other place that
    // reads it — OrderItem.jsx, admin/store order modals — all multiply by
    // quantity). Prisma's groupBy `_sum` can only sum a raw column, not
    // price * quantity, so we fetch the rows and aggregate revenue manually
    // instead of summing `price` directly as the previous version did.
    const orderItemRows = await prisma.orderItem.findMany({
      where: { orderId: { in: orderIds } },
      select: { productId: true, price: true, quantity: true, orderId: true },
    });

    const productTotals = {};
    for (const row of orderItemRows) {
      if (!productTotals[row.productId]) {
        productTotals[row.productId] = { revenue: 0, quantity: 0, orderIds: new Set() };
      }
      const bucket = productTotals[row.productId];
      bucket.revenue  += row.price * row.quantity;
      bucket.quantity += row.quantity;
      bucket.orderIds.add(row.orderId);
    }

    const ranked = Object.entries(productTotals)
      .map(([productId, t]) => ({
        productId,
        revenue:  t.revenue,
        quantity: t.quantity,
        orders:   t.orderIds.size, // distinct orders, not line-item rows
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    if (ranked.length === 0) {
      return NextResponse.json({ products: [], meta: { period, total: 0 } });
    }

    const productIds = ranked.map((r) => r.productId);
    const products    = await prisma.product.findMany({
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

    const totalRevenue = ranked.reduce((s, r) => s + r.revenue, 0);

    const result = ranked.map((r) => {
      const p   = productMap[r.productId] || {};
      const rev = round2(r.revenue);
      return {
        productId:  r.productId,
        name:       p.name || 'Unknown Product',
        image:      p.images?.[0] || null,
        slug:       p.slug || '',
        store:      p.store || null,
        categories: (p.categories || []).map((c) => c.category.name),
        revenue:    rev,
        quantity:   r.quantity,
        orders:     r.orders,
        share:      totalRevenue > 0 ? round2((rev / totalRevenue) * 100) : 0,
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