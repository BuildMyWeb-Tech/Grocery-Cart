// C:\Users\Siddharathan\Desktop\Grocery-Cart\app\api\inventory\update\route.js
import prisma from '@/lib/prisma';
import authSeller from '@/middlewares/authSeller';
import verifyEmployeeToken, { hasPermission, PERMISSIONS } from '@/middlewares/authEmployee';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// POST /api/inventory/update — Manually set stock quantity for a variant
// Used from the Inventory page stock editor
export async function POST(request) {
  try {
    // Employee check
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

    const { variantId, quantity, lowStock } = await request.json();

    if (!variantId) {
      return NextResponse.json({ error: 'variantId is required' }, { status: 400 });
    }

    if (quantity === undefined || quantity === null) {
      return NextResponse.json({ error: 'quantity is required' }, { status: 400 });
    }

    const newQty = Math.max(0, Number(quantity));
    if (isNaN(newQty)) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    // Verify variant belongs to this store
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { storeId: true, id: true } } },
    });

    if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    if (variant.product.storeId !== storeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatePayload = { quantity: newQty };
    if (lowStock !== undefined) {
      updatePayload.lowStock = Math.max(1, Number(lowStock));
    }

    const inventory = await prisma.inventory.upsert({
      where: { variantId },
      update: updatePayload,
      create: {
        variantId,
        storeId,
        quantity: newQty,
        lowStock: updatePayload.lowStock ?? 10,
      },
    });

    return NextResponse.json({
      message: 'Stock updated successfully',
      inventory,
      stockStatus:
        newQty === 0
          ? 'OUT_OF_STOCK'
          : newQty <= inventory.lowStock
          ? 'LOW_STOCK'
          : 'IN_STOCK',
    });
  } catch (error) {
    console.error('POST /api/inventory/update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}