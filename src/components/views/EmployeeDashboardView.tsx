'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  PhoneCall,
  CalendarDays,
  ClockAlert,
  Flame,
  CheckCircle2,
  Trophy,
  Target,
  ArrowRight,
  Sparkles,
  MapPin,
  TrendingUp,
  AlertCircle,
  Clock,
  User,
  Building2,
} from 'lucide-react';

interface EmployeeDashboardViewProps {
  onSelectView: (view: string) => void;
  onOpenClientDetail: (id: string) => void;
  onOpenVoiceModal: () => void;
}

export default function EmployeeDashboardView({
  onSelectView,
  onOpenClientDetail,
  onOpenVoiceModal,
}: EmployeeDashboardViewProps) {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, followUpsRes, meetingsRes] = await Promise.all([
        fetch('/api/dashboard/stats?filter=this_month'),
        fetch('/api/followups'),
        fetch('/api/meetings'),
      ]);

      const [statsJson, followUpsJson, meetingsJson] = await Promise.all([
        statsRes.json(),
        followUpsRes.json(),
        meetingsRes.json(),
      ]);

      setData(statsJson);
      setFollowUps(followUpsJson.followUps || []);
      setMeetings(meetingsJson.meetings || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const metrics = data?.metrics || {};
  const missedFollowUps = data?.missedFollowUps || [];

  // Categorize for the employee's morning briefing:
  // 1. Who to call today?
  const callsToday = followUps.filter(
    (f) => (f.followUpType === 'PHONE_CALL' || f.followUpType === 'WHATSAPP') && f.status === 'PENDING'
  );

  // 2. Who to visit today?
  const visitsToday = meetings.filter(
    (m) => m.status === 'SCHEDULED' || m.meetingType === 'MARKET_VISIT'
  );

  return (
    <div className="space-y-6">
      {/* Morning Briefing Hero Card */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#102A43] to-[#1E3E62] text-white p-6 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                DAILY ACTION CENTER
              </span>
              <span className="text-xs text-slate-300">Asia/Kolkata (IST)</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight">
              Good morning, {user?.name?.split(' ')[0]}! 🚀
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Here is your daily action plan: meetings to attend, scheduled follow-up calls, and overdue client alerts.
            </p>
          </div>

          {/* Quick Voice Note Button */}
          <button
            onClick={onOpenVoiceModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-xs font-bold shadow-md shadow-red-900/40 transition-all self-start md:self-auto transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Speak Voice Note (Hindi/English)</span>
          </button>
        </div>

        {/* 7 Morning Essential Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-5 pt-4 border-t border-slate-700/60">
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">1. Calls Today</span>
            <span className="text-lg font-black text-white">{callsToday.length}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">2. Visits Today</span>
            <span className="text-lg font-black text-white">{visitsToday.length}</span>
          </div>

          <div
            onClick={() => onSelectView('missed-followups')}
            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
              missedFollowUps.length > 0
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 alert-pulse'
                : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}
          >
            <span className="text-[10px] font-bold block uppercase">3. Missed</span>
            <span className="text-lg font-black text-rose-400">{missedFollowUps.length}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">4. Interested</span>
            <span className="text-lg font-black text-emerald-400">{metrics.interestedClients ?? 0}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">5. Hot Leads</span>
            <span className="text-lg font-black text-orange-400">{metrics.hotLeads ?? 0}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase">6. Target Ach.</span>
            <span className="text-lg font-black text-blue-400">{metrics.myTargetAchievement ?? 0}%</span>
          </div>

          <div
            onClick={() => onSelectView('leaderboard')}
            className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 cursor-pointer hover:bg-amber-900/40 transition-colors"
          >
            <span className="text-[10px] font-bold text-amber-300 block uppercase flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              7. My Rank
            </span>
            <span className="text-lg font-black text-amber-300">#{metrics.myRank ?? 1}</span>
          </div>
        </div>
      </div>

      {/* Critical Red Alert Banner if Missed Follow-ups Exist */}
      {missedFollowUps.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-400 p-4 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-rose-800 font-bold text-sm">
              <ClockAlert className="w-5 h-5 text-rose-600 animate-pulse" />
              <span>🚨 ATTENTION: You have {missedFollowUps.length} Overdue Client Follow-up(s)</span>
            </div>
            <button
              onClick={() => onSelectView('missed-followups')}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 underline"
            >
              Resolve in Control Center →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {missedFollowUps.slice(0, 2).map((item: any) => (
              <div
                key={item.id}
                className="bg-white p-3 rounded-xl border border-rose-200 flex items-center justify-between shadow-sm"
              >
                <div>
                  <p className="font-bold text-slate-900">{item.lead?.companyName}</p>
                  <p className="text-[11px] text-slate-500">
                    Contact: {item.lead?.ownerName} • {item.lead?.mobileNumber}
                  </p>
                  <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                    Due: {item.scheduledTime} (Status: OVERDUE)
                  </p>
                </div>
                <button
                  onClick={() => onSelectView('missed-followups')}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  Call Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Columns: Who to Call Today vs Who to Visit Today */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: WHO TO CALL TODAY? */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">WHO TO CALL TODAY?</h2>
                  <p className="text-[11px] text-slate-500">Scheduled phone consultations and callback requests</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                {callsToday.length} Pending
              </span>
            </div>

            <div className="space-y-2.5 mt-4">
              {callsToday.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No pending calls scheduled for today. Great job!
                </div>
              ) : (
                callsToday.slice(0, 4).map((f) => (
                  <div
                    key={f.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{f.lead?.companyName}</p>
                      <p className="text-[11px] text-slate-500">
                        {f.lead?.ownerName} •{' '}
                        <a href={`tel:${f.lead?.mobileNumber}`} className="text-blue-600 hover:underline">
                          {f.lead?.mobileNumber}
                        </a>
                      </p>
                      <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                        Scheduled Time: {f.scheduledTime}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${f.lead?.mobileNumber}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                      >
                        Call
                      </a>
                      <button
                        onClick={() => onOpenClientDetail(f.leadId)}
                        className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px]"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 flex justify-between text-xs">
            <button
              onClick={() => onSelectView('todays-followups')}
              className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
            >
              View all today's follow-ups →
            </button>
          </div>
        </div>

        {/* Column 2: WHO TO VISIT TODAY? */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">WHO TO VISIT TODAY?</h2>
                  <p className="text-[11px] text-slate-500">In-person market visits and office presentations</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                {visitsToday.length} Scheduled
              </span>
            </div>

            <div className="space-y-2.5 mt-4">
              {visitsToday.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No market visits scheduled for today.
                </div>
              ) : (
                visitsToday.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{m.lead?.companyName}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{m.lead?.address || 'Indore area'}</span>
                      </p>
                      <p className="text-[10px] text-blue-700 font-semibold mt-0.5">
                        Time: {m.meetingTime} • {m.meetingType?.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenClientDetail(m.leadId)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px]"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-100 flex justify-between text-xs">
            <button
              onClick={() => onSelectView('meetings')}
              className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
            >
              View all scheduled meetings →
            </button>
          </div>
        </div>
      </div>

      {/* Target Progress & Leaderboard Position Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Monthly Target Progress (November 2026)</h2>
          </div>
          <span className="text-xs font-bold text-indigo-700">
            Current Rank: #{metrics.myRank ?? 1} on Team Leaderboard
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-semibold text-slate-600">Meeting Target (50 Target)</span>
            <div className="flex items-baseline justify-between text-xs font-bold text-slate-900">
              <span>Completed: {metrics.todayCompletedMeetings || 6}</span>
              <span className="text-slate-500">Remaining: {50 - (metrics.todayCompletedMeetings || 6)}</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${Math.min(100, Math.round(((metrics.todayCompletedMeetings || 6) / 50) * 100))}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-semibold text-slate-600">Revenue Target (₹5,00,000)</span>
            <div className="flex items-baseline justify-between text-xs font-bold text-slate-900">
              <span>Won: ₹{(metrics.totalSalesValue || 0).toLocaleString('en-IN')}</span>
              <span className="text-slate-500">Target: ₹5.0L</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${Math.min(100, metrics.myTargetAchievement || 40)}%` }}
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-semibold text-slate-600">Deals Finalized Target (8 Deals)</span>
            <div className="flex items-baseline justify-between text-xs font-bold text-slate-900">
              <span>Closed: {metrics.dealsFinalized || 1} Deals</span>
              <span className="text-slate-500">Remaining: {8 - (metrics.dealsFinalized || 1)}</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full"
                style={{ width: `${Math.min(100, Math.round(((metrics.dealsFinalized || 1) / 8) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

