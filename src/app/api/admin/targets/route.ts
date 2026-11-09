import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, forbiddenResponse, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const targets = await prisma.salesTarget.findMany({
      where: { month, year },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    });

    return NextResponse.json({ targets });
  } catch (error) {
    console.error('Targets fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'SALES_MANAGER') {
      return forbiddenResponse();
    }

    const body = await req.json();
    const { userId, month, year, targetMeetings, targetLeads, targetRevenue, targetDeals } = body;

    if (!userId || !month || !year) {
      return NextResponse.json({ error: 'User, month and year are required' }, { status: 400 });
    }

    const target = await prisma.salesTarget.upsert({
      where: {
        userId_month_year: {
          userId,
          month: parseInt(month),
          year: parseInt(year),
        },
      },
      update: {
        targetMeetings: parseInt(targetMeetings) || 50,
        targetLeads: parseInt(targetLeads) || 30,
        targetRevenue: parseFloat(targetRevenue) || 500000,
        targetDeals: parseInt(targetDeals) || 10,
      },
      create: {
        userId,
        month: parseInt(month),
        year: parseInt(year),
        targetMeetings: parseInt(targetMeetings) || 50,
        targetLeads: parseInt(targetLeads) || 30,
        targetRevenue: parseFloat(targetRevenue) || 500000,
        targetDeals: parseInt(targetDeals) || 10,
      },
      include: { user: true },
    });

    return NextResponse.json({ success: true, target });
  } catch (error) {
    console.error('Set target error:', error);
    return NextResponse.json({ error: 'Failed to save sales target' }, { status: 500 });
  }
}
