// C:\Users\Siddharathan\Desktop\Grocery-Cart\middlewares\authAdmin.js
import { clerkClient } from '@clerk/nextjs/server';

const authAdmin = async (userId) => {
  try {
    if (!userId) return false;

    const client = await clerkClient();
    const user   = await client.users.getUser(userId);

    const adminEmails = (process.env.ADMIN_EMAIL || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const userEmail = (user.emailAddresses[0]?.emailAddress || '').toLowerCase();

    return adminEmails.includes(userEmail);
  } catch (error) {
    return false;
  }
};

export default authAdmin;