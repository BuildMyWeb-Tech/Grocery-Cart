// app/api/categories/route.js
import imagekit from '@/configs/imageKit';
import prisma from '@/lib/prisma';
import authAdmin from '@/middlewares/authAdmin';
import authSeller from '@/middlewares/authSeller';
import verifyEmployeeToken, { hasPermission, PERMISSIONS } from '@/middlewares/authEmployee';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// ── Resolve caller identity ───────────────────────────────────────────────────
async function resolveRole(request) {
  // 1. Employee JWT
  const employee = verifyEmployeeToken(request);
  if (employee) return { role: 'EMPLOYEE', storeId: employee.storeId, employee };

  const { userId } = getAuth(request);
  if (!userId) return { role: 'PUBLIC', storeId: null };

  // 2. Admin check
  const isAdminUser = await authAdmin(userId);
  if (isAdminUser) return { role: 'ADMIN', storeId: null, userId };

  // 3. Store owner check
  const storeId = await authSeller(userId);
  if (storeId) return { role: 'STORE', storeId, userId };

  return { role: 'PUBLIC', storeId: null };
}

// GET /api/categories — Scoped category fetch
// Admin    → all categories
// Store    → global + own store categories
// Employee → global + their store categories
// Public   → global only
export async function GET(request) {
  try {
    const { role, storeId } = await resolveRole(request);
    const { searchParams } = new URL(request.url);
    const filterStoreId = searchParams.get('storeId');

    let where = {};

    if (role === 'ADMIN') {
      where = filterStoreId ? { storeId: filterStoreId } : {};
    } else if (role === 'STORE' || role === 'EMPLOYEE') {
      where = {
        OR: [
          { isGlobal: true },
          { storeId },
        ],
      };
    } else {
      // Public: global only
      where = { isGlobal: true };
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        store: { select: { name: true, username: true } },
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/categories — Create a store category
// Store owner or employee with MANAGE_CATEGORIES permission
export async function POST(request) {
  try {
    const { role, storeId, employee } = await resolveRole(request);

    if (role === 'PUBLIC') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    // Admin uses /api/admin/categories for global categories
    if (role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Admins create global categories via /api/admin/categories' },
        { status: 400 }
      );
    }

    // Employee permission check
    if (role === 'EMPLOYEE') {
      if (!hasPermission(employee, PERMISSIONS.MANAGE_CATEGORIES)) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
    }

    const formData = await request.formData();
    const name        = formData.get('name')?.trim();
    const description = formData.get('description')?.trim();
    const imageFile   = formData.get('image');

    if (!name || !description || !imageFile) {
      return NextResponse.json(
        { error: 'Name, description and image are required' },
        { status: 400 }
      );
    }

    // Store categories must be unique within that store
    const existing = await prisma.category.findFirst({
      where: { name, storeId },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'A category with this name already exists in your store' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: imageFile.name,
      folder: 'categories/store',
    });
    const imageUrl = imagekit.url({
      path: uploadResponse.filePath,
      transformation: [{ quality: 'auto' }, { format: 'webp' }, { width: '512' }],
    });

    const category = await prisma.category.create({
      data: {
        name,
        description,
        image: imageUrl,
        isGlobal: false,
        storeId,
      },
      include: {
        store: { select: { name: true, username: true } },
      },
    });

    return NextResponse.json({ message: 'Category created successfully', category });
  } catch (error) {
    console.error('POST /api/categories error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/categories — Edit a store category
export async function PUT(request) {
  try {
    const { role, storeId, employee } = await resolveRole(request);

    if (role === 'PUBLIC') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    if (role === 'EMPLOYEE') {
      if (!hasPermission(employee, PERMISSIONS.MANAGE_CATEGORIES)) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
    }

    const formData = await request.formData();
    const id          = formData.get('id');
    const name        = formData.get('name')?.trim();
    const description = formData.get('description')?.trim();
    const imageFile   = formData.get('image');

    if (!id || !name || !description) {
      return NextResponse.json({ error: 'ID, name and description are required' }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Store/Employee can only edit their own store's categories (not global)
    if (role !== 'ADMIN') {
      if (existing.isGlobal) {
        return NextResponse.json({ error: 'Cannot edit global categories' }, { status: 403 });
      }
      if (existing.storeId !== storeId) {
        return NextResponse.json({ error: 'You can only edit your own categories' }, { status: 403 });
      }
    }

    // Check name conflict within same scope
    const nameConflict = await prisma.category.findFirst({
      where: {
        name,
        storeId: existing.storeId,
        isGlobal: existing.isGlobal,
        NOT: { id },
      },
    });
    if (nameConflict) {
      return NextResponse.json(
        { error: 'Another category with this name already exists' },
        { status: 400 }
      );
    }

    let imageUrl = existing.image;
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const uploadResponse = await imagekit.upload({
        file: buffer,
        fileName: imageFile.name,
        folder: 'categories/store',
      });
      imageUrl = imagekit.url({
        path: uploadResponse.filePath,
        transformation: [{ quality: 'auto' }, { format: 'webp' }, { width: '512' }],
      });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name, description, image: imageUrl },
      include: { store: { select: { name: true, username: true } } },
    });

    return NextResponse.json({ message: 'Category updated successfully', category: updated });
  } catch (error) {
    console.error('PUT /api/categories error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/categories — Delete a store category
export async function DELETE(request) {
  try {
    const { role, storeId, employee } = await resolveRole(request);

    if (role === 'PUBLIC') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    if (role === 'EMPLOYEE') {
      if (!hasPermission(employee, PERMISSIONS.MANAGE_CATEGORIES)) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Store/Employee cannot delete global categories
    if (role !== 'ADMIN' && existing.isGlobal) {
      return NextResponse.json({ error: 'Cannot delete global categories' }, { status: 403 });
    }

    // Store/Employee can only delete their own store categories
    if (role !== 'ADMIN' && existing.storeId !== storeId) {
      return NextResponse.json({ error: 'You can only delete your own categories' }, { status: 403 });
    }

    // Remove from join table then delete category
    await prisma.$transaction(async (tx) => {
      await tx.productCategory.deleteMany({ where: { categoryId: id } });
      await tx.category.delete({ where: { id } });
    });

    return NextResponse.json({
      message: 'Category deleted. Products are kept but unlinked from this category.',
      affectedProducts: existing._count.products,
    });
  } catch (error) {
    console.error('DELETE /api/categories error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}