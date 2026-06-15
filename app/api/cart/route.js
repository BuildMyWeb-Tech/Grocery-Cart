// app/api/cart/route.js
import prisma from '@/lib/prisma';
import { clerkClient, getAuth, auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

async function ensureUserExists(userId) {
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      image: clerkUser.imageUrl || '',
    },
  });
}

// POST /api/cart — Save cart to DB
// Cart item shape: { variantId, productId, storeId, quantity, price, ... }
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureUserExists(userId);

    const body = await request.json();
    const items = body.items ?? body.cart ?? [];

    // Validate cart items have required fields
    for (const item of items) {
      if (!item.variantId) {
        return NextResponse.json(
          { error: `Cart item missing variantId` },
          { status: 400 }
        );
      }
      if (!item.storeId) {
        return NextResponse.json(
          { error: `Cart item missing storeId` },
          { status: 400 }
        );
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { cart: items },
    });

    return NextResponse.json({ message: 'Cart saved' });
  } catch (error) {
    console.error('POST /api/cart error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// GET /api/cart — Fetch cart with live variant stock validation
export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureUserExists(userId);

    const user = await prisma.user.findUnique({ where: { id: userId } });

    const cartData  = user?.cart ?? [];
    const rawItems  = Array.isArray(cartData) ? cartData : (cartData.items ?? []);

    if (rawItems.length === 0) {
      return NextResponse.json({ items: [], totalPrice: 0, storeGroups: {} });
    }

    // Fetch live variant data for all cart items
    const variantIds = rawItems.map((item) => item.variantId).filter(Boolean);

    const liveVariants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        color: true,
        size: true,
        price: true,
        stock: true,
        sku: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            status: true,
            storeId: true,
            store: {
              select: { id: true, name: true, username: true, logo: true, isActive: true, status: true },
            },
          },
        },
      },
    });

    const variantMap = {};
    liveVariants.forEach((v) => { variantMap[v.id] = v; });

    // Enrich cart items with live data
    const enrichedItems = rawItems.map((item) => {
      const live = variantMap[item.variantId];

      if (!live) {
        return { ...item, removed: true, reason: 'Product no longer available' };
      }

      if (live.product.status !== 'ACTIVE' || !live.product.store.isActive) {
        return { ...item, removed: true, reason: 'Product or store is no longer active' };
      }

      const availableStock = live.stock;
      const outOfStock     = availableStock === 0;
      const safeQuantity   = outOfStock ? 0 : Math.min(item.quantity, availableStock);
      const stockWarning   = item.quantity > availableStock;

      return {
        ...item,
        // Live data overwrites stale cart data
        price: live.price,
        color: live.color,
        size: live.size,
        sku: live.sku,
        productName: live.product.name,
        productSlug: live.product.slug,
        productImage: live.product.images?.[0] || null,
        storeId: live.product.storeId,
        storeName: live.product.store.name,
        storeUsername: live.product.store.username,
        storeLogo: live.product.store.logo,
        quantity: safeQuantity,
        availableStock,
        outOfStock,
        stockWarning,
        removed: false,
      };
    });

    // Filter out removed items
    const validItems = enrichedItems.filter((item) => !item.removed);
    const removedItems = enrichedItems.filter((item) => item.removed);

    // Group by store for multi-store display
    const storeGroups = {};
    for (const item of validItems) {
      if (!storeGroups[item.storeId]) {
        storeGroups[item.storeId] = {
          storeId: item.storeId,
          storeName: item.storeName,
          storeUsername: item.storeUsername,
          storeLogo: item.storeLogo,
          items: [],
          subtotal: 0,
        };
      }
      storeGroups[item.storeId].items.push(item);
      storeGroups[item.storeId].subtotal += item.price * item.quantity;
    }

    const totalPrice = validItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    return NextResponse.json({
      items: validItems,
      removedItems,
      storeGroups,
      totalPrice,
    });
  } catch (error) {
    console.error('GET /api/cart error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}