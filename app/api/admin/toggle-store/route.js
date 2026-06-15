// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\app\api\admin\toggle-store\route.js
import prisma from '@/lib/prisma';
import authAdmin from '@/middlewares/authAdmin';
import { getAdminUserId } from '@/lib/getAdminUserId';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const userId = await getAdminUserId(request);
    const isAdminUser = await authAdmin(userId);
    if (!isAdminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { storeId } = await request.json();
    if (!storeId) return NextResponse.json({ error: 'storeId is required' }, { status: 400 });

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    if (store.status === 'PENDING' || store.status === 'REJECTED') {
      return NextResponse.json({ error: 'Cannot toggle a store that has not been approved yet' }, { status: 400 });
    }

    const newStatus = store.isActive ? 'INACTIVE' : 'ACTIVE';
    const newActive = !store.isActive;

    await prisma.store.update({ where: { id: storeId }, data: { status: newStatus, isActive: newActive } });

    return NextResponse.json({
      message: `Store ${newActive ? 'activated' : 'deactivated'} successfully`,
      isActive: newActive,
    });
  } catch (error) {
    console.error('POST /api/admin/toggle-store error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}