// app/api/admin/orders/route.js
import prisma from '@/lib/prisma';
import authAdmin from '@/middlewares/authAdmin';
import { getAdminUserId } from '@/lib/getAdminUserId';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const userId = await getAdminUserId(request);
    const isAdminUser = await authAdmin(userId);
    if (!isAdminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const statusFilter  = searchParams.get('status');
    const storeIdFilter = searchParams.get('storeId');
    const dateFrom      = searchParams.get('dateFrom');
    const dateTo        = searchParams.get('dateTo');
    const search        = searchParams.get('search');
    const page          = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit         = Math.min(100, parseInt(searchParams.get('limit') || '20'));

    const where = {};
    if (statusFilter && statusFilter !== 'ALL') where.status = statusFilter;
    if (storeIdFilter && storeIdFilter !== 'ALL') where.storeId = storeIdFilter;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo)   where.createdAt.lte = new Date(dateTo);
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { name:  { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user:  { select: { id: true, name: true, email: true, image: true } },
          store: { select: { id: true, name: true, username: true, logo: true } },
          address: true,
          orderItems: {
            include: {
              variant: {
                select: {
                  id: true, variantName: true, price: true, sku: true,
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

    const revenueAgg = await prisma.order.aggregate({
      where: { ...where, status: { notIn: ['CANCELLED', 'RETURNED'] } },
      _sum: { total: true, commissionAmt: true },
    });

    return NextResponse.json({
      orders, total, page, limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalRevenue:    revenueAgg._sum.total || 0,
        totalCommission: revenueAgg._sum.commissionAmt || 0,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/orders error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}