import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const now = new Date();
    const todayRecord = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: startOfDay(now),
          lte: endOfDay(now),
        },
      },
    });

    const recentRecords = await prisma.attendance.findMany({
      where: user.role === 'SUPER_ADMIN' ? {} : { userId: user.id },
      include: {
        user: { select: { id: true, name: true, department: true } },
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    return NextResponse.json({ todayRecord, recentRecords });
  } catch (error) {
    console.error('Attendance fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { action, status, remarks } = body; // action: 'punch_in' | 'punch_out'
    const now = new Date();

    const todayRecord = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: startOfDay(now),
          lte: endOfDay(now),
        },
      },
    });

    if (action === 'punch_in') {
      if (todayRecord) {
        return NextResponse.json({ error: 'Already punched in for today' }, { status: 400 });
      }

      const newRecord = await prisma.attendance.create({
        data: {
          userId: user.id,
          date: now,
          punchIn: now,
          status: status || 'PRESENT',
          remarks: remarks || 'Punched in from Digitee World Portal',
        },
      });

      return NextResponse.json({ success: true, record: newRecord });
    } else if (action === 'punch_out') {
      if (!todayRecord) {
        return NextResponse.json({ error: 'Must punch in first before punch out' }, { status: 400 });
      }

      const updated = await prisma.attendance.update({
        where: { id: todayRecord.id },
        data: {
          punchOut: now,
          remarks: remarks ? `${todayRecord.remarks || ''} | Out Note: ${remarks}` : todayRecord.remarks,
        },
      });

      return NextResponse.json({ success: true, record: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Attendance action error:', error);
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
  }
}
