import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { subDays, addDays, subHours, addHours } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Digitee World AI Sales CRM database...');

  // Clear existing
  await prisma.notification.deleteMany();
  await prisma.clientTimeline.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.salesTarget.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSettings.deleteMany();
  await prisma.aiDailyReport.deleteMany();

  // 1. System Settings
  await prisma.systemSettings.create({
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
      aiSalesSummaryEnabled: true,
      autoOverdueCheckMinutes: 15,
      updatedAt: new Date(),
    },
  });

  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

  // 2. Users (Super Admin, Sales Manager, Sales Executives)
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Vikramaditya Rathore',
      email: 'admin@digiteeworld.com',
      passwordHash: defaultPasswordHash,
      role: 'SUPER_ADMIN',
      department: 'Executive Leadership',
      phone: '+91 98260 11001',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Amit Saxena',
      email: 'manager@digiteeworld.com',
      passwordHash: defaultPasswordHash,
      role: 'SALES_MANAGER',
      department: 'Corporate Sales',
      phone: '+91 98260 22002',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  const rahul = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'rahul@digiteeworld.com',
      passwordHash: defaultPasswordHash,
      role: 'SALES_EXECUTIVE',
      department: 'Field Sales',
      phone: '+91 98260 33003',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'priya@digiteeworld.com',
      passwordHash: defaultPasswordHash,
      role: 'SALES_EXECUTIVE',
      department: 'Digital Solutions',
      phone: '+91 98260 44004',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    },
  });

  const ankit = await prisma.user.create({
    data: {
      name: 'Ankit Verma',
      email: 'ankit@digiteeworld.com',
      passwordHash: defaultPasswordHash,
      role: 'SALES_EXECUTIVE',
      department: 'Retail & FMCG',
      phone: '+91 98260 55005',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    },
  });

  const sneha = await prisma.user.create({
    data: {
      name: 'Sneha Nair',
      email: 'sneha@digiteeworld.com',
      passwordHash: defaultPasswordHash,
      role: 'SALES_EXECUTIVE',
      department: 'Enterprise Sales',
      phone: '+91 98260 66006',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    },
  });

  console.log('Created accounts: Super Admin, Sales Manager, 4 Sales Executives');

  // 3. Targets for November 2026
  const currentMonth = 11;
  const currentYear = 2026;

  for (const emp of [rahul, priya, ankit, sneha]) {
    await prisma.salesTarget.create({
      data: {
        userId: emp.id,
        month: currentMonth,
        year: currentYear,
        targetMeetings: 50,
        targetLeads: 35,
        targetRevenue: 600000,
        targetDeals: 8,
      },
    });
  }

  // 4. Leads & Clients
  const now = new Date();

  // Lead 1: Sharma Industries (Overdue Follow-up Example for Rahul Sharma)
  const lead1 = await prisma.lead.create({
    data: {
      companyName: 'Sharma Industries',
      ownerName: 'Sunil Sharma',
      contactPerson: 'Sunil Sharma (Managing Director)',
      mobileNumber: '+91 98930 11223',
      whatsappNumber: '+91 98930 11223',
      address: 'Plot 45, Sector B, Sanwer Road Industrial Area',
      city: 'Indore',
      industryCategory: 'Heavy Machinery & Fabrication',
      servicesRequired: 'Custom ERP, Website Development, SEO',
      leadSource: 'Market Visit',
      firstMeetingDate: subDays(now, 5),
      meetingTime: '11:00 AM',
      status: 'INTERESTED',
      interestLevel: 'HIGH',
      clientBudget: 150000,
      dealValue: 150000,
      nextFollowUpDate: subHours(now, 5),
      nextFollowUpTime: '11:00 AM',
      followUpType: 'PHONE_CALL',
      expectedClosingDate: addDays(now, 10),
      remarks: 'Client requested callback after consulting board members.',
      assignedToId: rahul.id,
    },
  });

  // Lead 2: Apex Textiles (High intent / Hot deal)
  const lead2 = await prisma.lead.create({
    data: {
      companyName: 'Apex Textiles Pvt Ltd',
      ownerName: 'Manish Chawla',
      contactPerson: 'Pooja Sethi (Operations Head)',
      mobileNumber: '+91 98930 22334',
      whatsappNumber: '+91 98930 22334',
      address: '102 Millenium Business Park, AB Road',
      city: 'Indore',
      industryCategory: 'Textiles & Garments',
      servicesRequired: 'E-commerce Portal, Digital Marketing, Google Ads',
      leadSource: 'Direct Call',
      firstMeetingDate: subDays(now, 3),
      meetingTime: '02:30 PM',
      status: 'HOT_LEAD',
      interestLevel: 'HOT',
      clientBudget: 280000,
      dealValue: 280000,
      nextFollowUpDate: addDays(now, 1),
      nextFollowUpTime: '03:00 PM',
      followUpType: 'CLIENT_VISIT',
      expectedClosingDate: addDays(now, 5),
      remarks: 'Quotation sent. Final discussion on commercial terms scheduled tomorrow.',
      assignedToId: priya.id,
    },
  });

  // Lead 3: Malwa Agro Technologies (Final Discussion)
  const lead3 = await prisma.lead.create({
    data: {
      companyName: 'Malwa Agro Technologies',
      ownerName: 'Dr. Rameshwar Patidar',
      contactPerson: 'Karan Patidar',
      mobileNumber: '+91 98930 33445',
      whatsappNumber: '+91 98930 33445',
      address: '22 Krishi Vihar, Dewas Naka',
      city: 'Indore',
      industryCategory: 'Agriculture & Fertilizer',
      servicesRequired: 'Custom CRM & Supply Chain Management',
      leadSource: 'Exhibition',
      firstMeetingDate: subDays(now, 8),
      meetingTime: '12:00 PM',
      status: 'FINAL_DISCUSSION',
      interestLevel: 'HOT',
      clientBudget: 350000,
      dealValue: 350000,
      nextFollowUpDate: now,
      nextFollowUpTime: '04:30 PM',
      followUpType: 'FINAL_DISCUSSION',
      expectedClosingDate: addDays(now, 2),
      remarks: 'Draft contract shared. Ready for final handshake agreement.',
      assignedToId: rahul.id,
    },
  });

  // Lead 4: Global Health Diagnostics (Deal Finalized)
  const lead4 = await prisma.lead.create({
    data: {
      companyName: 'Global Health Diagnostics',
      ownerName: 'Dr. Neeraj Bhargava',
      contactPerson: 'Dr. Neeraj Bhargava',
      mobileNumber: '+91 98930 44556',
      whatsappNumber: '+91 98930 44556',
      address: 'Opposite CHL Hospital, LIG Square',
      city: 'Indore',
      industryCategory: 'Healthcare & Pathology',
      servicesRequired: 'Patient Portal, SEO, WhatsApp Automation',
      leadSource: 'Referral',
      firstMeetingDate: subDays(now, 14),
      meetingTime: '10:30 AM',
      status: 'DEAL_FINALIZED',
      interestLevel: 'HOT',
      clientBudget: 220000,
      dealValue: 220000,
      followUpType: 'PHONE_CALL',
      remarks: 'Deal closed with 50% advance token received via NEFT.',
      assignedToId: sneha.id,
    },
  });

  // Lead 5: Royal Jewelers (Callback requested)
  const lead5 = await prisma.lead.create({
    data: {
      companyName: 'Royal Jewelers & Gems',
      ownerName: 'Dharmendra Soni',
      contactPerson: 'Gaurav Soni',
      mobileNumber: '+91 98930 55667',
      whatsappNumber: '+91 98930 55667',
      address: 'Sarafa Bazaar',
      city: 'Indore',
      industryCategory: 'Luxury Retail',
      servicesRequired: 'Social Media Management, High-res Catalog Website',
      leadSource: 'Market Visit',
      firstMeetingDate: subDays(now, 2),
      meetingTime: '04:00 PM',
      status: 'CALLBACK_REQUESTED',
      interestLevel: 'HIGH',
      clientBudget: 120000,
      dealValue: 120000,
      nextFollowUpDate: addDays(now, 2),
      nextFollowUpTime: '11:30 AM',
      followUpType: 'PHONE_CALL',
      expectedClosingDate: addDays(now, 12),
      remarks: 'Owner in festival exhibition, asked to call on Tuesday 11:30 AM.',
      assignedToId: priya.id,
    },
  });

  // Lead 6: Bright EduTech (Missed follow-up 2 for Ankit)
  const lead6 = await prisma.lead.create({
    data: {
      companyName: 'Bright EduTech Academy',
      ownerName: 'Vikas Jaiswal',
      contactPerson: 'Anjali Deshmukh',
      mobileNumber: '+91 98930 66778',
      whatsappNumber: '+91 98930 66778',
      address: '304 Orbit Mall, Vijay Nagar',
      city: 'Indore',
      industryCategory: 'Education & Coaching',
      servicesRequired: 'LMS Application, Google Ads Lead Gen',
      leadSource: 'Website Inquiry',
      firstMeetingDate: subDays(now, 6),
      meetingTime: '01:00 PM',
      status: 'INTERESTED',
      interestLevel: 'MEDIUM',
      clientBudget: 95000,
      dealValue: 95000,
      nextFollowUpDate: subDays(now, 1),
      nextFollowUpTime: '02:00 PM',
      followUpType: 'PHONE_CALL',
      remarks: 'Overdue follow-up. Ankit needs to follow up on the demo feedback.',
      assignedToId: ankit.id,
    },
  });

  // 5. Create Meetings
  await prisma.meeting.createMany({
    data: [
      {
        leadId: lead1.id,
        userId: rahul.id,
        meetingDate: subDays(now, 5),
        meetingTime: '11:00 AM',
        meetingType: 'MARKET_VISIT',
        status: 'COMPLETED',
        discussionPoints: 'Met with MD Sunil Sharma. Evaluated current manual inventory and web presence.',
        outcome: 'Positive interest in digital transformation.',
        interestLevel: 'HIGH',
        clientRemarks: 'Interested in website and ERP.',
        nextAction: 'Send technical proposal.',
        completedAt: subDays(now, 5),
      },
      {
        leadId: lead2.id,
        userId: priya.id,
        meetingDate: subDays(now, 3),
        meetingTime: '02:30 PM',
        meetingType: 'OFFICE_MEETING',
        status: 'COMPLETED',
        discussionPoints: 'Presented live demo of e-commerce storefront & B2B portal capabilities.',
        outcome: 'Very impressed with fast loading speed and WhatsApp order bot.',
        interestLevel: 'HOT',
        clientRemarks: 'Ready to finalize after commercial terms review.',
        nextAction: 'Schedule commercial sign-off.',
        completedAt: subDays(now, 3),
      },
      {
        leadId: lead3.id,
        userId: rahul.id,
        meetingDate: now,
        meetingTime: '04:30 PM',
        meetingType: 'OFFICE_MEETING',
        status: 'SCHEDULED',
        discussionPoints: 'Contract clause discussion and milestone schedule.',
        interestLevel: 'HOT',
        clientRemarks: 'Wants delivery in 45 days.',
        nextAction: 'Sign agreement.',
      },
      {
        leadId: lead2.id,
        userId: priya.id,
        meetingDate: addDays(now, 1),
        meetingTime: '03:00 PM',
        meetingType: 'CLIENT_VISIT',
        status: 'SCHEDULED',
        discussionPoints: 'Final contract signing with Manish Chawla.',
        interestLevel: 'HOT',
        nextAction: 'Collect token advance cheque.',
      },
      {
        leadId: lead5.id,
        userId: priya.id,
        meetingDate: subDays(now, 2),
        meetingTime: '04:00 PM',
        meetingType: 'MARKET_VISIT',
        status: 'COMPLETED',
        discussionPoints: 'Visited Sarafa retail showroom. Explained social media viral reel strategies.',
        outcome: 'Warm response, requested callback after upcoming wedding festival.',
        interestLevel: 'HIGH',
        completedAt: subDays(now, 2),
      },
      {
        leadId: lead4.id,
        userId: sneha.id,
        meetingDate: subDays(now, 1),
        meetingTime: '11:30 AM',
        meetingType: 'OFFICE_MEETING',
        status: 'COMPLETED',
        discussionPoints: 'Final onboarding meeting, server credentials and scope verification.',
        outcome: 'Signed MoU and verified bank transfer.',
        interestLevel: 'HOT',
        completedAt: subDays(now, 1),
      },
    ],
  });

  // 6. Follow-Ups (Including Missed Follow-up for Rahul & Ankit)
  const overdueTime1 = subHours(now, 5); // 5 hours overdue!
  const overdueTime2 = subDays(now, 1); // 1 day overdue!

  await prisma.followUp.createMany({
    data: [
      {
        leadId: lead1.id,
        userId: rahul.id,
        scheduledDate: overdueTime1,
        scheduledTime: '11:00 AM',
        dueDateTime: overdueTime1,
        followUpType: 'PHONE_CALL',
        status: 'OVERDUE',
        priority: 'URGENT',
        isOverdue: true,
        overdueSince: overdueTime1,
        remarks: 'Call Sunil Sharma regarding board approval for ERP project.',
      },
      {
        leadId: lead6.id,
        userId: ankit.id,
        scheduledDate: overdueTime2,
        scheduledTime: '02:00 PM',
        dueDateTime: overdueTime2,
        followUpType: 'PHONE_CALL',
        status: 'OVERDUE',
        priority: 'HIGH',
        isOverdue: true,
        overdueSince: overdueTime2,
        remarks: 'Follow up on LMS demo feedback with Anjali Deshmukh.',
      },
      {
        leadId: lead3.id,
        userId: rahul.id,
        scheduledDate: now,
        scheduledTime: '04:30 PM',
        dueDateTime: addHours(now, 2),
        followUpType: 'FINAL_DISCUSSION',
        status: 'PENDING',
        priority: 'URGENT',
        remarks: 'Contract sign-off call before in-person visit.',
      },
      {
        leadId: lead2.id,
        userId: priya.id,
        scheduledDate: addDays(now, 1),
        scheduledTime: '03:00 PM',
        dueDateTime: addDays(now, 1),
        followUpType: 'CLIENT_VISIT',
        status: 'PENDING',
        priority: 'HIGH',
        remarks: 'Executive visit to close Apex Textiles account.',
      },
      {
        leadId: lead4.id,
        userId: sneha.id,
        scheduledDate: subDays(now, 1),
        scheduledTime: '10:00 AM',
        dueDateTime: subDays(now, 1),
        followUpType: 'PHONE_CALL',
        status: 'COMPLETED',
        priority: 'MEDIUM',
        completedAt: subDays(now, 1),
        remarks: 'Confirmed payment receipt and scheduled kickoff call.',
      },
    ],
  });

  // 7. Closed Deals
  await prisma.deal.createMany({
    data: [
      {
        leadId: lead4.id,
        userId: sneha.id,
        dealTitle: 'Global Health Full Digital & SEO Suite',
        dealValue: 220000,
        status: 'WON',
        closeDate: subDays(now, 1),
        paymentTerms: '50% Token Advance Received',
        remarks: 'Signed contract for 1-year annual service agreement.',
      },
      {
        leadId: lead2.id,
        userId: priya.id,
        dealTitle: 'Apex Textiles B2B Platform & Ad Management',
        dealValue: 280000,
        status: 'WON',
        closeDate: now,
        paymentTerms: '40% Advance, 40% Milestone, 20% Delivery',
        remarks: 'Closed high value account with executive incentive.',
      },
    ],
  });

  // 8. Timelines
  await prisma.clientTimeline.createMany({
    data: [
      {
        leadId: lead1.id,
        userId: rahul.id,
        activityType: 'CREATED',
        title: 'Lead Created via Cold Market Visit',
        description: 'Rahul Sharma initiated market visit to Sanwer Road industrial area.',
        createdAt: subDays(now, 5),
      },
      {
        leadId: lead1.id,
        userId: rahul.id,
        activityType: 'MEETING_LOGGED',
        title: 'First Market Visit Completed',
        description: 'Met Sunil Sharma. Demoed Digitee World custom ERP capabilities.',
        createdAt: subDays(now, 5),
      },
      {
        leadId: lead1.id,
        userId: rahul.id,
        activityType: 'OVERDUE_ALERT',
        title: 'Follow-up Became Overdue',
        description: 'Scheduled 11:00 AM follow-up missed by 5 hours. System generated alert for Super Admin.',
        createdAt: subHours(now, 5),
      },
      {
        leadId: lead2.id,
        userId: priya.id,
        activityType: 'CREATED',
        title: 'Lead Inbound Inquiry Received',
        description: 'Direct call from MD Manish Chawla.',
        createdAt: subDays(now, 3),
      },
      {
        leadId: lead2.id,
        userId: priya.id,
        activityType: 'DEAL_WON',
        title: 'Deal Won: ₹2,80,000',
        description: 'Contract signed for B2B portal & ad campaign.',
        createdAt: now,
      },
    ],
  });

  // 9. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: rahul.id,
        title: '🚨 Missed Follow-up Alert',
        message: 'Your scheduled follow-up with Sharma Industries (11:00 AM) is OVERDUE by 5 hours.',
        type: 'MISSED_FOLLOWUP',
        relatedLeadId: lead1.id,
        isRead: false,
      },
      {
        userId: superAdmin.id,
        title: '🚨 Overdue Alert: Rahul Sharma',
        message: 'Employee Rahul Sharma missed scheduled follow-up with Sharma Industries. Delay: 5 Hours.',
        type: 'MISSED_FOLLOWUP',
        relatedLeadId: lead1.id,
        isRead: false,
      },
      {
        userId: superAdmin.id,
        title: '🚨 Overdue Alert: Ankit Verma',
        message: 'Employee Ankit Verma missed scheduled follow-up with Bright EduTech Academy. Delay: 1 Day.',
        type: 'MISSED_FOLLOWUP',
        relatedLeadId: lead6.id,
        isRead: false,
      },
      {
        userId: superAdmin.id,
        title: '🎉 New Deal Finalized: ₹2,80,000',
        message: 'Priya Patel finalized deal with Apex Textiles Pvt Ltd.',
        type: 'DEAL_CLOSED',
        relatedLeadId: lead2.id,
        isRead: false,
      },
    ],
  });

  // 10. Attendance
  await prisma.attendance.createMany({
    data: [
      {
        userId: rahul.id,
        date: now,
        punchIn: new Date(new Date().setHours(9, 15, 0, 0)),
        status: 'ON_FIELD',
        remarks: 'Market visits in Sanwer Road and Dewas Naka.',
      },
      {
        userId: priya.id,
        date: now,
        punchIn: new Date(new Date().setHours(9, 25, 0, 0)),
        status: 'PRESENT',
        remarks: 'Office meetings and corporate client presentations.',
      },
      {
        userId: sneha.id,
        date: now,
        punchIn: new Date(new Date().setHours(9, 10, 0, 0)),
        status: 'PRESENT',
        remarks: 'Client onboarding.',
      },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
