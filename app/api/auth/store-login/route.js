// app/api/auth/store-login/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET_KEY } from '@/middlewares/authEmployee';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password)
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });

    // Find employee by email
    const employee = await prisma.employee.findUnique({
      where: { email },
      include: {
        store: {
          select: { id: true, name: true, logo: true, status: true, isActive: true },
        },
      },
    });

    if (!employee)
      return NextResponse.json({ error: 'No account found with this email.' }, { status: 404 });

    // Check employee active
    if (!employee.isActive)
      return NextResponse.json({ error: 'Your account has been deactivated. Contact your store owner.' }, { status: 403 });

    // ✅ Check store status using uppercase enum values (ACTIVE, PENDING, REJECTED, INACTIVE)
    const store = employee.store;
    if (!store)
      return NextResponse.json({ error: 'Store not found.' }, { status: 404 });

    if (store.status === 'PENDING')
      return NextResponse.json({ error: 'Your store is waiting for admin approval.' }, { status: 403 });

    if (store.status === 'REJECTED')
      return NextResponse.json({ error: 'Your store has been rejected. Contact admin.' }, { status: 403 });

    if (store.status === 'INACTIVE' || !store.isActive)
      return NextResponse.json({ error: 'Your store is currently inactive. Contact admin.' }, { status: 403 });

    if (store.status !== 'ACTIVE')
      return NextResponse.json({ error: 'Store is not active yet.' }, { status: 403 });

    // Validate password
    const isValid = await bcrypt.compare(password, employee.password);
    if (!isValid)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    // Sign JWT using the same secret as authEmployee.js
    const token = jwt.sign(
      {
        employeeId:  employee.id,
        storeId:     employee.storeId,
        name:        employee.name,
        email:       employee.email,
        permissions: employee.permissions,
      },
      JWT_SECRET_KEY,
      { expiresIn: '7d' }
    );

    const { password: _, ...safeEmployee } = employee;

    return NextResponse.json({
      message:  'Login successful',
      token,
      employee: { ...safeEmployee, store },
    });
  } catch (error) {
    console.error('POST /api/auth/store-login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}