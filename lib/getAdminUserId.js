// lib/getAdminUserId.js
import { auth } from '@clerk/nextjs/server';

/**
 * Extracts Clerk userId from:
 * 1. Clerk session (cookies) — works for all server-side calls
 * 2. Authorization Bearer token — fallback for client axios calls
 */
export async function getAdminUserId(request) {
  // Method 1: Clerk session via auth() — most reliable
  try {
    const session = await auth();
    if (session?.userId) {
      return session.userId;
    }
  } catch (e) {
    console.log('getAdminUserId auth() failed:', e?.message);
  }

  // Method 2: Bearer token manual decode
  try {
    const authHeader =
      request.headers.get('authorization') ||
      request.headers.get('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const parts = token.split('.');
      if (parts.length === 3) {
        let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4 !== 0) base64 += '=';
        const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
        const userId = payload?.sub || null;
        console.log('getAdminUserId from Bearer token:', userId);
        return userId;
      }
    }
  } catch (e) {
    console.log('getAdminUserId Bearer decode failed:', e?.message);
  }

  console.log('getAdminUserId: no userId found');
  return null;
}