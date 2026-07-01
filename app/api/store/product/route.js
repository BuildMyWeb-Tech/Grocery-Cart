// app/api/store/product/route.js
import prisma from '@/lib/prisma';
import authSeller from '@/middlewares/authSeller';
import verifyEmployeeToken, { hasPermission, PERMISSIONS } from '@/middlewares/authEmployee';
import imagekit from '@/configs/imageKit';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// ── Slug generator ────────────────────────────────────────────────────────────
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── Resolve store auth (owner or employee) ────────────────────────────────────
async function resolveStoreAuth(request) {
  const employee = verifyEmployeeToken(request);
  if (employee) return { storeId: employee.storeId, employee, source: 'employee' };

  const { userId } = getAuth(request);
  if (!userId) return { storeId: null };
  const storeId = await authSeller(userId);
  return { storeId, source: 'owner' };
}

// ── POST /api/store/product — Create product with variants ────────────────────
export async function POST(request) {
  try {
    const { storeId, employee, source } = await resolveStoreAuth(request);
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (source === 'employee' && !hasPermission(employee, PERMISSIONS.ADD_PRODUCT)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { userId } = source === 'owner' ? getAuth(request) : {};

    const formData = await request.formData();

    const name            = formData.get('name')?.trim();
    const description     = formData.get('description')?.trim();
    const statusRaw        = formData.get('status');
    const status           = ['ACTIVE', 'INACTIVE', 'DRAFT', 'OUT_OF_STOCK'].includes(statusRaw) ? statusRaw : 'ACTIVE';
    const isOrganic         = formData.get('isOrganic') === 'true';
    const isFeatured         = formData.get('isFeatured') === 'true';
    const keyFeaturesRaw  = formData.get('keyFeatures');
    const categoryIdsRaw  = formData.get('categoryIds');
    const variantsRaw     = formData.get('variants');
    const images          = formData.getAll('images');

    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
    }

    if (images.length < 1 || images.length > 10) {
      return NextResponse.json(
        { error: 'Between 1 and 10 images are required' },
        { status: 400 }
      );
    }

    let categoryIds = [];
    try {
      categoryIds = JSON.parse(categoryIdsRaw || '[]');
      if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return NextResponse.json({ error: 'At least one category is required' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid categoryIds format' }, { status: 400 });
    }

    let variantList = [];
    try {
      variantList = JSON.parse(variantsRaw || '[]');
    } catch {
      return NextResponse.json({ error: 'Invalid variants format' }, { status: 400 });
    }

    if (!Array.isArray(variantList) || variantList.length === 0) {
      return NextResponse.json({ error: 'At least one variant is required' }, { status: 400 });
    }

    for (const v of variantList) {
      if (!v.variantName || !v.sku) {
        return NextResponse.json(
          { error: 'Each variant must have a variant name and SKU' },
          { status: 400 }
        );
      }
      if (isNaN(Number(v.price)) || Number(v.price) <= 0) {
        return NextResponse.json({ error: 'Each variant must have a valid price' }, { status: 400 });
      }
    }

    const skus = variantList.map((v) => v.sku);
    if (new Set(skus).size !== skus.length) {
      return NextResponse.json({ error: 'Duplicate SKUs in variants' }, { status: 400 });
    }

    const existingSkus = await prisma.productVariant.findMany({
      where: { sku: { in: skus } },
      select: { sku: true },
    });
    if (existingSkus.length > 0) {
      return NextResponse.json(
        { error: `SKU already exists: ${existingSkus.map((s) => s.sku).join(', ')}` },
        { status: 400 }
      );
    }

    const validCategories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        OR: [{ isGlobal: true }, { storeId }],
      },
    });
    if (validCategories.length !== categoryIds.length) {
      return NextResponse.json({ error: 'One or more invalid category IDs' }, { status: 400 });
    }

    let slug = generateSlug(name);
    const slugExists = await prisma.product.findFirst({ where: { slug, storeId } });
    if (slugExists) slug = `${slug}-${Date.now()}`;

    const imageUrls = await Promise.all(
      images.map(async (image) => {
        const buffer = Buffer.from(await image.arrayBuffer());
        const res = await imagekit.upload({
          file: buffer,
          fileName: image.name,
          folder: 'products',
        });
        return imagekit.url({
          path: res.filePath,
          transformation: [{ quality: 'auto' }, { format: 'webp' }, { width: '1024' }],
        });
      })
    );

    let keyFeatures = [];
    try {
      keyFeatures = JSON.parse(keyFeaturesRaw || '[]');
      if (!Array.isArray(keyFeatures)) keyFeatures = [];
    } catch {
      keyFeatures = [];
    }
    keyFeatures = keyFeatures.filter((f) => typeof f === 'string' && f.trim() !== '');

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          storeId,
          name,
          slug,
          description,
          keyFeatures,
          images: imageUrls,
          isOrganic,
          isFeatured,
          status,
          createdBy: source === 'employee' ? employee.employeeId : 'owner',
        },
      });

      await tx.productCategory.createMany({
        data: categoryIds.map((categoryId) => ({
          productId: created.id,
          categoryId,
        })),
      });

      for (const v of variantList) {
        const variant = await tx.productVariant.create({
          data: {
            productId: created.id,
            variantName: v.variantName.trim(),
            price: Number(v.price),
            costPrice: Number(v.costPrice || 0),
            sku: v.sku.trim(),
          },
        });

        await tx.inventory.create({
          data: {
            variantId: variant.id,
            storeId,
            quantity: Math.max(0, Number(v.stock || 0)),
            lowStock: Math.max(0, Number(v.minStock ?? 10)),
          },
        });
      }

      return tx.product.findUnique({
        where: { id: created.id },
        include: {
          variants: { include: { inventory: true } },
          categories: { include: { category: true } },
        },
      });
    }, { timeout: 20000, maxWait: 10000 });

    return NextResponse.json(
      { message: 'Product created successfully', product },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/store/product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── GET /api/store/product — List store's own products ────────────────────────
export async function GET(request) {
  try {
    const { storeId, employee, source } = await resolveStoreAuth(request);
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search   = searchParams.get('search');
    const status   = searchParams.get('status');
    const category = searchParams.get('category');
    const organic  = searchParams.get('organic');
    const featured = searchParams.get('featured');
    const page     = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit    = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const skip     = (page - 1) * limit;

    const where = { storeId };
    if (status) where.status = status;
    if (organic !== null) where.isOrganic = organic === 'true';
    if (featured !== null) where.isFeatured = featured === 'true';
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (category) {
      where.categories = {
        some: {
          category: { name: { contains: category, mode: 'insensitive' } },
        },
      };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          variants: {
            include: { inventory: true },
          },
          categories: {
            include: { category: { select: { id: true, name: true, isGlobal: true } } },
          },
          ratings: { select: { rating: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, limit });
  } catch (error) {
    console.error('GET /api/store/product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── PUT /api/store/product?id=xxx — Update product ───────────────────────────
export async function PUT(request) {
  try {
    const { storeId, employee, source } = await resolveStoreAuth(request);
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (source === 'employee' && !hasPermission(employee, PERMISSIONS.EDIT_PRODUCT)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    if (!productId) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const existing = await prisma.product.findFirst({ where: { id: productId, storeId } });
    if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const formData = await request.formData();

    const name              = formData.get('name')?.trim();
    const description       = formData.get('description')?.trim();
    const statusRaw          = formData.get('status');
    const status              = ['ACTIVE', 'INACTIVE', 'DRAFT', 'OUT_OF_STOCK'].includes(statusRaw) ? statusRaw : existing.status;
    const isOrganic            = formData.has('isOrganic') ? formData.get('isOrganic') === 'true' : existing.isOrganic;
    const isFeatured            = formData.has('isFeatured') ? formData.get('isFeatured') === 'true' : existing.isFeatured;
    const keyFeaturesRaw     = formData.get('keyFeatures');
    const categoryIdsRaw     = formData.get('categoryIds');
    const existingImagesRaw  = formData.get('existingImages');
    const newImages           = formData.getAll('images');

    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
    }

    let existingImages = [];
    try {
      existingImages = JSON.parse(existingImagesRaw || '[]');
    } catch { existingImages = []; }

    let newImageUrls = [];
    if (newImages.length > 0) {
      newImageUrls = await Promise.all(
        newImages.map(async (image) => {
          const buffer = Buffer.from(await image.arrayBuffer());
          const res = await imagekit.upload({
            file: buffer,
            fileName: image.name,
            folder: 'products',
          });
          return imagekit.url({
            path: res.filePath,
            transformation: [{ quality: 'auto' }, { format: 'webp' }, { width: '1024' }],
          });
        })
      );
    }

    const allImages = [...existingImages, ...newImageUrls];
    if (allImages.length < 1 || allImages.length > 10) {
      return NextResponse.json({ error: 'Between 1 and 10 images required' }, { status: 400 });
    }

    let keyFeatures = [];
    try {
      keyFeatures = JSON.parse(keyFeaturesRaw || '[]');
      if (!Array.isArray(keyFeatures)) keyFeatures = [];
    } catch { keyFeatures = []; }
    keyFeatures = keyFeatures.filter((f) => typeof f === 'string' && f.trim() !== '');

    const updateData = {
      name,
      description,
      keyFeatures,
      images: allImages,
      isOrganic,
      isFeatured,
      status,
    };

    if (name !== existing.name) {
      let slug = generateSlug(name);
      const slugExists = await prisma.product.findFirst({
        where: { slug, storeId, id: { not: productId } },
      });
      if (slugExists) slug = `${slug}-${Date.now()}`;
      updateData.slug = slug;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.update({
        where: { id: productId },
        data: updateData,
      });

      if (categoryIdsRaw) {
        let categoryIds = [];
        try { categoryIds = JSON.parse(categoryIdsRaw); } catch { categoryIds = []; }

        if (categoryIds.length > 0) {
          const validCategories = await tx.category.findMany({
            where: { id: { in: categoryIds }, OR: [{ isGlobal: true }, { storeId }] },
          });
          if (validCategories.length !== categoryIds.length) {
            throw new Error('One or more invalid category IDs');
          }

          await tx.productCategory.deleteMany({ where: { productId } });
          await tx.productCategory.createMany({
            data: categoryIds.map((categoryId) => ({ productId, categoryId })),
          });
        }
      }

      return prod;
    }, { timeout: 20000, maxWait: 10000 });

    return NextResponse.json({ message: 'Product updated successfully', product: updated });
  } catch (error) {
    console.error('PUT /api/store/product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE /api/store/product?id=xxx — Delete product ───────────────────────
export async function DELETE(request) {
  try {
    const { storeId, employee, source } = await resolveStoreAuth(request);
    if (!storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (source === 'employee' && !hasPermission(employee, PERMISSIONS.DELETE_PRODUCT)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    if (!productId) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const existing = await prisma.product.findFirst({
      where: { id: productId, storeId },
      include: { variants: { select: { id: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    // Guard: cannot hard-delete a product whose variants are referenced by existing
    // orders. The DB enforces this via RESTRICT on OrderItem.variantId, so we check
    // first and return a clear error rather than letting it crash with a 500.
    if (existing.variants.length > 0) {
      const variantIds = existing.variants.map((v) => v.id);
      const orderedItemCount = await prisma.orderItem.count({
        where: { variantId: { in: variantIds } },
      });

      if (orderedItemCount > 0) {
        return NextResponse.json(
          {
            error:
              'This product cannot be deleted because it has been ordered by customers. ' +
              'Set it to Inactive or Out of Stock to hide it from the store instead.',
          },
          { status: 409 }
        );
      }
    }

    // No order references — safe to delete. Cascade removes variants, inventory,
    // and productCategory join rows as declared in the Prisma schema.
    await prisma.product.delete({ where: { id: productId } });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/store/product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}