// C:\Users\Siddharathan\Desktop\gocart-ecommerce-full-stack\app\api\address\route.js
import prisma from '@/lib/prisma';
import { clerkClient, getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// ─── Inline helper: create DB user from Clerk if not exists ───
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

// GET — fetch all addresses for user
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await ensureUserExists(userId);

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('GET /api/address error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// POST — create a new address
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await ensureUserExists(userId);

    const body = await request.json();
    const { name, email, street, city, state, zip, country, phone } = body;

    if (!name || !email || !street || !city || !state || !zip || !country || !phone) {
      return NextResponse.json({ message: 'All address fields are required' }, { status: 400 });
    }

    const newAddress = await prisma.address.create({
      data: { userId, name, email, street, city, state, zip, country, phone },
    });

    // ✅ Return as newAddress so frontend dispatch works correctly
    return NextResponse.json({ message: 'Address saved successfully', newAddress });
  } catch (error) {
    console.error('POST /api/address error:', error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

// DELETE — remove an address
export async function DELETE(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Address ID required' }, { status: 400 });

    // Verify ownership before deleting
    const address = await prisma.address.findFirst({ where: { id, userId } });
    if (!address) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

    await prisma.address.delete({ where: { id } });

    return NextResponse.json({ message: 'Address deleted' });
  } catch (error) {
    console.error('DELETE /api/address error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
