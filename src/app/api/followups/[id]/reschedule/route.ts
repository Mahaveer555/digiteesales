import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseCombinedDateTime } from '@/lib/date-utils';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = params;
    const body = await req.json();
    const { newDate, newTime, reason } = body;

    if (!newDate) {
      return NextResponse.json({ error: 'New scheduled date is required' }, { status: 400 });
    }

    const followUp = await prisma.followUp.findUnique({
      where: { id },
      include: { lead: true },
    });

    if (!followUp) {
      return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });
    }

    if (user.role === 'SALES_EXECUTIVE' && followUp.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to modify this follow-up' }, { status: 403 });
    }

    const previousScheduled = `${followUp.scheduledTime} on ${new Date(followUp.scheduledDate).toLocaleDateString()}`;
    const newDueDateTime = parseCombinedDateTime(newDate, newTime || '11:00 AM');

    // Update follow-up with new schedule
    const updated = await prisma.followUp.update({
      where: { id },
      data: {
        scheduledDate: new Date(newDate),
        scheduledTime: newTime || '11:00 AM',
        dueDateTime: newDueDateTime,
        status: 'PENDING',
        isOverdue: false,
        overdueSince: null,
        remarks: `${followUp.remarks ? followUp.remarks + ' | ' : ''}Rescheduled from [${previousScheduled}] reason: ${reason || 'Client request'}`,
      },
    });

    // Update lead
    await prisma.lead.update({
      where: { id: followUp.leadId },
      data: {
        nextFollowUpDate: new Date(newDate),
        nextFollowUpTime: newTime || '11:00 AM',
      },
    });

    // Add audit log
    await prisma.clientTimeline.create({
      data: {
        leadId: followUp.leadId,
        userId: user.id,
        activityType: 'RESCHEDULED',
        title: 'Follow-up Rescheduled',
        description: `Follow-up originally set for ${previousScheduled} was rescheduled by ${user.name} to ${newTime || '11:00 AM'} on ${newDate}. Reason: ${reason || 'Client request'}.`,
      },
    });

    return NextResponse.json({ success: true, followUp: updated });
  } catch (error) {
    console.error('Reschedule follow-up error:', error);
    return NextResponse.json({ error: 'Failed to reschedule follow-up' }, { status: 500 });
  }
}
