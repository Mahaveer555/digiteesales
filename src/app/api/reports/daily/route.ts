import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { generateDailyReport } from '@/lib/daily-report';
import { syncOverdueFollowUps } from '@/lib/followup-engine';
import { parse } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    await syncOverdueFollowUps();

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date'); // e.g. "07-11-2026" or "2026-11-07"

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
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Daily report error:', error);
    return NextResponse.json({ error: 'Failed to generate AI daily sales report' }, { status: 500 });
  }
}
