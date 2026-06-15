// app/api/store/data/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/store/data?username=xyz — Public store profile + products
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username')?.toLowerCase().trim();

    if (!username) {
      return NextResponse.json({ error: 'Missing username' }, { status: 400 });
    }

    const store = await prisma.store.findUnique({
      where: { username, isActive: true, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        description: true,
        username: true,
        address: true,
        logo: true,
        email: true,
        contact: true,
        createdAt: true,
        products: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            brand: true,
            images: true,
            status: true,
            createdAt: true,
            variants: {
              select: {
                id: true,
                color: true,
                size: true,
                price: true,
                stock: true,
                sku: true,
              },
            },
            ratings: {
              select: {
                rating: true,
                review: true,
                createdAt: true,
                user: { select: { name: true, image: true } },
              },
            },
            categories: {
              include: {
                category: {
                  select: { id: true, name: true, isGlobal: true },
                },
              },
            },
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({ store });
  } catch (error) {
    console.error('GET /api/store/data error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}