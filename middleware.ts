// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default clerkMiddleware((auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Employee routes — bypass Clerk entirely
  if (
    pathname.startsWith('/employee') ||
    pathname.startsWith('/api/employee/') ||
    pathname.startsWith('/api/store/employee-auth')
  ) {
    return NextResponse.next();
  }

  // Store login — public
  if (pathname === '/store/login') {
    return NextResponse.next();
  }

  // Everything else — pass through, let layouts handle auth
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};