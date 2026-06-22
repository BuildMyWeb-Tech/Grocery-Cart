// app/api/orders/route.js
import prisma from '@/lib/prisma';
import { clerkClient, auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

async function ensureUserExists(userId) {
  const client    = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  await prisma.user.upsert({
    where:  { id: userId },
    update: {},
    create: {
      id:    userId,
      name:  `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
      email: clerkUser.emailAddresses[0]?.emailAddress || '',
      image: clerkUser.imageUrl || '',
    },
  });
}

// GET /api/orders — Fetch all orders for the logged-in buyer
export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureUserExists(userId);

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            variant: {
              select: {
                id: true, variantName: true, price: true, sku: true,
                product: { select: { id: true, name: true, images: true, slug: true } },
              },
            },
          },
        },
        address:  true,
        store:    { select: { id: true, name: true, username: true, logo: true } },
        timeline: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// POST /api/orders — Create orders (auto-split by store)
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureUserExists(userId);

    const body = await request.json();
    const { items, addressId, paymentMethod, couponCode } = body;

    if (!items || items.length === 0)
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    if (!addressId)
      return NextResponse.json({ error: 'Delivery address is required' }, { status: 400 });
    if (!['COD', 'STRIPE'].includes(paymentMethod))
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });

    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address)
      return NextResponse.json({ error: 'Address not found' }, { status: 400 });

    const variantIds = items.map((i) => i.variantId);
    const variants   = await prisma.productVariant.findMany({
      where:   { id: { in: variantIds } },
      include: {
        inventory: true,
        product: {
          select: {
            id: true, name: true, storeId: true, status: true,
            store: { select: { id: true, name: true, isActive: true, status: true } },
          },
        },
      },
    });

    const variantMap = {};
    variants.forEach((v) => { variantMap[v.id] = v; });

    // Stock validation — reads from Inventory, not the (now-removed) ProductVariant.stock
    const stockErrors = [];
    for (const item of items) {
      const variant = variantMap[item.variantId];
      if (!variant) { stockErrors.push(`Variant ${item.variantId} not found`); continue; }
      if (variant.product.status !== 'ACTIVE') { stockErrors.push(`"${variant.product.name}" is not available`); continue; }
      if (!variant.product.store.isActive || variant.product.store.status !== 'ACTIVE') { stockErrors.push(`Store for "${variant.product.name}" is not active`); continue; }
      const available = variant.inventory?.quantity ?? 0;
      if (available < item.quantity) {
        stockErrors.push(available === 0
          ? `"${variant.product.name}" (${variant.variantName}) is out of stock`
          : `"${variant.product.name}" (${variant.variantName}) only has ${available} in stock`
        );
      }
    }
    if (stockErrors.length > 0)
      return NextResponse.json({ error: stockErrors.join('. ') }, { status: 400 });

    // Coupon
    let coupon = null;
    let discountPct = 0;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && new Date(coupon.expiresAt) > new Date()) {
        discountPct = coupon.discount;
      } else {
        coupon = null;
      }
    }

    // Group by store
    const storeGroups = {};
    for (const item of items) {
      const storeId = variantMap[item.variantId].product.storeId;
      if (!storeGroups[storeId]) storeGroups[storeId] = [];
      storeGroups[storeId].push({ ...item, variant: variantMap[item.variantId] });
    }

    const storeIds    = Object.keys(storeGroups);
    const commissions = await prisma.commission.findMany({ where: { storeId: { in: storeIds } } });
    const commissionMap = {};
    commissions.forEach((c) => { commissionMap[c.storeId] = c.percentage; });

    // Collect variantIds being purchased so we can remove only those
    // from the user's cart (in case the cart had items from a different
    // session/device that weren't part of this order)
    const purchasedVariantIds = new Set(items.map((i) => i.variantId));

    // Create orders in transaction
    const createdOrders = await prisma.$transaction(async (tx) => {
      const orders = [];

      for (const [storeId, storeItems] of Object.entries(storeGroups)) {
        const subtotal      = storeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        const discountAmt   = discountPct > 0 ? (subtotal * discountPct) / 100 : 0;
        const commissionAmt = ((commissionMap[storeId] ?? 0) * subtotal) / 100;
        const total          = subtotal - discountAmt;

        const order = await tx.order.create({
          data: {
            userId, storeId, addressId,
            subtotal, shippingCost: 0, commissionAmt, total,
            status: 'PENDING', isPaid: false, paymentMethod,
            isCouponUsed:   !!coupon,
            couponCode:     coupon?.code || null,
            couponDiscount: discountAmt,
            orderItems: {
              create: storeItems.map((item) => ({
                variantId: item.variantId,
                productId: item.variant.product.id,
                quantity:  item.quantity,
                price:     item.price,
              })),
            },
          },
        });

        await tx.orderTimeline.create({
          data: { orderId: order.id, status: 'PENDING', changedBy: 'SYSTEM', note: 'Order placed successfully' },
        });

        // Decrement stock via Inventory — re-checked fresh inside the transaction
        for (const item of storeItems) {
          const freshInv = await tx.inventory.findUnique({
            where:  { variantId: item.variantId },
            select: { quantity: true },
          });
          const currentQty = freshInv?.quantity ?? 0;
          if (currentQty < item.quantity) {
            throw new Error(`Insufficient stock for "${item.variant.product.name}" (${item.variant.variantName})`);
          }
          const newStock = currentQty - item.quantity;
          await tx.inventory.upsert({
            where:  { variantId: item.variantId },
            update: { quantity: newStock },
            create: { variantId: item.variantId, storeId, quantity: newStock, lowStock: 10 },
          });
        }

        orders.push(order);
      }

      // Clear purchased items from the user's server-side cart.
      const currentUser = await tx.user.findUnique({ where: { id: userId }, select: { cart: true } });
      const currentCart = Array.isArray(currentUser?.cart) ? currentUser.cart : [];
      const remainingCart = currentCart.filter(
        (cartItem) => !purchasedVariantIds.has(cartItem.variantId)
      );

      await tx.user.update({
        where: { id: userId },
        data:  { cart: remainingCart },
      });

      return orders;
    }, { timeout: 20000, maxWait: 10000 });

    // Stripe payment
    if (paymentMethod === 'STRIPE') {
      if (!stripe) {
        return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
      }

      const lineItems = items.map((item) => {
        const variant = variantMap[item.variantId];
        return {
          price_data: {
            currency: 'inr',
            product_data: { name: `${variant.product.name} (${variant.variantName})` },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        };
      });

      // Build a guaranteed-https base URL (fixes "Invalid URL: explicit scheme required")
      let baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      if (!baseUrl) {
        const host = request.headers.get('host');
        baseUrl = `https://${host}`;
      } else if (!/^https?:\/\//i.test(baseUrl)) {
        baseUrl = `https://${baseUrl}`;
      }
      baseUrl = baseUrl.replace(/\/+$/, ''); // strip trailing slash

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items:   lineItems,
        mode:         'payment',
        success_url:  `${baseUrl}/orders?payment=success`,
        cancel_url:   `${baseUrl}/cart?payment=cancelled`,
        metadata:     { orderIds: createdOrders.map((o) => o.id).join(',') },
      });

      return NextResponse.json({
        message: `${createdOrders.length} order(s) placed successfully`,
        orders:  createdOrders,
        session,
      });
    }

    return NextResponse.json({
      message: `${createdOrders.length} order(s) placed successfully`,
      orders:  createdOrders,
    });

  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}