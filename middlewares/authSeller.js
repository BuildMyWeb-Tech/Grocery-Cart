// C:\Users\Siddharathan\Desktop\Grocery-Cart\middlewares\authSeller.js
import prisma from '@/lib/prisma';

/**
 * Verifies userId owns an ACTIVE store.
 * Returns storeId string | null.
 * Throws on DB error so callers can return 500 instead of silent 401.
 */
const authSeller = async (userId) => {
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        store: {
          select: {
            id: true,
            status: true,
            isActive: true,
          },
        },
      },
    });

    if (!user || !user.store) return null;

    // Must be ACTIVE status (set by admin after approval)
    if (user.store.status !== 'ACTIVE' || !user.store.isActive) return null;

    return user.store.id;
  } catch (error) {
    console.error('authSeller DB error:', error);
    throw new Error('DB_ERROR_AUTH_SELLER');
  }
};

export default authSeller;