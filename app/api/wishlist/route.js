// app/api/wishlist/route.js
import prisma from '@/lib/prisma';
import { clerkClient, getAuth } from '@clerk/nextjs/server';
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

// GET /api/wishlist — Fetch user's wishlist
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureUserExists(userId);

    const wishlist = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, images: true, status: true,
            store: { select: { id: true, name: true, username: true, logo: true } },
            variants: {
              select: { id: true, color: true, size: true, price: true, stock: true },
            },
            ratings: { select: { rating: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const items = wishlist.map((w) => ({
      id: w.id,
      productId: w.productId,
      product: w.product,
      createdAt: w.createdAt,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/wishlist error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// POST /api/wishlist — Toggle product in wishlist
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureUserExists(userId);

    const { productId } = await request.json();
    if (!productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 });

    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await prisma.wishlist.delete({ where: { userId_productId: { userId, productId } } });
      return NextResponse.json({ message: 'Removed from wishlist', added: false });
    }

    await prisma.wishlist.create({ data: { userId, productId } });
    return NextResponse.json({ message: 'Added to wishlist', added: true });
  } catch (error) {
    console.error('POST /api/wishlist error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}