import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = params;
    const body = await req.json();
    const { remarks } = body;

    if (!remarks) {
      return NextResponse.json({ error: 'Remarks are required' }, { status: 400 });
    }

    const followUp = await prisma.followUp.findUnique({ where: { id } });
    if (!followUp) return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });

    const newRemarks = followUp.remarks ? `${followUp.remarks}\n[${user.name}]: ${remarks}` : `[${user.name}]: ${remarks}`;

    const updated = await prisma.followUp.update({
      where: { id },
      data: { remarks: newRemarks },
    });

    await prisma.clientTimeline.create({
      data: {
        leadId: followUp.leadId,
        userId: user.id,
        activityType: 'NOTE_ADDED',
        title: 'Remarks Added to Follow-up',
        description: `Note from ${user.name}: "${remarks}"`,
      },
    });

    return NextResponse.json({ success: true, followUp: updated });
  } catch (error) {
    console.error('Add remarks error:', error);
    return NextResponse.json({ error: 'Failed to add remarks' }, { status: 500 });
  }
}
