import { prisma } from './prisma';
import { calculateLeaderboard } from './leaderboard';
import { generateDailyReport } from './daily-report';
import { startOfDay, endOfDay, addDays, subDays, format } from 'date-fns';

export interface AiQueryResult {
  question: string;
  answerText: string;
  dataSummary?: {
    type: 'LEADERBOARD' | 'MISSED_FOLLOWUPS' | 'LEADS_TABLE' | 'MEETINGS' | 'DAILY_REPORT' | 'TEXT';
    records?: any[];
    stats?: Record<string, any>;
  };
  suggestedFollowUps?: string[];
}

export async function processAiQuery(
  prompt: string,
  userRole: string,
  userId: string
): Promise<AiQueryResult> {
  const query = prompt.trim().toLowerCase();
  const now = new Date();

  // 1. "Which employee missed the most follow-ups this week?" / "missed follow-ups"
  if (query.includes('missed the most') || query.includes('most follow-ups') || (query.includes('missed') && query.includes('employee'))) {
    const weekStart = subDays(now, 7);
    const missedFollowups = await prisma.followUp.findMany({
      where: {
        isOverdue: true,
        scheduledDate: { gte: weekStart },
      },
      include: {
        user: true,
        lead: true,
      },
    });

    // Group by user
    const counts: Record<string, { user: any; count: number; leads: string[] }> = {};
    for (const item of missedFollowups) {
      if (!counts[item.userId]) {
        counts[item.userId] = { user: item.user, count: 0, leads: [] };
      }
      counts[item.userId].count++;
      counts[item.userId].leads.push(item.lead.companyName);
    }

    const sorted = Object.values(counts).sort((a, b) => b.count - a.count);

    if (sorted.length === 0) {
      return {
        question: prompt,
        answerText: 'Great news! There are zero missed follow-ups recorded for any sales executive over the past 7 days. All scheduled calls and visits were attended on time.',
        suggestedFollowUps: ['Who is today’s top performer?', 'Which clients are ready to finalize?', 'Show meetings scheduled for tomorrow'],
      };
    }

    const topMissed = sorted[0];
    const summaryList = sorted
      .map((s, idx) => `${idx + 1}. **${s.user.name}** (${s.user.department}): ${s.count} missed follow-up(s) [Accounts: ${s.leads.slice(0, 3).join(', ')}]`)
      .join('\n');

    return {
      question: prompt,
      answerText: `Based on real CRM activity over the past 7 days, **${topMissed.user.name}** has the highest number of missed follow-ups (${topMissed.count} overdue activities).\n\nHere is the team breakdown:\n${summaryList}\n\n*Recommendation:* Review their pending accounts in the Missed Follow-up Control Center and assist in rescheduling.`,
      dataSummary: {
        type: 'MISSED_FOLLOWUPS',
        records: sorted.map((s) => ({
          employeeName: s.user.name,
          missedCount: s.count,
          department: s.user.department,
          sampleLeads: s.leads.join(', '),
        })),
      },
      suggestedFollowUps: ['Open Missed Follow-up Control Center', 'Who is today’s top performer?', 'Show tomorrow’s action plan'],
    };
  }

  // 2. "Who is today's top performer?" / "top performer" / "leader"
  if (query.includes('top performer') || query.includes('best performer') || query.includes('highest rank') || query.includes('top sales')) {
    const leaderboard = await calculateLeaderboard('daily');
    const leader = leaderboard[0];

    if (!leader) {
      return {
        question: prompt,
        answerText: 'No performance activity recorded yet for today.',
      };
    }

    return {
      question: prompt,
      answerText: `🏆 Today's Top Performer is **${leader.name}** (${leader.department}) with a total performance score of **${leader.score} points**.\n\n**Today's Metrics:**\n- Completed Meetings: **${leader.completedMeetings}**\n- Interested Clients: **${leader.interestedClients}**\n- Deals Finalized: **${leader.dealsFinalized}**\n- Revenue Generated: **₹${leader.totalRevenue.toLocaleString('en-IN')}**\n- Target Achievement: **${leader.targetAchievement}%**`,
      dataSummary: {
        type: 'LEADERBOARD',
        records: leaderboard.slice(0, 5),
      },
      suggestedFollowUps: ['Show weekly leaderboard', 'Which clients are ready to finalize?', 'Give me today’s complete sales report'],
    };
  }

  // 3. "Which clients are ready to finalize?" / "ready to close" / "final discussion"
  if (query.includes('ready to finalize') || query.includes('final discussion') || query.includes('ready to close') || query.includes('hot leads')) {
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { status: 'FINAL_DISCUSSION' },
          { status: 'HOT_LEAD' },
          { interestLevel: 'HOT' },
        ],
      },
      include: {
        assignedTo: true,
      },
      orderBy: { clientBudget: 'desc' },
    });

    if (leads.length === 0) {
      return {
        question: prompt,
        answerText: 'There are currently no clients marked under Final Discussion or Hot status in the pipeline.',
      };
    }

    const totalPipelineValue = leads.reduce((sum, l) => sum + (l.dealValue || l.clientBudget), 0);
    const list = leads
      .map(
        (l, i) =>
          `${i + 1}. **${l.companyName}** (Owner: ${l.ownerName}) - Budget: ₹${l.clientBudget.toLocaleString('en-IN')} | Assigned: ${l.assignedTo.name} | Status: ${l.status}`
      )
      .join('\n');

    return {
      question: prompt,
      answerText: `There are **${leads.length} high-intent clients** currently in Final Discussion or Hot status, representing an estimated pipeline value of **₹${totalPipelineValue.toLocaleString('en-IN')}**:\n\n${list}\n\n*Action Suggested:* Schedule executive closing calls with these clients today to accelerate deal closure.`,
      dataSummary: {
        type: 'LEADS_TABLE',
        records: leads.map((l) => ({
          companyName: l.companyName,
          ownerName: l.ownerName,
          mobile: l.mobileNumber,
          budget: l.clientBudget,
          status: l.status,
          assignedTo: l.assignedTo.name,
        })),
      },
      suggestedFollowUps: ['Schedule closing meeting', 'Show sales pipeline', 'Who is today’s top performer?'],
    };
  }

  // 4. "Show me all meetings scheduled for tomorrow"
  if (query.includes('tomorrow') && (query.includes('meeting') || query.includes('schedule'))) {
    const tomorrow = addDays(now, 1);
    const dayStart = startOfDay(tomorrow);
    const dayEnd = endOfDay(tomorrow);

    const meetings = await prisma.meeting.findMany({
      where: {
        meetingDate: { gte: dayStart, lte: dayEnd },
      },
      include: {
        lead: true,
        user: true,
      },
      orderBy: { meetingTime: 'asc' },
    });

    if (meetings.length === 0) {
      return {
        question: prompt,
        answerText: `No meetings are currently scheduled for tomorrow (${format(tomorrow, 'dd-MM-yyyy')}). Sales executives should schedule their market visits today.`,
      };
    }

    const list = meetings
      .map(
        (m, idx) =>
          `${idx + 1}. **${m.meetingTime}** - ${m.lead.companyName} (${m.meetingType.replace('_', ' ')}) | Executive: **${m.user.name}** | Contact: ${m.lead.mobileNumber}`
      )
      .join('\n');

    return {
      question: prompt,
      answerText: `Here are the **${meetings.length} client meetings** scheduled for tomorrow (${format(tomorrow, 'dd-MM-yyyy')}):\n\n${list}`,
      dataSummary: {
        type: 'MEETINGS',
        records: meetings.map((m) => ({
          time: m.meetingTime,
          company: m.lead.companyName,
          contact: m.lead.mobileNumber,
          executive: m.user.name,
          type: m.meetingType,
        })),
      },
      suggestedFollowUps: ['View full calendar', 'Show pending follow-ups', 'Who is today’s top performer?'],
    };
  }

  // 5. "Which leads have not been contacted in 7 days?"
  if (query.includes('not been contacted') || query.includes('7 days') || query.includes('uncontacted') || query.includes('inactive leads')) {
    const threshold = subDays(now, 7);
    const staleLeads = await prisma.lead.findMany({
      where: {
        updatedAt: { lte: threshold },
        status: { notIn: ['DEAL_FINALIZED', 'DEAL_LOST', 'NOT_INTERESTED'] },
      },
      include: {
        assignedTo: true,
      },
      take: 10,
    });

    if (staleLeads.length === 0) {
      return {
        question: prompt,
        answerText: 'All active leads have had activity or contact within the last 7 days. Pipeline engagement is fresh!',
      };
    }

    const list = staleLeads
      .map(
        (l, i) =>
          `${i + 1}. **${l.companyName}** | Owner: ${l.ownerName} (${l.mobileNumber}) | Last active: ${format(l.updatedAt, 'dd-MM-yyyy')} | Assigned: ${l.assignedTo.name}`
      )
      .join('\n');

    return {
      question: prompt,
      answerText: `Identified **${staleLeads.length} leads** with no recorded meetings, calls, or follow-ups in the last 7+ days:\n\n${list}\n\n*Action:* Assign reminders to the respective sales executives to re-engage these accounts.`,
      dataSummary: {
        type: 'LEADS_TABLE',
        records: staleLeads.map((l) => ({
          companyName: l.companyName,
          ownerName: l.ownerName,
          phone: l.mobileNumber,
          lastActivity: format(l.updatedAt, 'dd-MM-yyyy'),
          assignedTo: l.assignedTo.name,
        })),
      },
      suggestedFollowUps: ['Schedule follow-up call', 'Show missed follow-ups', 'View all leads'],
    };
  }

  // 6. "Give me today's complete sales report"
  if (query.includes('sales report') || query.includes('today\'s report') || query.includes('daily report') || query.includes('complete report')) {
    const report = await generateDailyReport(now);
    return {
      question: prompt,
      answerText: `📊 **DIGITEE WORLD — AI Daily Sales Intelligence Summary (${report.reportDateStr})**\n\n` +
        `• **Meetings Completed:** ${report.summary.totalMeetingsCompleted} / ${report.summary.totalMeetingsScheduled}\n` +
        `• **New Leads Generated:** ${report.summary.totalNewLeads}\n` +
        `• **Hot / Interested Leads:** ${report.summary.totalHotLeads + report.summary.totalInterestedClients}\n` +
        `• **Deals Finalized Today:** ${report.summary.totalDealsFinalized} (Revenue: ₹${report.summary.totalSalesRevenue.toLocaleString('en-IN')})\n` +
        `• **Follow-ups Completed:** ${report.summary.totalFollowUpsCompleted}\n` +
        `• **Missed Follow-ups:** ${report.summary.totalMissedFollowUps}\n\n` +
        `🏆 **Top Performer:** ${report.managementInsights.bestPerformer}\n\n` +
        `💡 **Key Insight:** ${report.managementInsights.potentialRisks[0]}`,
      dataSummary: {
        type: 'DAILY_REPORT',
        stats: report.summary,
      },
      suggestedFollowUps: ['Download PDF Report', 'Export to Excel', 'View Missed Follow-ups Control Center'],
    };
  }

  // 7. "Which employee has the highest conversion rate?"
  if (query.includes('highest conversion') || query.includes('conversion rate')) {
    const leaderboard = await calculateLeaderboard('monthly');
    const sortedByConversion = [...leaderboard].sort((a, b) => b.conversionRate - a.conversionRate);
    const top = sortedByConversion[0];

    const list = sortedByConversion
      .map(
        (e, i) =>
          `${i + 1}. **${e.name}**: ${e.conversionRate}% conversion (${e.dealsFinalized} deals finalized from ${e.totalMeetings} meetings)`
      )
      .join('\n');

    return {
      question: prompt,
      answerText: `🎯 **${top?.name || 'N/A'}** holds the highest conversion rate at **${top?.conversionRate || 0}%** this month.\n\nFull ranking:\n${list}`,
      dataSummary: {
        type: 'LEADERBOARD',
        records: sortedByConversion,
      },
      suggestedFollowUps: ['Who is today’s top performer?', 'Show monthly leaderboard', 'Show finalized deals'],
    };
  }

  // 8. "Show all clients interested in website development"
  if (query.includes('website development') || query.includes('website') || query.includes('digital marketing') || query.includes('interested in')) {
    const term = query.includes('website') ? 'Website' : query.includes('marketing') ? 'Marketing' : 'Software';
    const leads = await prisma.lead.findMany({
      where: {
        servicesRequired: { contains: term },
      },
      include: { assignedTo: true },
    });

    const list = leads
      .map(
        (l, i) =>
          `${i + 1}. **${l.companyName}** | Budget: ₹${l.clientBudget.toLocaleString('en-IN')} | Required: ${l.servicesRequired} | Contact: ${l.contactPerson || l.ownerName} (${l.mobileNumber}) | Assigned: ${l.assignedTo.name}`
      )
      .join('\n');

    return {
      question: prompt,
      answerText: `Found **${leads.length} clients** inquiring about ${term} solutions:\n\n${list}`,
      dataSummary: {
        type: 'LEADS_TABLE',
        records: leads.map((l) => ({
          companyName: l.companyName,
          budget: l.clientBudget,
          services: l.servicesRequired,
          phone: l.mobileNumber,
          executive: l.assignedTo.name,
        })),
      },
      suggestedFollowUps: ['Show hot leads', 'Schedule meeting', 'Who is today’s top performer?'],
    };
  }

  // Default intelligent CRM response:
  const totalLeads = await prisma.lead.count();
  const totalDeals = await prisma.deal.findMany({ where: { status: 'WON' } });
  const totalRevenue = totalDeals.reduce((sum, d) => sum + d.dealValue, 0);

  return {
    question: prompt,
    answerText: `Here is the current DIGITEE WORLD system overview based on real CRM records:\n- Total Active Leads: **${totalLeads}**\n- Finalized Deals: **${totalDeals.length}**\n- Closed Revenue: **₹${totalRevenue.toLocaleString('en-IN')}**\n\nYou can ask me specific questions such as:\n- "Which employee missed the most follow-ups this week?"\n- "Who is today's top performer?"\n- "Which clients are ready to finalize?"\n- "Show me all meetings scheduled for tomorrow."\n- "Which leads have not been contacted in 7 days?"\n- "Give me today's complete sales report."`,
    suggestedFollowUps: [
      'Who is today’s top performer?',
      'Which employee missed the most follow-ups this week?',
      'Which clients are ready to finalize?',
      'Give me today’s complete sales report',
    ],
  };
}
