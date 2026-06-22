// C:\Users\Siddharathan\Desktop\Grocery-Cart\app\api\coupon\route.js
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId, has } = await auth();   // ✅ await auth(), not getAuth(request)

    if (!userId) {
      return NextResponse.json({ error: "Please login to apply coupon" }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code || !code.trim()) {
      return NextResponse.json({ error: "Please enter a coupon code" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: {
        code: code.toUpperCase().trim(),
      },
    });

    // ✅ Check expiry separately — `where` doesn't support inequality on findUnique's unique field combo cleanly with code lookup
    if (!coupon || new Date(coupon.expiresAt) <= new Date()) {
      return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 404 });
    }

    if (coupon.forNewUser) {
      const userOrders = await prisma.order.findMany({ where: { userId } });
      if (userOrders.length > 0) {
        return NextResponse.json({ error: "This coupon is only valid for new users" }, { status: 400 });
      }
    }

    if (coupon.forMember) {
      const hasPlusPlan = has({ plan: 'plus' });
      if (!hasPlusPlan) {
        return NextResponse.json({ error: "This coupon is only valid for premium members" }, { status: 400 });
      }
    }

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to verify coupon" }, { status: 500 });
  }
}