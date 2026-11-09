import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = params;
    const body = await req.json();
    const { status, dealValue, remarks } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { assignedTo: true },
    });

    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    if (user.role === 'SALES_EXECUTIVE' && lead.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const previousStatus = lead.status;
    const finalValue = dealValue !== undefined ? parseFloat(dealValue) : (lead.dealValue || lead.clientBudget);

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        status,
        dealValue: finalValue,
      },
    });

    // If deal finalized, create Deal record if not already exists
    if (status === 'DEAL_FINALIZED' && previousStatus !== 'DEAL_FINALIZED') {
      await prisma.deal.create({
        data: {
          leadId: lead.id,
          userId: lead.assignedToId,
          dealTitle: `${lead.companyName} Contract`,
          dealValue: finalValue,
          status: 'WON',
          closeDate: new Date(),
          remarks: remarks || 'Deal finalized via CRM pipeline.',
        },
      });

      // Notification for Super Admin
      const admins = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: '🎉 Deal Finalized!',
            message: `${lead.assignedTo.name} closed deal with ${lead.companyName} (₹${finalValue.toLocaleString('en-IN')})!`,
            type: 'DEAL_CLOSED',
            relatedLeadId: lead.id,
          },
        });
      }
    } else if (status === 'DEAL_LOST' && previousStatus !== 'DEAL_LOST') {
      await prisma.deal.create({
        data: {
          leadId: lead.id,
          userId: lead.assignedToId,
          dealTitle: `${lead.companyName} Lost`,
          dealValue: finalValue,
          status: 'LOST',
          closeDate: new Date(),
          remarks: remarks || 'Client decided not to proceed.',
        },
      });
    }

    // Add audit log
    await prisma.clientTimeline.create({
      data: {
        leadId: id,
        userId: user.id,
        activityType: 'STATUS_CHANGED',
        title: `Status Changed to ${status.replace('_', ' ')}`,
        description: `Lead moved from "${previousStatus}" to "${status}" by ${user.name}. ${remarks ? `Remarks: ${remarks}` : ''}`,
      },
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
