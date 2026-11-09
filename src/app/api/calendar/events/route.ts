import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncOverdueFollowUps } from '@/lib/followup-engine';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    await syncOverdueFollowUps();

    const isExecutive = user.role === 'SALES_EXECUTIVE';
    const userScope = isExecutive ? { userId: user.id } : {};

    const [meetings, followUps] = await Promise.all([
      prisma.meeting.findMany({
        where: userScope,
        include: {
          lead: true,
          user: true,
        },
        orderBy: { meetingDate: 'asc' },
      }),
      prisma.followUp.findMany({
        where: userScope,
        include: {
          lead: true,
          user: true,
        },
        orderBy: { dueDateTime: 'asc' },
      }),
    ]);

    const events: any[] = [];

    // Meetings
    meetings.forEach((m) => {
      let color = '#2563EB'; // Blue
      if (m.status === 'COMPLETED') color = '#10B981'; // Green
      else if (m.status === 'CANCELLED') color = '#94A3B8'; // Gray
      else if (m.status === 'OVERDUE') color = '#EF4444'; // Red

      events.push({
        id: `meeting-${m.id}`,
        dbId: m.id,
        category: 'MEETING',
        type: m.meetingType,
        title: `${m.meetingTime} • Meeting: ${m.lead.companyName}`,
        clientName: m.lead.companyName,
        executiveName: m.user.name,
        date: format(m.meetingDate, 'yyyy-MM-dd'),
        time: m.meetingTime,
        status: m.status,
        color,
        description: m.discussionPoints || m.outcome || 'Meeting with client',
        leadId: m.leadId,
      });
    });

    // Follow-ups
    followUps.forEach((f) => {
      let color = '#F59E0B'; // Amber
      if (f.status === 'COMPLETED') color = '#10B981'; // Green
      else if (f.status === 'OVERDUE' || f.isOverdue) color = '#DC2626'; // Deep Red
      else if (f.followUpType === 'FINAL_DISCUSSION') color = '#8B5CF6'; // Purple

      events.push({
        id: `followup-${f.id}`,
        dbId: f.id,
        category: 'FOLLOW_UP',
        type: f.followUpType,
        title: `${f.scheduledTime} • ${f.followUpType.replace('_', ' ')}: ${f.lead.companyName}`,
        clientName: f.lead.companyName,
        executiveName: f.user.name,
        date: format(f.scheduledDate, 'yyyy-MM-dd'),
        time: f.scheduledTime,
        status: f.status,
        color,
        description: f.remarks || 'Client follow-up scheduled',
        leadId: f.leadId,
      });
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Calendar events error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}
