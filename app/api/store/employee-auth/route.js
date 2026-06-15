// app/api/store/employee-auth/route.js
import prisma from '@/lib/prisma';
import { verifyEmployeeToken } from '@/middlewares/authEmployee';
import { NextResponse } from 'next/server';

// GET /api/store/employee-auth — Validate employee JWT and return fresh DB data
export async function GET(request) {
  try {
    const decoded = verifyEmployeeToken(request);

    if (!decoded) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Re-fetch from DB to get latest permissions + status
    const employee = await prisma.employee.findUnique({
      where: { id: decoded.employeeId },
      select: {
        id: true,
        name: true,
        email: true,
        permissions: true,
        isActive: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true,
            logo: true,
            username: true,
            status: true,
            isActive: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ valid: false, error: 'Account not found' }, { status: 404 });
    }

    if (!employee.isActive) {
      return NextResponse.json(
        { valid: false, error: 'Account has been deactivated' },
        { status: 403 }
      );
    }

    if (employee.store.status !== 'ACTIVE' || !employee.store.isActive) {
      return NextResponse.json(
        { valid: false, error: 'Store is not active' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      valid: true,
      employee,
      store: employee.store,
    });
  } catch (error) {
    console.error('GET /api/store/employee-auth error:', error);
    return NextResponse.json({ valid: false, error: error.message }, { status: 500 });
  }
}