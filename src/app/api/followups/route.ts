import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseCombinedDateTime } from '@/lib/date-utils';
import { syncOverdueFollowUps } from '@/lib/followup-engine';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    await syncOverdueFollowUps();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const isOverdue = searchParams.get('isOverdue');
    const filterUser = searchParams.get('userId');

    const where: any = {};

    // Data isolation: Sales Executive can only see own follow-ups
    if (user.role === 'SALES_EXECUTIVE') {
      where.userId = user.id;
    } else if (filterUser) {
      where.userId = filterUser;
    }

    if (status) {
      where.status = status;
    }

    if (isOverdue === 'true') {
      where.OR = [{ status: 'OVERDUE' }, { isOverdue: true }];
    }

    const followUps = await prisma.followUp.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            companyName: true,
            ownerName: true,
            mobileNumber: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            department: true,
            email: true,
          },
        },
      },
      orderBy: { dueDateTime: 'asc' },
    });

    return NextResponse.json({ followUps });
  } catch (error) {
    console.error('Follow-ups fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { leadId, scheduledDate, scheduledTime, followUpType, priority, remarks, assignedToId } = body;

    if (!leadId || !scheduledDate) {
      return NextResponse.json({ error: 'Lead and scheduled date are required' }, { status: 400 });
    }

    const executiveId = user.role === 'SALES_EXECUTIVE' ? user.id : (assignedToId || user.id);
    const dueDateTime = parseCombinedDateTime(scheduledDate, scheduledTime || '11:00 AM');

    const followUp = await prisma.followUp.create({
      data: {
        leadId,
        userId: executiveId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime: scheduledTime || '11:00 AM',
        dueDateTime,
        followUpType: followUpType || 'PHONE_CALL',
        priority: priority || 'MEDIUM',
        remarks,
        status: 'PENDING',
        isOverdue: false,
      },
      include: {
        lead: true,
        user: true,
      },
    });

    // Update lead's next follow-up pointers
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        nextFollowUpDate: new Date(scheduledDate),
        nextFollowUpTime: scheduledTime || '11:00 AM',
        followUpType: followUpType || 'PHONE_CALL',
      },
    });

    // Create timeline record
    await prisma.clientTimeline.create({
      data: {
        leadId,
        userId: user.id,
        activityType: 'FOLLOWUP_SCHEDULED',
        title: 'Follow-up Scheduled',
        description: `Follow-up (${followUpType || 'PHONE_CALL'}) scheduled for ${scheduledTime || '11:00 AM'} on ${scheduledDate}. Notes: ${remarks || 'None'}`,
      },
    });

    return NextResponse.json({ followUp }, { status: 201 });
  } catch (error) {
    console.error('Create follow-up error:', error);
    return NextResponse.json({ error: 'Failed to create follow-up' }, { status: 500 });
  }
}
