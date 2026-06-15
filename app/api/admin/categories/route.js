// app/api/admin/categories/route.js
import imagekit from '@/configs/imageKit';
import prisma from '@/lib/prisma';
import authAdmin from '@/middlewares/authAdmin';
import { getAdminUserId } from '@/lib/getAdminUserId';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const userId = await getAdminUserId(request);
    const isAdminUser = await authAdmin(userId);
    if (!isAdminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const categories = await prisma.category.findMany({
      where: { isGlobal: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('GET /api/admin/categories error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getAdminUserId(request);
    const isAdminUser = await authAdmin(userId);
    if (!isAdminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const formData    = await request.formData();
    const name        = formData.get('name')?.trim();
    const description = formData.get('description')?.trim();
    const imageFile   = formData.get('image');

    if (!name || !description || !imageFile) {
      return NextResponse.json({ error: 'Name, description and image are required' }, { status: 400 });
    }

    const existing = await prisma.category.findFirst({ where: { name, isGlobal: true } });
    if (existing) return NextResponse.json({ error: 'A global category with this name already exists' }, { status: 400 });

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const uploadResponse = await imagekit.upload({ file: buffer, fileName: imageFile.name, folder: 'categories/global' });
    const imageUrl = imagekit.url({
      path: uploadResponse.filePath,
      transformation: [{ quality: 'auto' }, { format: 'webp' }, { width: '512' }],
    });

    const category = await prisma.category.create({
      data: { name, description, image: imageUrl, isGlobal: true, storeId: null },
    });
    return NextResponse.json({ message: 'Global category created successfully', category });
  } catch (error) {
    console.error('POST /api/admin/categories error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const userId = await getAdminUserId(request);
    const isAdminUser = await authAdmin(userId);
    if (!isAdminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const formData    = await request.formData();
    const id          = formData.get('id');
    const name        = formData.get('name')?.trim();
    const description = formData.get('description')?.trim();
    const imageFile   = formData.get('image');

    if (!id || !name || !description) {
      return NextResponse.json({ error: 'ID, name and description are required' }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || !existing.isGlobal) return NextResponse.json({ error: 'Global category not found' }, { status: 404 });

    const nameConflict = await prisma.category.findFirst({ where: { name, isGlobal: true, NOT: { id } } });
    if (nameConflict) return NextResponse.json({ error: 'Another global category with this name exists' }, { status: 400 });

    let imageUrl = existing.image;
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResponse = await imagekit.upload({ file: buffer, fileName: imageFile.name, folder: 'categories/global' });
      imageUrl = imagekit.url({
        path: uploadResponse.filePath,
        transformation: [{ quality: 'auto' }, { format: 'webp' }, { width: '512' }],
      });
    }

    const updated = await prisma.category.update({ where: { id }, data: { name, description, image: imageUrl } });
    return NextResponse.json({ message: 'Category updated successfully', category: updated });
  } catch (error) {
    console.error('PUT /api/admin/categories error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const userId = await getAdminUserId(request);
    const isAdminUser = await authAdmin(userId);
    if (!isAdminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing || !existing.isGlobal) return NextResponse.json({ error: 'Global category not found' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.productCategory.deleteMany({ where: { categoryId: id } });
      await tx.category.delete({ where: { id } });
    });

    return NextResponse.json({ message: 'Category deleted successfully', affectedProducts: existing._count.products });
  } catch (error) {
    console.error('DELETE /api/admin/categories error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}