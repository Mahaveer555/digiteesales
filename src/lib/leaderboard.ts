import { prisma } from './prisma';
import { LeaderboardEntry } from './types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';

export async function calculateLeaderboard(period: LeaderboardPeriod = 'monthly'): Promise<LeaderboardEntry[]> {
  const now = new Date();
  let dateFilter: { gte?: Date; lte?: Date } | undefined;

  if (period === 'daily') {
    dateFilter = {
      gte: startOfDay(now),
      lte: endOfDay(now),
    };
  } else if (period === 'weekly') {
    dateFilter = {
      gte: startOfWeek(now, { weekStartsOn: 1 }), // Monday start
      lte: endOfWeek(now, { weekStartsOn: 1 }),
    };
  } else if (period === 'monthly') {
    dateFilter = {
      gte: startOfMonth(now),
      lte: endOfMonth(now),
    };
  }

  // Get active settings for points configuration
  const settings = await prisma.systemSettings.findFirst();

  const ptsMeeting = settings?.pointsMeetingCompleted ?? 10;
  const ptsInterested = settings?.pointsInterestedClient ?? 15;
  const ptsFinalDiscussion = settings?.pointsFinalDiscussion ?? 20;
  const ptsDeal = settings?.pointsDealFinalized ?? 50;
  const penaltyOverdue = settings?.penaltyOverdueFollowup ?? 5;

  // Fetch all active sales executives and managers
  const employees = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ['SALES_EXECUTIVE', 'SALES_MANAGER'] },
    },
    include: {
      meetings: {
        where: dateFilter ? { meetingDate: dateFilter } : undefined,
      },
      followUps: {
        where: dateFilter ? { createdAt: dateFilter } : undefined,
      },
      deals: {
        where: dateFilter ? { closeDate: dateFilter } : undefined,
      },
      leads: {
        where: dateFilter ? { createdAt: dateFilter } : undefined,
      },
      targets: {
        where: {
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
    },
  });

  const entries: LeaderboardEntry[] = employees.map((emp) => {
    const totalMeetings = emp.meetings.length;
    const completedMeetings = emp.meetings.filter((m) => m.status === 'COMPLETED').length;

    // Count interested and final discussion leads
    const interestedClients = emp.leads.filter(
      (l) => l.status === 'INTERESTED' || l.status === 'HOT_LEAD' || l.interestLevel === 'HIGH' || l.interestLevel === 'HOT'
    ).length;

    const finalDiscussions = emp.leads.filter((l) => l.status === 'FINAL_DISCUSSION').length;

    const followUpsCompleted = emp.followUps.filter((f) => f.status === 'COMPLETED').length;
    const missedFollowUps = emp.followUps.filter((f) => f.status === 'OVERDUE' || f.isOverdue).length;

    const wonDeals = emp.deals.filter((d) => d.status === 'WON');
    const dealsFinalized = wonDeals.length;
    const totalRevenue = wonDeals.reduce((sum, d) => sum + d.dealValue, 0);

    // Points computation
    const score = Math.max(
      0,
      completedMeetings * ptsMeeting +
        interestedClients * ptsInterested +
        finalDiscussions * ptsFinalDiscussion +
        dealsFinalized * ptsDeal -
        missedFollowUps * penaltyOverdue
    );

    // Conversion rate
    const conversionRate = totalMeetings > 0 ? Math.round((dealsFinalized / totalMeetings) * 100) : 0;

    // Target achievement
    const target = emp.targets[0];
    const targetRevenue = target?.targetRevenue || 500000;
    const targetAchievement = Math.min(200, Math.round((totalRevenue / targetRevenue) * 100));

    return {
      rank: 0, // Assigned after sorting
      userId: emp.id,
      name: emp.name,
      department: emp.department,
      avatarUrl: emp.avatarUrl,
      totalMeetings,
      completedMeetings,
      interestedClients,
      followUpsCompleted,
      missedFollowUps,
      dealsFinalized,
      totalRevenue,
      conversionRate,
      targetAchievement,
      score,
    };
  });

  // Sort primarily by score desc, then by revenue desc, then completed meetings
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.totalRevenue !== a.totalRevenue) return b.totalRevenue - a.totalRevenue;
    return b.completedMeetings - a.completedMeetings;
  });

  // Assign ranks
  entries.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return entries;
}
