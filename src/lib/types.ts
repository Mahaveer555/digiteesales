export type UserRole = 'SUPER_ADMIN' | 'SALES_MANAGER' | 'SALES_EXECUTIVE';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export type LeadStatus =
  | 'NEW_LEAD'
  | 'MEETING_SCHEDULED'
  | 'MEETING_COMPLETED'
  | 'INTERESTED'
  | 'HOT_LEAD'
  | 'FINAL_DISCUSSION'
  | 'DEAL_FINALIZED'
  | 'DEAL_LOST'
  | 'NOT_INTERESTED'
  | 'CALLBACK_REQUESTED';

export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'RESCHEDULED' | 'OVERDUE';

export type FollowUpType =
  | 'PHONE_CALL'
  | 'CLIENT_VISIT'
  | 'WHATSAPP'
  | 'EMAIL'
  | 'FINAL_DISCUSSION';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  department: string;
  avatarUrl: string | null;
  totalMeetings: number;
  completedMeetings: number;
  interestedClients: number;
  followUpsCompleted: number;
  missedFollowUps: number;
  dealsFinalized: number;
  totalRevenue: number;
  conversionRate: number; // percentage
  targetAchievement: number; // percentage
  score: number;
}
