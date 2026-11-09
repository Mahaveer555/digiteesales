import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncOverdueFollowUps } from '@/lib/followup-engine';
import { formatOverdueDelay, formatDateDDMMYYYY } from '@/lib/date-utils';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    await syncOverdueFollowUps();

    const isExecutive = user.role === 'SALES_EXECUTIVE';
    const where: any = {
      OR: [{ status: 'OVERDUE' }, { isOverdue: true }],
    };

    if (isExecutive) {
      where.userId = user.id;
    }

    const missedItems = await prisma.followUp.findMany({
      where,
      include: {
        lead: true,
        user: true,
      },
      orderBy: { dueDateTime: 'asc' },
    });

    // Employee repeated missed count analysis (for performance warnings)
    const employeeMissedMap: Record<
      string,
      {
        userId: string;
        name: string;
        department: string;
        phone: string | null;
        totalMissed: number;
        warningLevel: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
      }
    > = {};

    missedItems.forEach((item) => {
      if (!employeeMissedMap[item.userId]) {
        employeeMissedMap[item.userId] = {
          userId: item.userId,
          name: item.user.name,
          department: item.user.department,
          phone: item.user.phone,
          totalMissed: 0,
          warningLevel: 'NORMAL',
        };
      }
      employeeMissedMap[item.userId].totalMissed++;
      const count = employeeMissedMap[item.userId].totalMissed;
      if (count >= 3) {
        employeeMissedMap[item.userId].warningLevel = 'CRITICAL';
      } else if (count >= 2) {
        employeeMissedMap[item.userId].warningLevel = 'ELEVATED';
      }
    });

    const formattedMissed = missedItems.map((item) => {
      const delay = formatOverdueDelay(item.dueDateTime);
      return {
        id: item.id,
        leadId: item.leadId,
        clientName: item.lead.companyName,
        ownerName: item.lead.ownerName,
        mobileNumber: item.lead.mobileNumber,
        employeeId: item.userId,
        employeeName: item.user.name,
        department: item.user.department,
        scheduledDate: formatDateDDMMYYYY(item.scheduledDate),
        scheduledTime: item.scheduledTime,
        status: item.status,
        delay,
        followUpType: item.followUpType,
        remarks: item.remarks,
        priority: item.priority,
        leadStatus: item.lead.status,
      };
    });

    const settings = await prisma.systemSettings.findFirst();

    return NextResponse.json({
      totalOverdue: formattedMissed.length,
      gracePeriodHours: settings?.gracePeriodHours ?? 2,
      penaltyPoints: settings?.penaltyOverdueFollowup ?? 5,
      items: formattedMissed,
      employeeWarnings: Object.values(employeeMissedMap),
    });
  } catch (error) {
    console.error('Missed follow-up control center error:', error);
    return NextResponse.json({ error: 'Failed to load Missed Follow-up Control Center' }, { status: 500 });
  }
}
