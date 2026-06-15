// app/api/store/create/route.js
import imagekit from '@/configs/imageKit';
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

// POST /api/store/create — Create a new store (pending approval)
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await ensureUserExists(userId);

    const formData = await request.formData();
    const name        = formData.get('name');
    const description = formData.get('description');
    const username    = formData.get('username');
    const address     = formData.get('address');
    const email       = formData.get('email');
    const contact     = formData.get('contact');
    const logoFile    = formData.get('image') || formData.get('logo');

    if (!name || !description || !username || !address || !email || !contact || !logoFile) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Username validation — lowercase, no spaces
    const cleanUsername = username.toLowerCase().trim().replace(/\s+/g, '-');

    const usernameTaken = await prisma.store.findUnique({ where: { username: cleanUsername } });
    if (usernameTaken) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    const existingStore = await prisma.store.findUnique({ where: { userId } });
    if (existingStore) {
      return NextResponse.json({ error: 'You already have a store' }, { status: 400 });
    }

    // Upload logo to ImageKit
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: logoFile.name,
      folder: 'stores',
    });

    const logo = imagekit.url({
      path: uploadResponse.filePath,
      transformation: [{ quality: 'auto' }, { format: 'webp' }, { width: '256' }],
    });

    // Create store + default commission (0%) in transaction
    const newStore = await prisma.$transaction(async (tx) => {
      const store = await tx.store.create({
        data: {
          userId,
          name,
          description,
          username: cleanUsername,
          address,
          email,
          contact,
          logo,
          status: 'PENDING',
          isActive: false,
        },
      });

      // Default commission: 0%
      await tx.commission.create({
        data: {
          storeId: store.id,
          percentage: 0,
        },
      });

      return store;
    });

    return NextResponse.json({
      message: 'Store created successfully. Awaiting admin approval.',
      store: newStore,
    });
  } catch (error) {
    console.error('POST /api/store/create error:', error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// GET /api/store/create — Get current user's store status
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const store = await prisma.store.findUnique({
      where: { userId },
      include: { commission: true },
    });

    if (!store) return NextResponse.json({ store: null, status: null });

    return NextResponse.json({ store, status: store.status });
  } catch (error) {
    console.error('GET /api/store/create error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}