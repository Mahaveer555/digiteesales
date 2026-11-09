import { prisma } from './prisma';
import { startOfDay, endOfDay, addDays, subDays, format } from 'date-fns';
import { calculateLeaderboard } from './leaderboard';

export interface DailyReportData {
  reportDateStr: string;
  summary: {
    totalMeetingsScheduled: number;
    totalMeetingsCompleted: number;
    totalNewLeads: number;
    totalInterestedClients: number;
    totalHotLeads: number;
    totalFollowUpsCompleted: number;
    totalMissedFollowUps: number;
    totalDealsFinalized: number;
    totalSalesRevenue: number;
  };
  comparison: {
    prevDayDiff: {
      leadsDiff: number;
      revenueDiff: number;
      meetingsDiff: number;
    };
    prevWeekDiff: {
      leadsDiff: number;
      revenueDiff: number;
    };
  };
  employeePerformance: Array<{
    name: string;
    meetingsCompleted: number;
    leadsGenerated: number;
    interestedClients: number;
    followUpsCompleted: number;
    missedFollowUps: number;
    dealsFinalized: number;
    salesValue: number;
    rank: number;
  }>;
  importantClients: {
    highlyInterested: Array<{ id: string; companyName: string; ownerName: string; budget: number; employee: string }>;
    finalDiscussions: Array<{ id: string; companyName: string; ownerName: string; budget: number; employee: string }>;
    callbacksRequested: Array<{ id: string; companyName: string; phone: string; nextTime: string; employee: string }>;
    closingSoon: Array<{ id: string; companyName: string; dealValue: number; closingDate: string; employee: string }>;
    unresponsive: Array<{ id: string; companyName: string; lastContact: string; employee: string }>;
  };
  managementInsights: {
    bestPerformer: string;
    employeesWithPending: string[];
    employeesWithMissedFollowups: string[];
    leadsNeedingAttention: string[];
    upcomingHighValue: string[];
    potentialRisks: string[];
    tomorrowSuggestions: string[];
  };
  tomorrowActionPlan: {
    meetings: Array<{ time: string; companyName: string; executive: string; type: string }>;
    calls: Array<{ time: string; companyName: string; phone: string; executive: string }>;
    pendingFollowUps: Array<{ companyName: string; delay: string; executive: string }>;
    finalDiscussionAppointments: Array<{ companyName: string; executive: string; budget: number }>;
    priorityClientList: Array<{ companyName: string; reason: string; executive: string }>;
  };
}

