import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncOverdueFollowUps } from '@/lib/followup-engine';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { calculateLeaderboard } from '@/lib/leaderboard';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    // Trigger automated follow-up overdue sync engine
    await syncOverdueFollowUps();

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'this_month'; // 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'last_month' | 'custom'
    const customStart = searchParams.get('startDate');
    const customEnd = searchParams.get('endDate');

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (filter) {
      case 'today':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'yesterday':
        startDate = startOfDay(subDays(now, 1));
        endDate = endOfDay(subDays(now, 1));
        break;
      case 'last_7_days':
        startDate = startOfDay(subDays(now, 7));
        endDate = endOfDay(now);
        break;
      case 'last_month':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case 'custom':
        startDate = customStart ? startOfDay(new Date(customStart)) : startOfMonth(now);
        endDate = customEnd ? endOfDay(new Date(customEnd)) : endOfDay(now);
        break;
      case 'this_month':
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
    }

    const isExecutive = user.role === 'SALES_EXECUTIVE';
    const userScope = isExecutive ? { userId: user.id } : {};
    const leadScope = isExecutive ? { assignedToId: user.id } : {};

    // Today boundaries
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Queries
    const [
      totalEmployees,
      activeSalesExecs,
      totalLeads,
      todayMeetings,
      todayCompletedMeetings,
      todayFollowUps,
      todayCompletedFollowUps,
      missedFollowUps,
      allMeetingsPeriod,
      allFollowUpsPeriod,
      leadsByStatus,
      dealsWonPeriod,
      dealsLostPeriod,
      salesGraphDataRaw,
      allExecutives,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true, role: 'SALES_EXECUTIVE' } }),
      prisma.lead.count({ where: leadScope }),

      // Today's meetings
      prisma.meeting.count({
        where: {
          meetingDate: { gte: todayStart, lte: todayEnd },
          ...userScope,
        },
      }),
      prisma.meeting.count({
        where: {
          meetingDate: { gte: todayStart, lte: todayEnd },
          status: 'COMPLETED',
          ...userScope,
        },
      }),

      // Today's follow-ups
      prisma.followUp.count({
        where: {
          scheduledDate: { gte: todayStart, lte: todayEnd },
          ...userScope,
        },
      }),
      prisma.followUp.count({
        where: {
          scheduledDate: { gte: todayStart, lte: todayEnd },
          status: 'COMPLETED',
          ...userScope,
        },
      }),

      // Missed / Overdue Follow-ups
      prisma.followUp.findMany({
        where: {
          OR: [{ status: 'OVERDUE' }, { isOverdue: true }],
          ...userScope,
        },
        include: {
          lead: { select: { id: true, companyName: true, ownerName: true, mobileNumber: true } },
          user: { select: { id: true, name: true, department: true } },
        },
        orderBy: { dueDateTime: 'asc' },
      }),

      // Meetings in selected period
      prisma.meeting.findMany({
        where: {
          meetingDate: { gte: startDate, lte: endDate },
          ...userScope,
        },
      }),

      // Follow-ups in selected period
      prisma.followUp.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          ...userScope,
        },
      }),

      // Leads by status
      prisma.lead.groupBy({
        by: ['status'],
        where: leadScope,
        _count: { _all: true },
      }),

      // Deals Won in period
      prisma.deal.findMany({
        where: {
          status: 'WON',
          closeDate: { gte: startDate, lte: endDate },
          ...userScope,
        },
      }),

      // Deals Lost
      prisma.deal.count({
        where: {
          status: 'LOST',
          closeDate: { gte: startDate, lte: endDate },
          ...userScope,
        },
      }),

      // Daily deals for sales graph
      prisma.deal.findMany({
        where: {
          status: 'WON',
          closeDate: { gte: subDays(now, 14) },
          ...userScope,
        },
        select: {
          dealValue: true,
          closeDate: true,
        },
      }),

      // Executives for comparison
      prisma.user.findMany({
        where: { isActive: true, role: 'SALES_EXECUTIVE' },
        include: {
          meetings: { where: { meetingDate: { gte: startDate, lte: endDate } } },
          deals: { where: { status: 'WON', closeDate: { gte: startDate, lte: endDate } } },
          followUps: { where: { status: 'OVERDUE' } },
        },
      }),
    ]);

    // Map lead status counts
    const statusMap: Record<string, number> = {};
    leadsByStatus.forEach((g) => {
      statusMap[g.status] = g._count._all;
    });

    const interestedClients = (statusMap['INTERESTED'] || 0) + (statusMap['HIGH'] || 0);
    const hotLeads = statusMap['HOT_LEAD'] || 0;
    const finalDiscussions = statusMap['FINAL_DISCUSSION'] || 0;
    const dealsFinalized = dealsWonPeriod.length;
    const lostDeals = dealsLostPeriod;
    const totalSalesValue = dealsWonPeriod.reduce((sum, d) => sum + d.dealValue, 0);

    // Completion Percentages
    const meetingCompletionPct =
      allMeetingsPeriod.length > 0
        ? Math.round((allMeetingsPeriod.filter((m) => m.status === 'COMPLETED').length / allMeetingsPeriod.length) * 100)
        : 100;

    const followUpCompletionPct =
      allFollowUpsPeriod.length > 0
        ? Math.round((allFollowUpsPeriod.filter((f) => f.status === 'COMPLETED').length / allFollowUpsPeriod.length) * 100)
        : 100;

    // Sales Trend Graph (Last 7-14 Days)
    const salesTrendMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = subDays(now, i);
      const key = format(d, 'dd MMM');
      salesTrendMap[key] = 0;
    }
    salesGraphDataRaw.forEach((d) => {
      const key = format(d.closeDate, 'dd MMM');
      if (salesTrendMap[key] !== undefined) {
        salesTrendMap[key] += d.dealValue;
      }
    });

    const salesTrendGraph = Object.entries(salesTrendMap).map(([day, revenue]) => ({
      day,
      revenue,
    }));

    // Employee Performance Comparison
    const employeeComparison = allExecutives.map((emp) => ({
      id: emp.id,
      name: emp.name,
      department: emp.department,
      meetings: emp.meetings.filter((m) => m.status === 'COMPLETED').length,
      deals: emp.deals.length,
      revenue: emp.deals.reduce((acc, d) => acc + d.dealValue, 0),
      missedFollowups: emp.followUps.length,
    }));

    // Lead conversion funnel
    const conversionFunnel = [
      { stage: 'New Leads', count: totalLeads },
      { stage: 'Meetings Completed', count: allMeetingsPeriod.filter((m) => m.status === 'COMPLETED').length },
      { stage: 'Interested', count: interestedClients },
      { stage: 'Hot Leads', count: hotLeads },
      { stage: 'Final Discussions', count: finalDiscussions },
      { stage: 'Deals Finalized', count: dealsFinalized },
    ];

    // Leaderboard ranking for user
    const leaderboard = await calculateLeaderboard('monthly');
    const myRankEntry = leaderboard.find((e) => e.userId === user.id);

    return NextResponse.json({
      role: user.role,
      filter,
      metrics: {
        totalEmployees,
        activeSalesExecutives: activeSalesExecs,
        totalLeads,
        todayMeetings,
        todayCompletedMeetings,
        todayFollowUps,
        todayCompletedFollowUps,
        missedFollowUpsCount: missedFollowUps.length,
        interestedClients,
        hotLeads,
        finalDiscussions,
        dealsFinalized,
        lostDeals,
        totalSalesValue,
        meetingCompletionPercentage: meetingCompletionPct,
        followUpCompletionPercentage: followUpCompletionPct,
        myRank: myRankEntry ? myRankEntry.rank : 1,
        myScore: myRankEntry ? myRankEntry.score : 0,
        myTargetAchievement: myRankEntry ? myRankEntry.targetAchievement : 0,
      },
      missedFollowUps,
      analytics: {
        salesTrendGraph,
        employeeComparison,
        conversionFunnel,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}
