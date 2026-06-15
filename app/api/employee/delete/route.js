// app/api/employee/delete/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import authSeller from '@/middlewares/authSeller';

export async function DELETE(request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const storeId = await authSeller(userId);
    if (!storeId) return NextResponse.json({ error: 'Only store owners can delete employees' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });

    const existing = await prisma.employee.findFirst({ where: { id, storeId } });
    if (!existing) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    await prisma.employee.delete({ where: { id } });

    return NextResponse.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/employee/delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}