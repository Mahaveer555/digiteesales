import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { resolutionNotes } = body;

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

    const updated = await prisma.followUp.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        isOverdue: false,
        completedAt: new Date(),
        resolutionNotes: resolutionNotes || 'Follow-up completed successfully.',
      },
    });

    // Add audit log
    await prisma.clientTimeline.create({
      data: {
        leadId: followUp.leadId,
        userId: user.id,
        activityType: 'FOLLOWUP_COMPLETED',
        title: 'Follow-up Completed',
        description: `Follow-up on ${followUp.scheduledTime} marked as COMPLETED by ${user.name}. Notes: ${resolutionNotes || 'None'}`,
      },
    });

    return NextResponse.json({ success: true, followUp: updated });
  } catch (error) {
    console.error('Complete follow-up error:', error);
    return NextResponse.json({ error: 'Failed to complete follow-up' }, { status: 500 });
  }
}
