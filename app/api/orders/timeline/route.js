// app/api/orders/timeline/route.js
import prisma from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import authSeller from '@/middlewares/authSeller';
import authAdmin from '@/middlewares/authAdmin';
import verifyEmployeeToken from '@/middlewares/authEmployee';

// GET /api/orders/timeline?orderId=xxx
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 });

    const employee = verifyEmployeeToken(request);
    const { userId } = getAuth(request);

    let authorized = false;

    if (employee) {
      // Employee: verify order belongs to their store
      const order = await prisma.order.findFirst({
        where: { id: orderId, storeId: employee.storeId },
      });
      authorized = !!order;
    } else if (userId) {
      const isAdminUser = await authAdmin(userId);
      if (isAdminUser) {
        authorized = true;
      } else {
        // Could be store owner
        const storeId = await authSeller(userId);
        if (storeId) {
          const order = await prisma.order.findFirst({ where: { id: orderId, storeId } });
          authorized = !!order;
        } else {
          // Could be a buyer
          const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
          authorized = !!order;
        }
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const timeline = await prisma.orderTimeline.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error('GET /api/orders/timeline error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}