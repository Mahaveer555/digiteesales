import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { processAiQuery } from '@/lib/ai-assistant';
import { syncOverdueFollowUps } from '@/lib/followup-engine';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    await syncOverdueFollowUps();

    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const result = await processAiQuery(prompt, user.role, user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('AI query error:', error);
    return NextResponse.json({ error: 'Failed to process AI query' }, { status: 500 });
  }
}
