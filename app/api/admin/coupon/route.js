// app/api/admin/coupon/route.js
import prisma from '@/lib/prisma';
import authAdmin from '@/middlewares/authAdmin';
import { getAdminUserId } from '@/lib/getAdminUserId';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const userId = await getAdminUserId(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    const { coupon } = await request.json();
    coupon.code = coupon.code.toUpperCase();
    await prisma.coupon.create({ data: coupon });
    return NextResponse.json({ message: 'Coupon added successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    const userId = await getAdminUserId(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    const { searchParams } = request.nextUrl;
    const code = searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 });

    await prisma.coupon.delete({ where: { code } });
    return NextResponse.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

export async function GET(request) {
  try {
    const userId = await getAdminUserId(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    const coupons = await prisma.coupon.findMany({});
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}