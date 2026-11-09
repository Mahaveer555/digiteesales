import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = params;
    const body = await req.json();
    const { status, outcome, discussionPoints, clientRemarks, nextAction } = body;

    const currentMeeting = await prisma.meeting.findUnique({
      where: { id },
      include: { lead: true },
    });

    if (!currentMeeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (user.role === 'SALES_EXECUTIVE' && currentMeeting.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this meeting' }, { status: 403 });
    }

    const updated = await prisma.meeting.update({
      where: { id },
      data: {
        status: status || currentMeeting.status,
        outcome: outcome !== undefined ? outcome : currentMeeting.outcome,
        discussionPoints: discussionPoints !== undefined ? discussionPoints : currentMeeting.discussionPoints,
        clientRemarks: clientRemarks !== undefined ? clientRemarks : currentMeeting.clientRemarks,
        nextAction: nextAction !== undefined ? nextAction : currentMeeting.nextAction,
        completedAt: status === 'COMPLETED' ? new Date() : currentMeeting.completedAt,
      },
    });

    await prisma.clientTimeline.create({
      data: {
        leadId: currentMeeting.leadId,
        userId: user.id,
        activityType: 'MEETING_LOGGED',
        title: `Meeting Updated: ${status || currentMeeting.status}`,
        description: `Meeting outcome updated by ${user.name}: "${outcome || 'Updated status'}"`,
      },
    });

    return NextResponse.json({ success: true, meeting: updated });
  } catch (error) {
    console.error('Update meeting error:', error);
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
  }
}
