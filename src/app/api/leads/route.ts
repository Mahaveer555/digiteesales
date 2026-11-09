import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, unauthorizedResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseCombinedDateTime } from '@/lib/date-utils';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status');
    const interest = searchParams.get('interest');
    const assignedTo = searchParams.get('assignedTo');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Role-based isolation
    if (user.role === 'SALES_EXECUTIVE') {
      where.assignedToId = user.id;
    } else if (assignedTo) {
      where.assignedToId = assignedTo;
    }

    if (status) {
      where.status = status;
    }

    if (interest) {
      where.interestLevel = interest;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { ownerName: { contains: search } },
        { mobileNumber: { contains: search } },
        { city: { contains: search } },
        { servicesRequired: { contains: search } },
      ];
    }

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
          meetings: {
            orderBy: { meetingDate: 'desc' },
            take: 1,
          },
          followUps: {
            where: { status: 'PENDING' },
            orderBy: { dueDateTime: 'asc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Leads fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
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
      leadSource,
      firstMeetingDate,
      meetingTime,
      status,
      interestLevel,
      clientBudget,
      dealValue,
      nextFollowUpDate,
      nextFollowUpTime,
      followUpType,
      expectedClosingDate,
      remarks,
      assignedToId,
    } = body;

    // Validation
    if (!companyName || !ownerName || !mobileNumber) {
      return NextResponse.json(
        { error: 'Company Name, Owner Name, and Mobile Number are required' },
        { status: 400 }
      );
    }

    // Duplicate Check using mobile number and matching criteria (Section 9)
    const existing = await prisma.lead.findFirst({
      where: {
        OR: [
          { mobileNumber: mobileNumber.trim() },
          { companyName: { equals: companyName.trim() } },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `Duplicate lead detected! Lead "${existing.companyName}" already exists with mobile ${existing.mobileNumber}.`,
          existingLeadId: existing.id,
        },
        { status: 409 }
      );
    }

    const assignedId = user.role === 'SALES_EXECUTIVE' ? user.id : (assignedToId || user.id);

    const lead = await prisma.lead.create({
      data: {
        companyName: companyName.trim(),
        ownerName: ownerName.trim(),
        contactPerson: contactPerson?.trim() || ownerName.trim(),
        mobileNumber: mobileNumber.trim(),
        whatsappNumber: whatsappNumber?.trim() || mobileNumber.trim(),
        address: address?.trim() || 'Indore Area',
        city: city?.trim() || 'Indore',
        industryCategory: industryCategory?.trim() || 'Commercial Enterprise',
        servicesRequired: Array.isArray(servicesRequired) ? servicesRequired.join(', ') : servicesRequired || 'Website Development',
        leadSource: leadSource || 'Market Visit',
        firstMeetingDate: firstMeetingDate ? new Date(firstMeetingDate) : new Date(),
        meetingTime: meetingTime || '11:00 AM',
        status: status || 'NEW_LEAD',
        interestLevel: interestLevel || 'MEDIUM',
        clientBudget: parseFloat(clientBudget) || 50000,
        dealValue: parseFloat(dealValue) || 0,
        nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        nextFollowUpTime: nextFollowUpTime || '11:00 AM',
        followUpType: followUpType || 'PHONE_CALL',
        expectedClosingDate: expectedClosingDate ? new Date(expectedClosingDate) : null,
        remarks,
        assignedToId: assignedId,
      },
    });

    // Auto-create initial meeting if specified
    if (firstMeetingDate) {
      await prisma.meeting.create({
        data: {
          leadId: lead.id,
          userId: assignedId,
          meetingDate: new Date(firstMeetingDate),
          meetingTime: meetingTime || '11:00 AM',
          meetingType: leadSource === 'Market Visit' ? 'MARKET_VISIT' : 'OFFICE_MEETING',
          status: 'COMPLETED',
          discussionPoints: `Initial consultation for ${lead.companyName}. Services requested: ${lead.servicesRequired}.`,
          interestLevel: lead.interestLevel,
          clientRemarks: remarks || 'Client requested initial proposal.',
          completedAt: new Date(),
        },
      });
    }

    // Auto-create follow-up if scheduled
    if (nextFollowUpDate) {
      const dueDateTime = parseCombinedDateTime(nextFollowUpDate, nextFollowUpTime || '11:00 AM');
      await prisma.followUp.create({
        data: {
          leadId: lead.id,
          userId: assignedId,
          scheduledDate: new Date(nextFollowUpDate),
          scheduledTime: nextFollowUpTime || '11:00 AM',
          dueDateTime,
          followUpType: followUpType || 'PHONE_CALL',
          priority: interestLevel === 'HOT' ? 'URGENT' : 'MEDIUM',
          remarks: `Follow-up following initial creation. ${remarks || ''}`,
          status: 'PENDING',
        },
      });
    }

    // Timeline creation
    await prisma.clientTimeline.create({
      data: {
        leadId: lead.id,
        userId: user.id,
        activityType: 'CREATED',
        title: 'New Lead Added to Digitee World CRM',
        description: `Lead created by ${user.name} via ${leadSource || 'Market Visit'}. Initial interest: ${interestLevel || 'MEDIUM'}.`,
      },
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
