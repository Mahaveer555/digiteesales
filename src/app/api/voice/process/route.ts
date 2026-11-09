import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { parseVoiceInputToCRM } from '@/lib/voice-processor';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { transcript } = body;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const structured = parseVoiceInputToCRM(transcript);

    return NextResponse.json({
      success: true,
      transcript,
      extracted: structured,
    });
  } catch (error) {
    console.error('Voice process error:', error);
    return NextResponse.json({ error: 'Failed to parse voice recording' }, { status: 500 });
  }
}
