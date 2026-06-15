// app/api/inventory/route.js
import prisma from '@/lib/prisma';
import authSeller from '@/middlewares/authSeller';
import authAdmin from '@/middlewares/authAdmin';
import verifyEmployeeToken, { hasPermission, PERMISSIONS } from '@/middlewares/authEmployee';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// ── Resolve store auth ────────────────────────────────────────────────────────
async function resolveStoreAuth(request, requirePermission = null) {
  // Employee JWT
  const employee = verifyEmployeeToken(request);
  if (employee) {
    if (requirePermission && !hasPermission(employee, requirePermission)) {
      return { storeId: null, error: 'Permission denied' };
    }
    return { storeId: employee.storeId, employee, source: 'employee' };
  }

  // Clerk auth
  const { userId } = getAuth(request);
  if (!userId) return { storeId: null, error: 'Unauthorized' };

  // Admin check
  const isAdminUser = await authAdmin(userId);
  if (isAdminUser) return { storeId: null, isAdmin: true, userId, source: 'admin' };

  // Store owner
  const storeId = await authSeller(userId);
  if (!storeId) return { storeId: null, error: 'Unauthorized' };
  return { storeId, userId, source: 'owner' };
}

// GET /api/inventory — Fetch inventory
// Admin: all stores or filtered by ?storeId=
// Store/Employee: own store only
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterStoreId = searchParams.get('storeId');
    const search        = searchParams.get('search');
    const lowStockOnly  = searchParams.get('lowStock') === 'true';

    const auth = await resolveStoreAuth(request);

    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    // Determine which store(s) to query
    let storeWhere = {};
    if (auth.isAdmin) {
      if (filterStoreId) storeWhere = { storeId: filterStoreId };
    } else {
      storeWhere = { storeId: auth.storeId };
    }

    // Build variant/product search filter
    let variantWhere = { ...storeWhere };

    if (search) {
      variantWhere.variant = {
        product: {
          name: { contains: search, mode: 'insensitive' },
        },
      };
    }

    const inventory = await prisma.inventory.findMany({
      where: variantWhere,
      include: {
        variant: {
          select: {
            id: true,
            color: true,
            size: true,
            price: true,
            costPrice: true,
            sku: true,
            stock: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                status: true,
                store: {
                  select: { id: true, name: true, username: true },
                },
              },
            },
          },
        },
        store: {
          select: { id: true, name: true, username: true },
        },
      },
      orderBy: { quantity: 'asc' },
    });

    // Filter low stock on app level (quantity <= lowStock threshold)
    const filtered = lowStockOnly
      ? inventory.filter((inv) => inv.quantity <= inv.lowStock && inv.quantity > 0)
      : inventory;

    // Enrich with status
    const enriched = filtered.map((inv) => ({
      ...inv,
      stockStatus:
        inv.quantity === 0
          ? 'OUT_OF_STOCK'
          : inv.quantity <= inv.lowStock
          ? 'LOW_STOCK'
          : 'IN_STOCK',
    }));

    return NextResponse.json({ inventory: enriched });
  } catch (error) {
    console.error('GET /api/inventory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/inventory — Set stock quantity + lowStock threshold for a variant
export async function POST(request) {
  try {
    const auth = await resolveStoreAuth(request, PERMISSIONS.MANAGE_INVENTORY);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
    if (auth.isAdmin) return NextResponse.json({ error: 'Admins do not manage store inventory' }, { status: 403 });

    const { variantId, quantity, lowStock } = await request.json();

    if (!variantId) {
      return NextResponse.json({ error: 'variantId is required' }, { status: 400 });
    }

    // Verify variant belongs to this store
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { storeId: true } } },
    });

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    if (variant.product.storeId !== auth.storeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const newQty       = Math.max(0, Number(quantity ?? 0));
    const newLowStock  = Math.max(1, Number(lowStock ?? 10));

    // Update both inventory record and variant stock in sync
    const [inventory] = await prisma.$transaction([
      prisma.inventory.upsert({
        where: { variantId },
        update: { quantity: newQty, lowStock: newLowStock },
        create: {
          variantId,
          storeId: auth.storeId,
          quantity: newQty,
          lowStock: newLowStock,
        },
      }),
      prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: newQty },
      }),
    ]);

    return NextResponse.json({ message: 'Inventory updated', inventory });
  } catch (error) {
    console.error('POST /api/inventory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/inventory — Update lowStock threshold only
export async function PATCH(request) {
  try {
    const auth = await resolveStoreAuth(request, PERMISSIONS.MANAGE_INVENTORY);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });
    if (auth.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { variantId, lowStock } = await request.json();

    if (!variantId) {
      return NextResponse.json({ error: 'variantId is required' }, { status: 400 });
    }

    if (lowStock === undefined || lowStock === null) {
      return NextResponse.json({ error: 'lowStock is required' }, { status: 400 });
    }

    // Verify variant belongs to this store
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { storeId: true } } },
    });

    if (!variant) return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    if (variant.product.storeId !== auth.storeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const inventory = await prisma.inventory.upsert({
      where: { variantId },
      update: { lowStock: Math.max(1, Number(lowStock)) },
      create: {
        variantId,
        storeId: auth.storeId,
        quantity: variant.stock,
        lowStock: Math.max(1, Number(lowStock)),
      },
    });

    return NextResponse.json({ message: 'Low stock threshold updated', inventory });
  } catch (error) {
    console.error('PATCH /api/inventory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}