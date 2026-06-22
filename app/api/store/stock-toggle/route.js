// C:\Users\Siddharathan\Desktop\Grocery-Cart\app\api\store\stock-toggle\route.js
import prisma from '@/lib/prisma';
import authSeller from '@/middlewares/authSeller';
import verifyEmployeeToken, { hasPermission, PERMISSIONS } from '@/middlewares/authEmployee';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// POST /api/store/stock-toggle — Toggle product status ACTIVE <-> INACTIVE
// In the new schema there is no inStock boolean on Product.
// Status INACTIVE hides product from customers; ACTIVE makes it visible.
// Out-of-stock is determined by variant stock levels, not this toggle.
export async function POST(request) {
  try {
    const employee = verifyEmployeeToken(request);
    let storeId = null;

    if (employee) {
      if (!hasPermission(employee, PERMISSIONS.MANAGE_INVENTORY)) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
      storeId = employee.storeId;
    } else {
      const { userId } = getAuth(request);
      if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      storeId = await authSeller(userId);
      if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    await prisma.product.update({
      where: { id: productId },
      data: { status: newStatus },
    });

    return NextResponse.json({
      message: `Product ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`,
      status: newStatus,
    });
  } catch (error) {
    console.error('POST /api/store/stock-toggle error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}