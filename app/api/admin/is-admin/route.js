// app/api/admin/is-admin/route.js
import authAdmin from '@/middlewares/authAdmin';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    let userId = null;

    // ── Method 1: Use Clerk's auth() which reads cookies automatically ───────
    try {
      const session = await auth();
      userId = session?.userId || null;
      console.log('is-admin auth() result:', userId);
    } catch (authErr) {
      console.log('is-admin auth() failed:', authErr?.message);
    }

    // ── Method 2: Decode Bearer token manually if cookie auth failed ─────────
    if (!userId) {
      const authHeader =
        request.headers.get('authorization') ||
        request.headers.get('Authorization');

      console.log('is-admin: trying Bearer token, header exists:', !!authHeader);

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        console.log('is-admin: token length:', token.length, 'first 20:', token.slice(0, 20));

        try {
          const parts = token.split('.');
          console.log('is-admin: JWT parts count:', parts.length);

          if (parts.length === 3) {
            let base64 = parts[1];
            // Fix base64url to base64
            base64 = base64.replace(/-/g, '+').replace(/_/g, '/');
            // Add padding
            while (base64.length % 4 !== 0) base64 += '=';

            const jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
            console.log('is-admin: decoded JSON (first 100):', jsonStr.slice(0, 100));

            const payload = JSON.parse(jsonStr);
            userId = payload?.sub || payload?.userId || null;
            console.log('is-admin: userId from token:', userId);
          }
        } catch (decodeErr) {
          console.error('is-admin: decode error:', decodeErr.message);
        }
      }
    }

    if (!userId) {
      console.log('is-admin: FINAL userId is null — returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdminUser = await authAdmin(userId);
    console.log('is-admin: authAdmin returned:', isAdminUser);

    if (!isAdminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ isAdmin: true });
  } catch (error) {
    console.error('GET /api/admin/is-admin FATAL error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}