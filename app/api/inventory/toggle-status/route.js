// C:\Users\Siddharathan\Desktop\Grocery-Cart\app\api\inventory\toggle-status\route.js
import prisma from '@/lib/prisma';
import authSeller from '@/middlewares/authSeller';
import verifyEmployeeToken, { hasPermission, PERMISSIONS } from '@/middlewares/authEmployee';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// POST /api/inventory/toggle-status — Toggle a product's ACTIVE/INACTIVE status
export async function POST(request) {
  try {
    const employee = verifyEmployeeToken(request);
    let storeId = null;

    if (employee) {
      if (!hasPermission(employee, PERMISSIONS.MANAGE_INVENTORY))
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      storeId = employee.storeId;
    } else {
      const { userId } = await auth();
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      storeId = await authSeller(userId);
      if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, status } = await request.json();
    if (!productId || !['ACTIVE', 'INACTIVE'].includes(status))
      return NextResponse.json({ error: 'productId and valid status (ACTIVE/INACTIVE) required' }, { status: 400 });

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { storeId: true } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.storeId !== storeId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updated = await prisma.product.update({
      where: { id: productId },
      data:  { status },
      select: { id: true, status: true },
    });

    return NextResponse.json({ message: `Product marked ${status}`, product: updated });
  } catch (error) {
    console.error('POST /api/inventory/toggle-status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}