// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\app\api\admin\approve-store\route.js
import prisma from '@/lib/prisma';
import authAdmin from '@/middlewares/authAdmin';
import { getAdminUserId } from '@/lib/getAdminUserId';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const userId = await getAdminUserId(request);
    const isAdminUser = await authAdmin(userId);
    if (!isAdminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { storeId, action } = await request.json();
    if (!storeId || !action) return NextResponse.json({ error: 'storeId and action are required' }, { status: 400 });
    if (!['APPROVE', 'REJECT'].includes(action)) return NextResponse.json({ error: 'action must be APPROVE or REJECT' }, { status: 400 });

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    if (action === 'APPROVE') {
      await prisma.$transaction(async (tx) => {
        await tx.store.update({ where: { id: storeId }, data: { status: 'ACTIVE', isActive: true } });
        await tx.commission.upsert({ where: { storeId }, update: {}, create: { storeId, percentage: 0 } });
      });
      return NextResponse.json({ message: 'Store approved and activated successfully' });
    }

    await prisma.store.update({ where: { id: storeId }, data: { status: 'REJECTED', isActive: false } });
    return NextResponse.json({ message: 'Store rejected successfully' });
  } catch (error) {
    console.error('POST /api/admin/approve-store error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request) {
  try {
    const userId = await getAdminUserId(request);
    const isAdminUser = await authAdmin(userId);
    if (!isAdminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const stores = await prisma.store.findMany({
      where: { status: { in: ['PENDING', 'REJECTED'] } },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('GET /api/admin/approve-store error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}