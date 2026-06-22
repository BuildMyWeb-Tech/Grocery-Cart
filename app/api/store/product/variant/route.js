// app/api/store/product/variant/route.js
import prisma from '@/lib/prisma';
import authSeller from '@/middlewares/authSeller';
import verifyEmployeeToken, { hasPermission, PERMISSIONS } from '@/middlewares/authEmployee';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// ── Resolve store auth ────────────────────────────────────────────────────────
async function resolveStoreAuth(request) {
  const employee = verifyEmployeeToken(request);
  if (employee) return { storeId: employee.storeId, employee, source: 'employee' };

  const { userId } = getAuth(request);
  if (!userId) return { storeId: null };
  const storeId = await authSeller(userId);
  return { storeId, source: 'owner' };
}

// PATCH /api/store/product/variant?id=<variantId>
// Update variant name, price, costPrice, sku, current stock, minimum stock
export async function PATCH(request) {
  try {
    const { storeId, employee, source } = await resolveStoreAuth(request);
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Employees need MANAGE_INVENTORY to update stock, EDIT_PRODUCT to update price/details
    // We'll check EDIT_PRODUCT as the base permission for variant edits
    if (source === 'employee' && !hasPermission(employee, PERMISSIONS.EDIT_PRODUCT)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get('id');
    if (!variantId) return NextResponse.json({ error: 'Variant ID required' }, { status: 400 });

    // Verify the variant belongs to this store
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { storeId: true, id: true } } },
    });

    if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    if (variant.product.storeId !== storeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { price, costPrice, variantName, sku, stock, minStock } = body;

    // Fields that live directly on ProductVariant
    const updateData = {};

    if (price !== undefined) {
      const num = Number(price);
      if (isNaN(num) || num <= 0) {
        return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
      }
      updateData.price = num;
    }

    if (costPrice !== undefined) {
      const num = Number(costPrice);
      if (isNaN(num) || num < 0) {
        return NextResponse.json({ error: 'Invalid cost price' }, { status: 400 });
      }
      updateData.costPrice = num;
    }

    if (variantName !== undefined) {
      if (!variantName.trim()) {
        return NextResponse.json({ error: 'Variant name cannot be empty' }, { status: 400 });
      }
      updateData.variantName = variantName.trim();
    }

    if (sku !== undefined) {
      // Check SKU uniqueness
      const skuExists = await prisma.productVariant.findFirst({
        where: { sku: sku.trim(), id: { not: variantId } },
      });
      if (skuExists) {
        return NextResponse.json({ error: 'SKU already in use' }, { status: 400 });
      }
      updateData.sku = sku.trim();
    }

    // Stock and minimum stock live on Inventory, not ProductVariant
    const inventoryUpdate = {};

    if (stock !== undefined) {
      const num = Math.max(0, Number(stock));
      if (isNaN(num)) return NextResponse.json({ error: 'Invalid stock value' }, { status: 400 });
      inventoryUpdate.quantity = num;
    }

    if (minStock !== undefined) {
      const num = Math.max(0, Number(minStock));
      if (isNaN(num)) return NextResponse.json({ error: 'Invalid minimum stock value' }, { status: 400 });
      inventoryUpdate.lowStock = num;
    }

    if (Object.keys(updateData).length === 0 && Object.keys(inventoryUpdate).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(updateData).length > 0) {
        await tx.productVariant.update({
          where: { id: variantId },
          data: updateData,
        });
      }

      if (Object.keys(inventoryUpdate).length > 0) {
        await tx.inventory.upsert({
          where: { variantId },
          update: inventoryUpdate,
          create: {
            variantId,
            storeId,
            quantity: inventoryUpdate.quantity ?? 0,
            lowStock: inventoryUpdate.lowStock ?? 10,
          },
        });
      }
    });

    const updated = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { inventory: true },
    });

    return NextResponse.json({ message: 'Variant updated successfully', variant: updated });
  } catch (error) {
    console.error('PATCH /api/store/product/variant error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE /api/store/product/variant?id=<variantId>
// Delete a single variant (cannot delete last variant of a product)
export async function DELETE(request) {
  try {
    const { storeId, employee, source } = await resolveStoreAuth(request);
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (source === 'employee' && !hasPermission(employee, PERMISSIONS.EDIT_PRODUCT)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const variantId = searchParams.get('id');
    if (!variantId) return NextResponse.json({ error: 'Variant ID required' }, { status: 400 });

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { storeId: true, id: true } } },
    });

    if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    if (variant.product.storeId !== storeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent deleting the last variant
    const variantCount = await prisma.productVariant.count({
      where: { productId: variant.product.id },
    });
    if (variantCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last variant. Delete the product instead.' },
        { status: 400 }
      );
    }

    // Cascade deletes inventory via schema
    await prisma.productVariant.delete({ where: { id: variantId } });

    return NextResponse.json({ message: 'Variant deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/store/product/variant error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/store/product/variant?productId=<productId>
// Add a new variant to an existing product
export async function POST(request) {
  try {
    const { storeId, employee, source } = await resolveStoreAuth(request);
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (source === 'employee' && !hasPermission(employee, PERMISSIONS.EDIT_PRODUCT)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    if (!productId) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const product = await prisma.product.findFirst({ where: { id: productId, storeId } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const body = await request.json();
    const { variantName, price, costPrice, sku, stock, minStock } = body;

    if (!variantName || !sku || !price) {
      return NextResponse.json(
        { error: 'Variant name, SKU and price are required' },
        { status: 400 }
      );
    }

    // SKU uniqueness
    const skuExists = await prisma.productVariant.findUnique({ where: { sku: sku.trim() } });
    if (skuExists) {
      return NextResponse.json({ error: 'SKU already in use' }, { status: 400 });
    }

    const variant = await prisma.$transaction(async (tx) => {
      const created = await tx.productVariant.create({
        data: {
          productId,
          variantName: variantName.trim(),
          price: Number(price),
          costPrice: Number(costPrice || 0),
          sku: sku.trim(),
        },
      });

      await tx.inventory.create({
        data: {
          variantId: created.id,
          storeId,
          quantity: Math.max(0, Number(stock || 0)),
          lowStock: Math.max(0, Number(minStock ?? 10)),
        },
      });

      return tx.productVariant.findUnique({
        where: { id: created.id },
        include: { inventory: true },
      });
    });

    return NextResponse.json(
      { message: 'Variant added successfully', variant },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/store/product/variant error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}