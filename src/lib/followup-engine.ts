import { prisma } from './prisma';

/**
 * Follow-up Monitoring Engine:
 * Scans all pending follow-ups and marks overdue ones according to configured grace period.
 * Emits audit log entries and persistent notifications.
 */
export async function syncOverdueFollowUps(): Promise<{ markedCount: number }> {
  try {
    const settings = await prisma.systemSettings.findFirst();

    const graceHours = settings?.gracePeriodHours ?? 0;
    const now = new Date();
    // Overdue threshold is current time minus grace period hours
    const threshold = new Date(now.getTime() - graceHours * 60 * 60 * 1000);

    // Find all PENDING follow-ups where dueDateTime < threshold
    const overdueCandidates = await prisma.followUp.findMany({
      where: {
        status: 'PENDING',
        dueDateTime: {
          lt: threshold,
        },
      },
      include: {
        lead: true,
        user: true,
      },
    });

    if (overdueCandidates.length === 0) {
      return { markedCount: 0 };
    }

    let markedCount = 0;

    for (const item of overdueCandidates) {
      // Mark as OVERDUE
      await prisma.followUp.update({
        where: { id: item.id },
        data: {
          status: 'OVERDUE',
          isOverdue: true,
          overdueSince: item.dueDateTime,
        },
      });

      markedCount++;

      // Create timeline audit event
      await prisma.clientTimeline.create({
        data: {
          leadId: item.leadId,
          userId: item.userId,
          activityType: 'OVERDUE_ALERT',
          title: 'Follow-up Marked Overdue',
          description: `Scheduled follow-up on ${item.scheduledTime} with ${item.user.name} became overdue. Action required.`,
        },
      });

      // Notification for employee
      await prisma.notification.create({
        data: {
          userId: item.userId,
          title: '🚨 Missed Follow-up Alert',
          message: `Your follow-up with ${item.lead.companyName} (${item.scheduledTime}) is OVERDUE. Please call or reschedule immediately.`,
          type: 'MISSED_FOLLOWUP',
          relatedLeadId: item.leadId,
        },
      });

      // Find all Super Admins to notify
      const admins = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN', isActive: true },
        select: { id: true },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: `🚨 Overdue Alert: ${item.user.name}`,
            message: `Employee ${item.user.name} missed scheduled follow-up with ${item.lead.companyName}.`,
            type: 'MISSED_FOLLOWUP',
            relatedLeadId: item.leadId,
          },
        });
      }
    }

    return { markedCount };
  } catch (error) {
    console.error('Error running syncOverdueFollowUps:', error);
    return { markedCount: 0 };
  }
}