export async function generateDailyReport(targetDate: Date = new Date()): Promise<DailyReportData> {
  const dayStart = startOfDay(targetDate);
  const dayEnd = endOfDay(targetDate);
  const reportDateStr = format(targetDate, 'dd-MM-yyyy');

  // Previous Day
  const prevDayStart = startOfDay(subDays(targetDate, 1));
  const prevDayEnd = endOfDay(subDays(targetDate, 1));

  // Previous Week Same Day
  const prevWeekStart = startOfDay(subDays(targetDate, 7));
  const prevWeekEnd = endOfDay(subDays(targetDate, 7));

  // Tomorrow
  const tomorrowStart = startOfDay(addDays(targetDate, 1));
  const tomorrowEnd = endOfDay(addDays(targetDate, 1));

  // Fetch today's records
  const [meetings, leads, followUps, deals, users] = await Promise.all([
    prisma.meeting.findMany({
      where: { meetingDate: { gte: dayStart, lte: dayEnd } },
      include: { lead: true, user: true },
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: dayStart, lte: dayEnd } },
      include: { assignedTo: true },
    }),
    prisma.followUp.findMany({
      where: {
        OR: [
          { scheduledDate: { gte: dayStart, lte: dayEnd } },
          { completedAt: { gte: dayStart, lte: dayEnd } },
          { isOverdue: true },
        ],
      },
      include: { lead: true, user: true },
    }),
    prisma.deal.findMany({
      where: { closeDate: { gte: dayStart, lte: dayEnd } },
      include: { lead: true, user: true },
    }),
    prisma.user.findMany({
      where: { isActive: true, role: { in: ['SALES_EXECUTIVE', 'SALES_MANAGER'] } },
    }),
  ]);

  // Fetch previous day metrics for comparison
  const [prevDayLeads, prevDayDeals, prevDayMeetings] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: prevDayStart, lte: prevDayEnd } } }),
    prisma.deal.findMany({ where: { status: 'WON', closeDate: { gte: prevDayStart, lte: prevDayEnd } } }),
    prisma.meeting.count({ where: { status: 'COMPLETED', meetingDate: { gte: prevDayStart, lte: prevDayEnd } } }),
  ]);

  // Fetch previous week metrics for comparison
  const [prevWeekLeads, prevWeekDeals] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: prevWeekStart, lte: prevWeekEnd } } }),
    prisma.deal.findMany({ where: { status: 'WON', closeDate: { gte: prevWeekStart, lte: prevWeekEnd } } }),
  ]);

  // All active leads for pipeline categories
  const allLeads = await prisma.lead.findMany({
    include: { assignedTo: true, followUps: true },
  });

  // Calculate summary
  const totalMeetingsScheduled = meetings.length;
  const totalMeetingsCompleted = meetings.filter((m) => m.status === 'COMPLETED').length;
  const totalNewLeads = leads.length;
  const totalInterestedClients = allLeads.filter((l) => l.status === 'INTERESTED' || l.interestLevel === 'HIGH').length;
  const totalHotLeads = allLeads.filter((l) => l.status === 'HOT_LEAD' || l.interestLevel === 'HOT').length;
  const totalFollowUpsCompleted = followUps.filter((f) => f.status === 'COMPLETED').length;
  const totalMissedFollowUps = followUps.filter((f) => f.status === 'OVERDUE' || f.isOverdue).length;
  const wonDeals = deals.filter((d) => d.status === 'WON');
  const totalDealsFinalized = wonDeals.length;
  const totalSalesRevenue = wonDeals.reduce((acc, d) => acc + d.dealValue, 0);

  // Comparison differences
  const prevDayRevenue = prevDayDeals.reduce((acc, d) => acc + d.dealValue, 0);
  const prevWeekRevenue = prevWeekDeals.reduce((acc, d) => acc + d.dealValue, 0);

  const prevDayDiff = {
    leadsDiff: totalNewLeads - prevDayLeads,
    revenueDiff: totalSalesRevenue - prevDayRevenue,
    meetingsDiff: totalMeetingsCompleted - prevDayMeetings,
  };

  const prevWeekDiff = {
    leadsDiff: totalNewLeads - prevWeekLeads,
    revenueDiff: totalSalesRevenue - prevWeekRevenue,
  };

  // Leaderboard ranking
  const leaderboard = await calculateLeaderboard('daily');
  const rankMap = new Map<string, number>();
  leaderboard.forEach((e) => rankMap.set(e.userId, e.rank));

  // Employee-wise performance
  const employeePerformance = users.map((u) => {
    const empMeetings = meetings.filter((m) => m.userId === u.id);
    const empLeads = leads.filter((l) => l.assignedToId === u.id);
    const empFollowUps = followUps.filter((f) => f.userId === u.id);
    const empDeals = deals.filter((d) => d.userId === u.id && d.status === 'WON');
    const salesVal = empDeals.reduce((sum, d) => sum + d.dealValue, 0);

    return {
      name: u.name,
      meetingsCompleted: empMeetings.filter((m) => m.status === 'COMPLETED').length,
      leadsGenerated: empLeads.length,
      interestedClients: empLeads.filter((l) => l.status === 'INTERESTED' || l.interestLevel === 'HIGH').length,
      followUpsCompleted: empFollowUps.filter((f) => f.status === 'COMPLETED').length,
      missedFollowUps: empFollowUps.filter((f) => f.status === 'OVERDUE' || f.isOverdue).length,
      dealsFinalized: empDeals.length,
      salesValue: salesVal,
      rank: rankMap.get(u.id) || 99,
    };
  });

  // Sort by rank
  employeePerformance.sort((a, b) => a.rank - b.rank);

  // Important Clients
  const highlyInterested = allLeads
    .filter((l) => l.status === 'HOT_LEAD' || l.interestLevel === 'HOT')
    .slice(0, 8)
    .map((l) => ({
      id: l.id,
      companyName: l.companyName,
      ownerName: l.ownerName,
      budget: l.clientBudget,
      employee: l.assignedTo.name,
    }));

  const finalDiscussions = allLeads
    .filter((l) => l.status === 'FINAL_DISCUSSION')
    .slice(0, 8)
    .map((l) => ({
      id: l.id,
      companyName: l.companyName,
      ownerName: l.ownerName,
      budget: l.clientBudget,
      employee: l.assignedTo.name,
    }));

  const callbacksRequested = allLeads
    .filter((l) => l.status === 'CALLBACK_REQUESTED')
    .slice(0, 6)
    .map((l) => ({
      id: l.id,
      companyName: l.companyName,
      phone: l.mobileNumber,
      nextTime: l.nextFollowUpTime || '11:00 AM',
      employee: l.assignedTo.name,
    }));

  const closingSoon = allLeads
    .filter((l) => l.expectedClosingDate && l.expectedClosingDate >= dayStart)
    .slice(0, 6)
    .map((l) => ({
      id: l.id,
      companyName: l.companyName,
      dealValue: l.dealValue || l.clientBudget,
      closingDate: format(l.expectedClosingDate!, 'dd-MM-yyyy'),
      employee: l.assignedTo.name,
    }));

  const unresponsive = allLeads
    .filter((l) => l.status === 'NOT_INTERESTED' || l.interestLevel === 'LOW')
    .slice(0, 5)
    .map((l) => ({
      id: l.id,
      companyName: l.companyName,
      lastContact: format(l.updatedAt, 'dd-MM-yyyy'),
      employee: l.assignedTo.name,
    }));

  // Tomorrow Action Plan
  const [tomorrowMeetings, tomorrowFollowUps] = await Promise.all([
    prisma.meeting.findMany({
      where: { meetingDate: { gte: tomorrowStart, lte: tomorrowEnd } },
      include: { lead: true, user: true },
    }),
    prisma.followUp.findMany({
      where: { scheduledDate: { gte: tomorrowStart, lte: tomorrowEnd } },
      include: { lead: true, user: true },
    }),
  ]);

  const tomorrowActionPlan = {
    meetings: tomorrowMeetings.map((m) => ({
      time: m.meetingTime,
      companyName: m.lead.companyName,
      executive: m.user.name,
      type: m.meetingType,
    })),
    calls: tomorrowFollowUps
      .filter((f) => f.followUpType === 'PHONE_CALL')
      .map((f) => ({
        time: f.scheduledTime,
        companyName: f.lead.companyName,
        phone: f.lead.mobileNumber,
        executive: f.user.name,
      })),
    pendingFollowUps: followUps
      .filter((f) => f.status === 'OVERDUE')
      .slice(0, 8)
      .map((f) => ({
        companyName: f.lead.companyName,
        delay: 'Requires Immediate Call',
        executive: f.user.name,
      })),
    finalDiscussionAppointments: finalDiscussions.map((f) => ({
      companyName: f.companyName,
      executive: f.employee,
      budget: f.budget,
    })),
    priorityClientList: highlyInterested.map((h) => ({
      companyName: h.companyName,
      reason: 'High budget client with strong purchase intent',
      executive: h.employee,
    })),
  };

  // Management Insights
  const bestPerformer = leaderboard[0]?.name || 'N/A';
  const employeesWithMissed = Array.from(
    new Set(followUps.filter((f) => f.status === 'OVERDUE').map((f) => f.user.name))
  );
  const employeesWithPending = Array.from(
    new Set(followUps.filter((f) => f.status === 'PENDING').map((f) => f.user.name))
  );

  const managementInsights = {
    bestPerformer,
    employeesWithPending,
    employeesWithMissedFollowups: employeesWithMissed,
    leadsNeedingAttention: followUps
      .filter((f) => f.status === 'OVERDUE')
      .slice(0, 5)
      .map((f) => `${f.lead.companyName} (${f.user.name})`),
    upcomingHighValue: highlyInterested.slice(0, 4).map((h) => `${h.companyName} (Est. ₹${h.budget.toLocaleString('en-IN')})`),
    potentialRisks: [
      totalMissedFollowUps > 0
        ? `${totalMissedFollowUps} client follow-ups are overdue and risk dropping off if not engaged within 24 hours.`
        : 'Follow-up compliance is healthy today with zero overdue calls.',
      unresponsive.length > 0
        ? `${unresponsive.length} accounts have gone cold; recommend assigning to senior manager for revival.`
        : 'Pipeline hygiene is optimal with no long-stalled high-value deals.',
    ],
    tomorrowSuggestions: [
      'Prioritize morning follow-up rounds before 11:30 AM to resolve pending client queries.',
      'Schedule joint pitch with Sales Manager for high-budget final discussions.',
      'Ensure all field executives submit meeting outcome remarks immediately after market visits.',
    ],
  };

  return {
    reportDateStr,
    summary: {
      totalMeetingsScheduled,
      totalMeetingsCompleted,
      totalNewLeads,
      totalInterestedClients,
      totalHotLeads,
      totalFollowUpsCompleted,
      totalMissedFollowUps,
      totalDealsFinalized,
      totalSalesRevenue,
    },
    comparison: {
      prevDayDiff,
      prevWeekDiff,
    },
    employeePerformance,
    importantClients: {
      highlyInterested,
      finalDiscussions,
      callbacksRequested,
      closingSoon,
      unresponsive,
    },
    managementInsights,
    tomorrowActionPlan,
  };
}
