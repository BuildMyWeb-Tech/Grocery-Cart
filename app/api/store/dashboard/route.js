// app/api/store/dashboard/route.js
import prisma from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import authSeller from '@/middlewares/authSeller';
import verifyEmployeeToken, { hasPermission, PERMISSIONS } from '@/middlewares/authEmployee';
import { round2, EXCLUDED_STATUSES } from '@/lib/reportUtils';

async function resolveStoreAuth(request) {
  const employee = verifyEmployeeToken(request);
  if (employee) return { storeId: employee.storeId, employee, source: 'employee' };

  const { userId } = getAuth(request);
  if (!userId) return { storeId: null };
  const storeId = await authSeller(userId);
  return { storeId, source: 'owner' };
}

// GET /api/store/dashboard
export async function GET(request) {
  try {
    const { storeId, employee, source } = await resolveStoreAuth(request);
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      totalOrders,
      totalCategories,

      // Revenue
      revenueAgg,
      todayRevenueAgg,

      // Order status counts
      pendingOrders,
      confirmedOrders,
      packedOrders,
      shippedOrders,
      outForDeliveryOrders,
      deliveredOrders,
      cancelledOrders,

      // Unique customers
      uniqueCustomers,

      // Recent ratings for this store
      recentRatings,

      // Low stock variants
      lowStockVariants,

      // Top selling variants this month
      topVariantsRaw,
    ] = await Promise.all([
      prisma.product.count({ where: { storeId } }),
      prisma.order.count({ where: { storeId } }),
      prisma.category.count({ where: { storeId } }),

      // All time revenue
      prisma.order.aggregate({
        where: { storeId, status: { notIn: EXCLUDED_STATUSES } },
        _sum: { total: true, commissionAmt: true },
      }),

      // Today
      prisma.order.aggregate({
        where: {
          storeId,
          createdAt: { gte: todayStart },
          status: { notIn: EXCLUDED_STATUSES },
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      prisma.order.count({ where: { storeId, status: 'PENDING' } }),
      prisma.order.count({ where: { storeId, status: 'CONFIRMED' } }),
      prisma.order.count({ where: { storeId, status: 'PACKED' } }),
      prisma.order.count({ where: { storeId, status: 'SHIPPED' } }),
      prisma.order.count({ where: { storeId, status: 'OUT_FOR_DELIVERY' } }),
      prisma.order.count({ where: { storeId, status: 'DELIVERED' } }),
      prisma.order.count({ where: { storeId, status: 'CANCELLED' } }),

      // Unique customers
      prisma.order.groupBy({
        by: ['userId'],
        where: { storeId },
      }),

      // Recent ratings
      prisma.rating.findMany({
        where: { product: { storeId } },
        include: {
          user:    { select: { id: true, name: true, image: true } },
          product: { select: { id: true, name: true, images: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Low stock variants (stock <= 5)
      prisma.productVariant.findMany({
        where: { stock: { lte: 5 }, product: { storeId } },
        include: { product: { select: { id: true, name: true } } },
        orderBy: { stock: 'asc' },
        take: 20,
      }),

      // Top variants by quantity sold this month
      prisma.orderItem.groupBy({
        by: ['variantId'],
        where: {
          order: {
            storeId,
            status: { notIn: EXCLUDED_STATUSES },
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        _sum: { quantity: true, price: true },
        _count: { orderId: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
    ]);

    // Last 30 days daily chart
    const last30Orders = await prisma.order.findMany({
      where: {
        storeId,
        status: { notIn: EXCLUDED_STATUSES },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const buckets = {};
    for (const o of last30Orders) {
      const key = o.createdAt.toISOString().split('T')[0];
      if (!buckets[key]) buckets[key] = { revenue: 0, orders: 0 };
      buckets[key].revenue += o.total;
      buckets[key].orders  += 1;
    }
    const dailyData = Object.entries(buckets).map(([date, data]) => ({
      date,
      revenue: round2(data.revenue),
      orders:  data.orders,
    }));

    // Hydrate top variants
    const variantIds = topVariantsRaw.map((r) => r.variantId).filter(Boolean);
    const variantDetails =
      variantIds.length > 0
        ? await prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            select: {
              id: true, color: true, size: true, sku: true,
              product: { select: { name: true, images: true } },
            },
          })
        : [];
    const variantMap = Object.fromEntries(variantDetails.map((v) => [v.id, v]));

    const topVariants = topVariantsRaw.map((r) => {
      const detail = variantMap[r.variantId];
      return {
        variantId:   r.variantId,
        color:       detail?.color || '?',
        size:        detail?.size  || '?',
        sku:         detail?.sku   || '',
        productName: detail?.product?.name || 'Unknown',
        productImage: detail?.product?.images?.[0] || null,
        totalQty:    r._sum.quantity || 0,
        totalRevenue: round2(r._sum.price || 0),
        orders:      r._count.orderId || 0,
      };
    });

    const totalRevenue    = round2(revenueAgg._sum.total || 0);
    const totalCommission = round2(revenueAgg._sum.commissionAmt || 0);

    return NextResponse.json({
      dashboardData: {
        totalProducts,
        totalOrders,
        totalCategories,
        totalCustomers: uniqueCustomers.length,

        totalRevenue,
        totalCommission,
        netRevenue: round2(totalRevenue - totalCommission),

        todayOrders:   todayRevenueAgg._count.id || 0,
        todayRevenue:  round2(todayRevenueAgg._sum.total || 0),

        orderStatus: {
          pending:        pendingOrders,
          confirmed:      confirmedOrders,
          packed:         packedOrders,
          shipped:        shippedOrders,
          outForDelivery: outForDeliveryOrders,
          delivered:      deliveredOrders,
          cancelled:      cancelledOrders,
        },

        dailyData,
        recentRatings,
        topVariants,

        lowStockAlerts: lowStockVariants.map((v) => ({
          variantId:   v.id,
          color:       v.color,
          size:        v.size,
          sku:         v.sku,
          stock:       v.stock,
          productId:   v.productId,
          productName: v.product.name,
        })),
      },
    });
  } catch (error) {
    console.error('GET /api/store/dashboard error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}