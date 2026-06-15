// app/api/employee/login/route.js
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

    const employee = await prisma.employee.findUnique({
      where: { email },
      include: {
        store: {
          select: { id: true, name: true, logo: true, status: true, isActive: true },
        },
      },
    });

    if (!employee)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    if (!employee.isActive)
      return NextResponse.json({ error: 'Your account has been deactivated. Contact your store owner.' }, { status: 403 });

    // ✅ Uppercase enum check
    const store = employee.store;
    if (!store)
      return NextResponse.json({ error: 'Store not found.' }, { status: 404 });

    if (store.status === 'PENDING')
      return NextResponse.json({ error: 'Store is waiting for admin approval.' }, { status: 403 });
    if (store.status === 'REJECTED')
      return NextResponse.json({ error: 'Store has been rejected. Contact admin.' }, { status: 403 });
    if (store.status === 'INACTIVE' || !store.isActive)
      return NextResponse.json({ error: 'Store is currently inactive.' }, { status: 403 });
    if (store.status !== 'ACTIVE')
      return NextResponse.json({ error: 'Store is not active yet.' }, { status: 403 });

    const isValid = await bcrypt.compare(password, employee.password);
    if (!isValid)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

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
    console.error('POST /api/employee/login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}