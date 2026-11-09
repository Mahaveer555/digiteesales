import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    const status = searchParams.get('status');
    const userIdFilter = searchParams.get('userId');

    const where: any = {};

    if (user.role === 'SALES_EXECUTIVE') {
      where.userId = user.id;
    } else if (userIdFilter) {
      where.userId = userIdFilter;
    }

    if (status) {
      where.status = status;
    }

    if (dateStr) {
      const d = new Date(dateStr);
      where.meetingDate = {
        gte: startOfDay(d),
        lte: endOfDay(d),
      };
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            companyName: true,
            ownerName: true,
            mobileNumber: true,
            address: true,
            city: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            department: true,
          },
        },
      },
      orderBy: { meetingDate: 'desc' },
    });

    return NextResponse.json({ meetings });
  } catch (error) {
    console.error('Meetings fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const {
      leadId,
      meetingDate,
      meetingTime,
      meetingType,
      status,
      discussionPoints,
      outcome,
      interestLevel,
      clientRemarks,
      nextAction,
      assignedToId,
    } = body;

    if (!leadId || !meetingDate) {
      return NextResponse.json({ error: 'Lead and meeting date are required' }, { status: 400 });
    }

    const executiveId = user.role === 'SALES_EXECUTIVE' ? user.id : (assignedToId || user.id);
    const mStatus = status || 'SCHEDULED';

    const meeting = await prisma.meeting.create({
      data: {
        leadId,
        userId: executiveId,
        meetingDate: new Date(meetingDate),
        meetingTime: meetingTime || '11:00 AM',
        meetingType: meetingType || 'MARKET_VISIT',
        status: mStatus,
        discussionPoints,
        outcome,
        interestLevel: interestLevel || 'MEDIUM',
        clientRemarks,
        nextAction,
        completedAt: mStatus === 'COMPLETED' ? new Date() : null,
      },
      include: {
        lead: true,
        user: true,
      },
    });

    // Create timeline record
    await prisma.clientTimeline.create({
      data: {
        leadId,
        userId: user.id,
        activityType: 'MEETING_LOGGED',
        title: `Meeting ${mStatus === 'COMPLETED' ? 'Completed' : 'Scheduled'}`,
        description: `Meeting (${meetingType || 'MARKET_VISIT'}) with ${user.name} on ${meetingTime || '11:00 AM'}. ${discussionPoints || ''}`,
      },
    });

    return NextResponse.json({ success: true, meeting }, { status: 201 });
  } catch (error) {
    console.error('Create meeting error:', error);
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
  }
}
