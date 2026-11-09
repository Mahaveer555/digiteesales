import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { generateDailyReport } from '@/lib/daily-report';
import * as XLSX from 'xlsx';
import { parse } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    const formatType = searchParams.get('format') || 'excel';

    let targetDate = new Date();
    if (dateStr) {
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts[0].length === 4) {
          targetDate = parse(dateStr, 'yyyy-MM-dd', new Date());
        } else {
          targetDate = parse(dateStr, 'dd-MM-yyyy', new Date());
        }
      }
    }

    const report = await generateDailyReport(targetDate);

    if (formatType === 'excel') {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Daily Summary
      const summaryRows = [
        ['DIGITEE WORLD - AI DAILY SALES REPORT'],
        ['Report Date', report.reportDateStr],
        ['Generated At', new Date().toLocaleString()],
        [],
        ['Metric', 'Value'],
        ['Total Meetings Scheduled', report.summary.totalMeetingsScheduled],
        ['Total Meetings Completed', report.summary.totalMeetingsCompleted],
        ['Total New Leads', report.summary.totalNewLeads],
        ['Total Interested Clients', report.summary.totalInterestedClients],
        ['Total Hot Leads', report.summary.totalHotLeads],
        ['Total Follow-ups Completed', report.summary.totalFollowUpsCompleted],
        ['Total Missed Follow-ups', report.summary.totalMissedFollowUps],
        ['Total Deals Finalized', report.summary.totalDealsFinalized],
        ['Total Sales Revenue (INR)', report.summary.totalSalesRevenue],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Team Summary');

      // Sheet 2: Employee Performance
      const empRows = [
        ['Rank', 'Employee Name', 'Meetings Done', 'Leads Generated', 'Interested', 'Follow-ups Done', 'Missed Follow-ups', 'Deals Finalized', 'Sales Value (INR)'],
        ...report.employeePerformance.map((e) => [
          e.rank,
          e.name,
          e.meetingsCompleted,
          e.leadsGenerated,
          e.interestedClients,
          e.followUpsCompleted,
          e.missedFollowUps,
          e.dealsFinalized,
          e.salesValue,
        ]),
      ];
      const wsEmp = XLSX.utils.aoa_to_sheet(empRows);
      XLSX.utils.book_append_sheet(wb, wsEmp, 'Employee Performance');

      // Sheet 3: Tomorrow Plan
      const planRows = [
        ['Type', 'Time', 'Client / Company', 'Assigned Executive', 'Details'],
        ...report.tomorrowActionPlan.meetings.map((m) => ['Meeting', m.time, m.companyName, m.executive, m.type]),
        ...report.tomorrowActionPlan.calls.map((c) => ['Call', c.time, c.companyName, c.executive, c.phone]),
      ];
      const wsPlan = XLSX.utils.aoa_to_sheet(planRows);
      XLSX.utils.book_append_sheet(wb, wsPlan, 'Tomorrow Plan');

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buf, {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="DigiteeWorld_DailyReport_${report.reportDateStr}.xlsx"`,
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 });
  }
}
