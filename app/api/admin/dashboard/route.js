// app/api/admin/dashboard/route.js
import prisma from '@/lib/prisma';
import authAdmin from '@/middlewares/authAdmin';
import { getAdminUserId } from '@/lib/getAdminUserId';
import { NextResponse } from 'next/server';
import { round2, EXCLUDED_STATUSES, toISTDateKey } from '@/lib/reportUtils';

export async function GET(request) {
  try {
    const userId = await getAdminUserId(request);
    const isAdminUser = await authAdmin(userId);
    if (!isAdminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalOrders, totalStores, activeStores, pendingStores, totalProducts, totalCustomers,
      revenueAgg, todayRevenueAgg,
      pendingOrders, confirmedOrders, packedOrders, shippedOrders,
      outForDeliveryOrders, deliveredOrders, cancelledOrders, returnedOrders,
      topStoresRaw, recentOrders, allInventoryRecords, last90DaysOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.store.count(),
      prisma.store.count({ where: { status: 'ACTIVE', isActive: true } }),
      prisma.store.count({ where: { status: 'PENDING' } }),
      prisma.product.count(),
      prisma.user.count({ where: { store: null } }),

      prisma.order.aggregate({
        where: { status: { notIn: EXCLUDED_STATUSES } },
        _sum: { total: true, commissionAmt: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: todayStart }, status: { notIn: EXCLUDED_STATUSES } },
        _sum: { total: true, commissionAmt: true },
        _count: { id: true },
      }),

      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'CONFIRMED' } }),
      prisma.order.count({ where: { status: 'PACKED' } }),
      prisma.order.count({ where: { status: 'SHIPPED' } }),
      prisma.order.count({ where: { status: 'OUT_FOR_DELIVERY' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
      prisma.order.count({ where: { status: 'RETURNED' } }),

      prisma.order.groupBy({
        by: ['storeId'],
        where: {
          status: { notIn: EXCLUDED_STATUSES },
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum: { total: true, commissionAmt: true },
        _count: { id: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),

      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user:  { select: { name: true, email: true } },
          store: { select: { name: true, username: true } },
        },
      }),

      // Low-stock detection now reads Inventory directly — ProductVariant has
      // no stock column. Prisma can't compare quantity <= lowStock as a `where`
      // filter (two columns on the same row), so we fetch and filter in JS below.
      prisma.inventory.findMany({
        select: {
          id: true, quantity: true, lowStock: true, storeId: true,
          variant: {
            select: {
              id: true, variantName: true, sku: true,
              product: { select: { id: true, name: true } },
            },
          },
          store: { select: { id: true, name: true } },
        },
      }),

      // Widened from 30 → 90 days, no status filter (counts ALL orders
      // placed; revenue per-day still excludes CANCELLED/RETURNED below)
      prisma.order.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        },
        select: { total: true, commissionAmt: true, createdAt: true, status: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Hydrate top stores
    const topStoreIds = topStoresRaw.map((g) => g.storeId);
    const topStoreDetails = await prisma.store.findMany({
      where: { id: { in: topStoreIds } },
      select: { id: true, name: true, logo: true, username: true },
    });
    const storeDetailMap = Object.fromEntries(topStoreDetails.map((s) => [s.id, s]));
    const topStores = topStoresRaw.map((g, idx) => {
      const s = storeDetailMap[g.storeId] || {};
      return {
        rank: idx + 1, storeId: g.storeId,
        name: s.name || 'Unknown', logo: s.logo || null, username: s.username || '',
        revenue: round2(g._sum.total || 0),
        commission: round2(g._sum.commissionAmt || 0),
        orders: g._count.id,
      };
    });

    // Build low-stock alerts: filter to quantity <= lowStock, most urgent first, cap at 20
    const lowStockAlerts = allInventoryRecords
      .filter((inv) => inv.quantity <= inv.lowStock)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 20)
      .map((inv) => ({
        variantId:   inv.variant?.id,
        variantName: inv.variant?.variantName,
        sku:         inv.variant?.sku,
        stock:       inv.quantity,
        productId:   inv.variant?.product?.id,
        productName: inv.variant?.product?.name,
        storeName:   inv.store?.name || '',
        storeId:     inv.storeId || '',
      }));

    // Daily chart data — 90 days, IST-aligned bucketing (matches
    // toISTDateKey used elsewhere in the reporting system).
    // Every order counts toward "orders placed"; revenue/commission
    // exclude CANCELLED/RETURNED per EXCLUDED_STATUSES.
    const buckets = {};
    for (const o of last90DaysOrders) {
      const key = toISTDateKey(o.createdAt);
      if (!buckets[key]) buckets[key] = { revenue: 0, commission: 0, count: 0 };
      buckets[key].count += 1;
      if (!EXCLUDED_STATUSES.includes(o.status)) {
        buckets[key].revenue    += o.total;
        buckets[key].commission += o.commissionAmt;
      }
    }
    const dailyData = Object.entries(buckets).map(([date, data]) => ({
      date,
      revenue: round2(data.revenue),
      commission: round2(data.commission),
      count: data.count,
    }));

    const totalRevenue    = round2(revenueAgg._sum.total || 0);
    const totalCommission = round2(revenueAgg._sum.commissionAmt || 0);

    return NextResponse.json({
      dashboardData: {
        totalOrders, totalStores, activeStores, pendingStores, totalProducts, totalCustomers,
        totalRevenue, totalCommission,
        platformRevenue: totalCommission,
        storeRevenue: round2(totalRevenue - totalCommission),
        todayOrders:     todayRevenueAgg._count.id || 0,
        todayRevenue:    round2(todayRevenueAgg._sum.total || 0),
        todayCommission: round2(todayRevenueAgg._sum.commissionAmt || 0),
        orderStatus: {
          pending: pendingOrders, confirmed: confirmedOrders, packed: packedOrders,
          shipped: shippedOrders, outForDelivery: outForDeliveryOrders,
          delivered: deliveredOrders, cancelled: cancelledOrders, returned: returnedOrders,
        },
        topStores, recentOrders, dailyData,
        lowStockAlerts,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/dashboard error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}