// app/api/reports/summary/route.js
import prisma from '@/lib/prisma';
import authAdmin from '@/middlewares/authAdmin';
import authSeller from '@/middlewares/authSeller';
import verifyEmployeeToken, { hasPermission, PERMISSIONS } from '@/middlewares/authEmployee';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  buildDateRange,
  buildComparisonRanges,
  calcGrowth,
  round2,
  EXCLUDED_STATUSES,
} from '@/lib/reportUtils';

async function resolveRole(request) {
  // Check employee JWT first — same gap as sales-trend/top-products: getAuth
  // alone has no way to recognize an employee, so VIEW_REPORTS-permitted
  // employees were always falling through to "Unauthorized" before this.
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
  if (isAdminUser) return { userId, role: 'ADMIN', storeId: null };
  const storeId = await authSeller(userId);
  if (storeId) return { userId, role: 'STORE', storeId };
  return { role: null, storeId: null };
}

// GET /api/reports/summary
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
    const comparison  = searchParams.get('comparison');

    const dateRange = buildDateRange(period, from, to);
    if (!dateRange) {
      return NextResponse.json(
        { error: 'Custom period requires valid "from" and "to" dates' },
        { status: 400 }
      );
    }

    const scopedStoreId = role === 'ADMIN' ? filterStore || undefined : myStoreId;

    const where = {
      createdAt: dateRange,
      status: { notIn: EXCLUDED_STATUSES },
      ...(scopedStoreId ? { storeId: scopedStoreId } : {}),
    };

    // Current period aggregation — from Order table directly
    const agg = await prisma.order.aggregate({
      where,
      _sum: { total: true, commissionAmt: true },
      _count: { id: true },
      _avg: { total: true },
    });

    const revenue           = round2(agg._sum.total || 0);
    const commissionEarned  = round2(agg._sum.commissionAmt || 0);
    const storeRevenue      = round2(revenue - commissionEarned);
    const orderCount        = agg._count.id || 0;
    const aov               = round2(agg._avg.total || 0);

    // Top store (admin only)
    let topStore = null;
    if (role === 'ADMIN' && !filterStore) {
      const topStoreRaw = await prisma.order.groupBy({
        by: ['storeId'],
        where: { createdAt: dateRange, status: { notIn: EXCLUDED_STATUSES } },
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 1,
      });
      if (topStoreRaw.length > 0) {
        const storeData = await prisma.store.findUnique({
          where: { id: topStoreRaw[0].storeId },
          select: { id: true, name: true, logo: true, username: true },
        });
        topStore = { ...storeData, revenue: round2(topStoreRaw[0]._sum.total || 0) };
      }
    }

    // Comparison report
    let comparisonData = null;
    if (comparison) {
      const ranges = buildComparisonRanges(comparison);
      if (ranges) {
        const storeFilter = scopedStoreId ? { storeId: scopedStoreId } : {};
        const excludeFilter = { status: { notIn: EXCLUDED_STATUSES } };

        const [curr, prev] = await Promise.all([
          prisma.order.aggregate({
            where: { createdAt: ranges.current, ...storeFilter, ...excludeFilter },
            _sum: { total: true },
            _count: { id: true },
          }),
          prisma.order.aggregate({
            where: { createdAt: ranges.previous, ...storeFilter, ...excludeFilter },
            _sum: { total: true },
            _count: { id: true },
          }),
        ]);

        const currRev  = round2(curr._sum.total || 0);
        const prevRev  = round2(prev._sum.total || 0);
        const currOrds = curr._count.id || 0;
        const prevOrds = prev._count.id || 0;

        const revGrowth = calcGrowth(currRev, prevRev);
        const ordGrowth = calcGrowth(currOrds, prevOrds);

        comparisonData = {
          labels: ranges.labels,
          revenue: { current: currRev, previous: prevRev, ...revGrowth },
          orders:  { current: currOrds, previous: prevOrds, ...ordGrowth },
        };
      }
    }

    // NOTE: employeeBreakdown is intentionally NOT included here.
    // app/store/analytics/page.jsx reads summary.employeeBreakdown to render
    // a per-employee revenue table, but computing that requires attributing
    // an order to a specific employee, and nothing reviewed so far (Order,
    // OrderTimeline.changedBy) carries that link — changedBy stores a role
    // label, not an employee id. Needs a schema field or a defined rule
    // before this can be built; flagging rather than fabricating one.

    return NextResponse.json({
      summary: {
        revenue,
        commissionEarned,
        storeRevenue,
        orders: orderCount,
        aov,
        topStore,
        period,
        dateRange: { from: dateRange.gte, to: dateRange.lte },
        comparison: comparisonData,
      },
    });
  } catch (error) {
    console.error('GET /api/reports/summary error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}