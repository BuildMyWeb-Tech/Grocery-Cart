// app/api/reports/export/route.js
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

function toCSV(rows, columns) {
  const header = columns.map((c) => `"${c.label}"`).join(',');
  const body = rows.map((row) =>
    columns.map((c) => {
      const val = row[c.key] ?? '';
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(',')
  );
  return [header, ...body].join('\n');
}

// GET /api/reports/export
export async function GET(request) {
  try {
    const { role, storeId: myStoreId } = await resolveRole(request);
    if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const format      = searchParams.get('format') || 'csv';
    const period      = searchParams.get('period') || 'month';
    const from        = searchParams.get('from');
    const to          = searchParams.get('to');
    const filterStore = searchParams.get('storeId');

    const dateRange = buildDateRange(period, from, to);
    if (!dateRange) {
      return NextResponse.json(
        { error: 'Custom period requires valid "from" and "to" dates' },
        { status: 400 }
      );
    }

    const scopedStoreId = role === 'ADMIN' ? filterStore || undefined : myStoreId;

    const orders = await prisma.order.findMany({
      where: {
        createdAt: dateRange,
        status: { notIn: EXCLUDED_STATUSES },
        ...(scopedStoreId ? { storeId: scopedStoreId } : {}),
      },
      include: {
        store: { select: { name: true, username: true } },
        user:  { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const rows = orders.map((o) => ({
      id:               o.id,
      storeName:        o.store?.name || '',
      customerName:     o.user?.name || '',
      customerEmail:    o.user?.email || '',
      subtotal:         round2(o.subtotal),
      shippingCost:     round2(o.shippingCost),
      couponDiscount:   round2(o.couponDiscount),
      commissionAmt:    round2(o.commissionAmt),
      total:            round2(o.total),
      status:           o.status,
      paymentMethod:    o.paymentMethod,
      date:             o.createdAt.toISOString().split('T')[0],
      time:             o.createdAt.toTimeString().split(' ')[0],
    }));

    const columns = [
      { key: 'id',             label: 'Order ID' },
      { key: 'storeName',      label: 'Store' },
      { key: 'customerName',   label: 'Customer' },
      { key: 'customerEmail',  label: 'Email' },
      { key: 'subtotal',       label: 'Subtotal (₹)' },
      { key: 'shippingCost',   label: 'Shipping (₹)' },
      { key: 'couponDiscount', label: 'Discount (₹)' },
      { key: 'commissionAmt',  label: 'Commission (₹)' },
      { key: 'total',          label: 'Total (₹)' },
      { key: 'status',         label: 'Status' },
      { key: 'paymentMethod',  label: 'Payment' },
      { key: 'date',           label: 'Date' },
      { key: 'time',           label: 'Time' },
    ];

    if (format === 'csv') {
      const csv = toCSV(rows, columns);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="orders-report-${period}-${Date.now()}.csv"`,
        },
      });
    }

    const totalRevenue    = round2(rows.reduce((s, r) => s + r.total, 0));
    const totalCommission = round2(rows.reduce((s, r) => s + r.commissionAmt, 0));

    return NextResponse.json({
      format: 'pdf',
      summary: {
        totalRevenue,
        totalCommission,
        storeRevenue: round2(totalRevenue - totalCommission),
        totalOrders: rows.length,
        aov: rows.length > 0 ? round2(totalRevenue / rows.length) : 0,
        period,
        from: dateRange.gte.toISOString().split('T')[0],
        to:   dateRange.lte.toISOString().split('T')[0],
        generatedAt: new Date().toISOString(),
      },
      rows,
      columns,
    });
  } catch (error) {
    console.error('GET /api/reports/export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}