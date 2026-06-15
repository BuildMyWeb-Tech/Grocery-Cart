// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\app\api\stores\active\route.js

import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/stores/active — Public endpoint
// Returns all approved/active stores for "Sort by Store" dropdowns etc.
export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      where: { status: 'ACTIVE', isActive: true },
      select: { id: true, name: true, username: true, logo: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ stores });
  } catch (error) {
    console.error('GET /api/stores/active error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}