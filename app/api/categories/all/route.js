// app/api/categories/all/route.js
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/categories/all — Public endpoint
// Returns all global categories + all store categories
// Used by: shop page, product detail, CategoriesMarquee, ProductCategories
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId'); // optional: filter by store

    const where = storeId
      ? { OR: [{ isGlobal: true }, { storeId }] }
      : {};

    const categories = await prisma.category.findMany({
      where,
      orderBy: [
        { isGlobal: 'desc' }, // global categories first
        { createdAt: 'desc' },
      ],
      include: {
        store: { select: { name: true, username: true } },
      },
    });

    // Group for convenience
    const global = categories.filter((c) => c.isGlobal);
    const store  = categories.filter((c) => !c.isGlobal);

    return NextResponse.json({ categories, global, store });
  } catch (error) {
    console.error('GET /api/categories/all error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}