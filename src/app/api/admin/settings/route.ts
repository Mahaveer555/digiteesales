import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, forbiddenResponse, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    let settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 'default',
          companyName: 'DIGITEE WORLD',
          productName: 'Digitee World AI Sales CRM',
          timezone: 'Asia/Kolkata',
          gracePeriodHours: 2,
          pointsMeetingCompleted: 10,
          pointsInterestedClient: 15,
          pointsFinalDiscussion: 20,
          pointsDealFinalized: 50,
          penaltyOverdueFollowup: 5,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();
    if (user.role !== 'SUPER_ADMIN') {
      return forbiddenResponse('Only Super Admin can modify CRM settings');
    }

    const body = await req.json();
    const {
      companyName,
      productName,
      gracePeriodHours,
      pointsMeetingCompleted,
      pointsInterestedClient,
      pointsFinalDiscussion,
      pointsDealFinalized,
      penaltyOverdueFollowup,
    } = body;

    const updated = await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {
        companyName: companyName || 'DIGITEE WORLD',
        productName: productName || 'Digitee World AI Sales CRM',
        gracePeriodHours: parseInt(gracePeriodHours) || 2,
        pointsMeetingCompleted: parseInt(pointsMeetingCompleted) || 10,
        pointsInterestedClient: parseInt(pointsInterestedClient) || 15,
        pointsFinalDiscussion: parseInt(pointsFinalDiscussion) || 20,
        pointsDealFinalized: parseInt(pointsDealFinalized) || 50,
        penaltyOverdueFollowup: parseInt(penaltyOverdueFollowup) || 5,
      },
      create: {
        id: 'default',
        companyName: companyName || 'DIGITEE WORLD',
        productName: productName || 'Digitee World AI Sales CRM',
        gracePeriodHours: parseInt(gracePeriodHours) || 2,
        pointsMeetingCompleted: parseInt(pointsMeetingCompleted) || 10,
        pointsInterestedClient: parseInt(pointsInterestedClient) || 15,
        pointsFinalDiscussion: parseInt(pointsFinalDiscussion) || 20,
        pointsDealFinalized: parseInt(pointsDealFinalized) || 50,
        penaltyOverdueFollowup: parseInt(penaltyOverdueFollowup) || 5,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
