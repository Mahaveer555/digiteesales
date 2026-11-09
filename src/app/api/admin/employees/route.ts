import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, forbiddenResponse, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'SALES_MANAGER') {
      return forbiddenResponse();
    }

    const employees = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            leads: true,
            meetings: true,
            followUps: true,
            deals: true,
          },
        },
        targets: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      employees: employees.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        role: e.role,
        department: e.department,
        phone: e.phone,
        avatarUrl: e.avatarUrl,
        isActive: e.isActive,
        createdAt: e.createdAt,
        counts: e._count,
        currentTarget: e.targets[0] || null,
      })),
    });
  } catch (error) {
    console.error('Employees fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'SUPER_ADMIN') {
      return forbiddenResponse('Only Super Admin can create employee accounts');
    }

    const body = await req.json();
    const { name, email, password, role, department, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newEmployee = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role || 'SALES_EXECUTIVE',
        department: department || 'Field Sales',
        phone: phone || null,
      },
    });

    // Default target for current month
    const now = new Date();
    await prisma.salesTarget.create({
      data: {
        userId: newEmployee.id,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        targetMeetings: 50,
        targetLeads: 30,
        targetRevenue: 500000,
        targetDeals: 8,
      },
    });

    return NextResponse.json({ success: true, employee: newEmployee }, { status: 201 });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
