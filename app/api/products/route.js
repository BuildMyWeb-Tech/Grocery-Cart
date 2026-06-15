// app/api/products/route.js
import prisma from '@/lib/prisma';
import authAdmin from '@/middlewares/authAdmin';
import authSeller from '@/middlewares/authSeller';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

async function resolveRole(request) {
  const { userId } = getAuth(request);
  if (!userId) return { role: 'PUBLIC', storeId: null };
  const isAdminUser = await authAdmin(userId);
  if (isAdminUser) return { role: 'ADMIN', storeId: null };
  const storeId = await authSeller(userId);
  if (storeId) return { role: 'STORE', storeId };
  return { role: 'PUBLIC', storeId: null };
}

// Exact fields that exist on Product model (no mrp — not in schema)
const PRODUCT_SELECT = {
  id:          true,
  name:        true,
  slug:        true,
  description: true,
  brand:       true,
  keyFeatures: true,
  images:      true,
  status:      true,
  storeId:     true,
  createdBy:   true,
  createdAt:   true,
  updatedAt:   true,
  store: {
    select: { id: true, name: true, username: true, logo: true },
  },
  variants: {
    select: {
      id: true, color: true, size: true,
      price: true, costPrice: true, stock: true, sku: true,
    },
  },
  categories: {
    include: {
      category: { select: { id: true, name: true, isGlobal: true } },
    },
  },
  ratings: {
    select: { rating: true },
  },
};

// Full select with user info for single product
const PRODUCT_SELECT_FULL = {
  ...PRODUCT_SELECT,
  ratings: {
    select: {
      id: true, rating: true, review: true, createdAt: true,
      user: { select: { id: true, name: true, image: true } },
    },
  },
};

function enrichProduct(p) {
  const prices     = (p.variants || []).map((v) => Number(v.price)).filter((x) => x > 0);
  const totalStock = (p.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0);
  const avgRating  = (p.ratings || []).length > 0
    ? (p.ratings || []).reduce((sum, r) => sum + r.rating, 0) / p.ratings.length
    : null;
  return {
    ...p,
    minPrice:    prices.length ? Math.min(...prices) : 0,
    maxPrice:    prices.length ? Math.max(...prices) : 0,
    totalStock,
    inStock:     totalStock > 0,
    avgRating:   avgRating ? Math.round(avgRating * 10) / 10 : null,
    ratingCount: (p.ratings || []).length,
  };
}

export async function GET(request) {
  try {
    const { role } = await resolveRole(request);
    const { searchParams } = new URL(request.url);

    const id          = searchParams.get('id');
    const search      = searchParams.get('search');
    const categoryId  = searchParams.get('category');
    const filterStore = searchParams.get('storeId');
    const page        = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit       = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const skip        = (page - 1) * limit;

    // ── Single product by id ──────────────────────────────────────
    if (id) {
      const product = await prisma.product.findUnique({
        where:  { id },
        select: PRODUCT_SELECT_FULL,
      });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ product: enrichProduct(product) });
    }

    // ── List products ─────────────────────────────────────────────
    let where = {};

    if (role === 'ADMIN') {
      where = {};
    } else {
      where = {
        status: 'ACTIVE',
        store:  { status: 'ACTIVE', isActive: true },
      };
    }

    if (filterStore) where.storeId = filterStore;

    if (search) {
      where.OR = [
        { name:        { contains: search, mode: 'insensitive' } },
        { brand:       { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categories = { some: { categoryId } };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select:  PRODUCT_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products:   products.map(enrichProduct),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}