import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { calculateLeaderboard, LeaderboardPeriod } from '@/lib/leaderboard';
import { syncOverdueFollowUps } from '@/lib/followup-engine';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    await syncOverdueFollowUps();

    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') || 'monthly') as LeaderboardPeriod;

    const leaderboard = await calculateLeaderboard(period);

    const settings = await prisma.systemSettings.findFirst();

    return NextResponse.json({
      period,
      leaderboard,
      scoringWeights: {
        pointsMeetingCompleted: settings?.pointsMeetingCompleted ?? 10,
        pointsInterestedClient: settings?.pointsInterestedClient ?? 15,
        pointsFinalDiscussion: settings?.pointsFinalDiscussion ?? 20,
        pointsDealFinalized: settings?.pointsDealFinalized ?? 50,
        penaltyOverdueFollowup: settings?.penaltyOverdueFollowup ?? 5,
      },
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
