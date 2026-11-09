import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            phone: true,
          },
        },
        meetings: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { meetingDate: 'desc' },
        },
        followUps: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { dueDateTime: 'desc' },
        },
        deals: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { closeDate: 'desc' },
        },
        timeline: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Role-based access check
    if (user.role === 'SALES_EXECUTIVE' && lead.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to view this lead' }, { status: 403 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Lead detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch lead details' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = params;
    const body = await req.json();

    const currentLead = await prisma.lead.findUnique({ where: { id } });
    if (!currentLead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    if (user.role === 'SALES_EXECUTIVE' && currentLead.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this lead' }, { status: 403 });
    }

    const {
      companyName,
      ownerName,
      contactPerson,
      mobileNumber,
      whatsappNumber,
      address,
      city,
      industryCategory,
      servicesRequired,
      interestLevel,
      clientBudget,
      dealValue,
      remarks,
      assignedToId,
    } = body;

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        companyName: companyName?.trim() || currentLead.companyName,
        ownerName: ownerName?.trim() || currentLead.ownerName,
        contactPerson: contactPerson?.trim() || currentLead.contactPerson,
        mobileNumber: mobileNumber?.trim() || currentLead.mobileNumber,
        whatsappNumber: whatsappNumber?.trim() || currentLead.whatsappNumber,
        address: address?.trim() || currentLead.address,
        city: city?.trim() || currentLead.city,
        industryCategory: industryCategory?.trim() || currentLead.industryCategory,
        servicesRequired: servicesRequired || currentLead.servicesRequired,
        interestLevel: interestLevel || currentLead.interestLevel,
        clientBudget: clientBudget !== undefined ? parseFloat(clientBudget) : currentLead.clientBudget,
        dealValue: dealValue !== undefined ? parseFloat(dealValue) : currentLead.dealValue,
        remarks: remarks !== undefined ? remarks : currentLead.remarks,
        assignedToId: user.role === 'SUPER_ADMIN' && assignedToId ? assignedToId : currentLead.assignedToId,
      },
    });

    await prisma.clientTimeline.create({
      data: {
        leadId: id,
        userId: user.id,
        activityType: 'NOTE_ADDED',
        title: 'Lead Information Updated',
        description: `Details updated by ${user.name}.`,
      },
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}
