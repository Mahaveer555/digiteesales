'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  CalendarDays,
  PhoneCall,
  ClockAlert,
  Flame,
  CheckCircle2,
  XCircle,
  IndianRupee,
  TrendingUp,
  Percent,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Funnel,
  FunnelChart,
  LabelList,
} from 'recharts';

interface AdminDashboardViewProps {
  onSelectView: (view: string) => void;
  onOpenClientDetail: (id: string) => void;
}

export default function AdminDashboardView({ onSelectView, onOpenClientDetail }: AdminDashboardViewProps) {
  const [filter, setFilter] = useState('this_month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?filter=${filter}`);
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filter]);

  const metrics = data?.metrics || {};
  const analytics = data?.analytics || {};

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Sales Intelligence Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              LIVE CRM DATA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time monitoring of market visits, overdue client follow-ups, employee performance & revenue.
          </p>
        </div>

        {/* Filter Pills (Prompt Section 3) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'last_7_days', label: 'Last 7 Days' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === item.id
                  ? 'bg-[#0B192C] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Critical Overdue Follow-up Alert Banner (if any missed) */}
      {metrics.missedFollowUpsCount > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
              <ClockAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                CRITICAL ALERT: {metrics.missedFollowUpsCount} Missed Follow-up(s) Detected
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-200 text-rose-900 font-bold uppercase">
                  Action Required
                </span>
              </h3>
              <p className="text-xs text-rose-700">
                Scheduled follow-up time has passed without completion. Leads risk dropping off if not attended immediately.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectView('missed-followups')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-600/30 shrink-0 transition-all"
          >
            Open Missed Follow-up Center →
          </button>
        </div>
      )}

      {/* Key Metric Cards (13 required indicators per Prompt Section 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
        {/* Total Sales Value */}
        <div className="col-span-2 bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white p-4 rounded-2xl shadow-md border border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <p className="text-2xl font-black text-white tracking-tight">
              ₹{(metrics.totalSalesValue || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>{metrics.dealsFinalized || 0} Deals Finalized</span>
            </p>
          </div>
          <div className="text-[10px] text-slate-400 border-t border-slate-700/60 pt-2 flex justify-between">
            <span>Lost Deals: {metrics.lostDeals || 0}</span>
            <span>Target: 100% compliant</span>
          </div>
        </div>

        {/* Total Leads */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Leads</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 my-1">{metrics.totalLeads ?? 0}</p>
          <span className="text-[10px] text-blue-600 font-medium">Pipeline Accounts</span>
        </div>

        {/* Today's Meetings */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Today's Meetings</span>
            <CalendarDays className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 my-1">
            {metrics.todayCompletedMeetings ?? 0} / {metrics.todayMeetings ?? 0}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">
            {metrics.todayCompletedMeetings} Completed
          </span>
        </div>

        {/* Today's Follow-ups */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Today's Follow-ups</span>
            <PhoneCall className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 my-1">
            {metrics.todayCompletedFollowUps ?? 0} / {metrics.todayFollowUps ?? 0}
          </p>
          <span className="text-[10px] text-amber-600 font-medium">Scheduled Calls</span>
        </div>

        {/* Missed Follow-ups */}
        <div
          onClick={() => onSelectView('missed-followups')}
          className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-between cursor-pointer hover:bg-rose-100/60 transition-all"
        >
          <div className="flex items-center justify-between text-rose-800 text-xs font-semibold">
            <span>Missed Follow-ups</span>
            <ClockAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700 my-1">{metrics.missedFollowUpsCount ?? 0}</p>
          <span className="text-[10px] text-rose-700 font-bold uppercase underline">
            Open Control Center →
          </span>
        </div>

        {/* Interested Clients */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Interested Clients</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 my-1">{metrics.interestedClients ?? 0}</p>
          <span className="text-[10px] text-emerald-600 font-medium">High Intent Accounts</span>
        </div>

        {/* Hot Leads */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Hot Leads</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 my-1">{metrics.hotLeads ?? 0}</p>
          <span className="text-[10px] text-orange-600 font-medium">Ready to Close</span>
        </div>

        {/* Final Discussions */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Final Discussions</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 my-1">{metrics.finalDiscussions ?? 0}</p>
          <span className="text-[10px] text-purple-600 font-medium">Closing Handshake</span>
        </div>

        {/* Deals Finalized */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Deals Finalized</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 my-1">{metrics.dealsFinalized ?? 0}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Won Revenue</span>
        </div>

        {/* Meeting Completion % */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Meeting Comp. %</span>
            <Percent className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 my-1">
            {metrics.meetingCompletionPercentage ?? 100}%
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Target &gt; 80%</span>
        </div>

        {/* Follow-up Completion % */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Follow-up Comp. %</span>
            <Percent className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 my-1">
            {metrics.followUpCompletionPercentage ?? 100}%
          </p>
          <span className="text-[10px] text-slate-500 font-medium">Target &gt; 90%</span>
        </div>
      </div>

      {/* Interactive Charts Section (Prompt Section 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Revenue Trend Graph */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Revenue Performance Graph (Last 7–14 Days)</h2>
              <p className="text-xs text-slate-500">Daily closed sales value from real verified database deals</p>
            </div>
            <button
              onClick={() => onSelectView('daily-report')}
              className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              View Daily AI Report →
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.salesTrendGraph || []}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${val.toLocaleString('en-IN')}`, 'Sales Revenue']}
                  contentStyle={{ backgroundColor: '#0B192C', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Conversion Funnel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Lead Conversion Funnel</h2>
            <p className="text-xs text-slate-500">Stages from New Lead to Deal Finalized</p>
          </div>

          <div className="space-y-2.5 my-3">
            {(analytics.conversionFunnel || []).map((stage: any, idx: number) => {
              const maxCount = analytics.conversionFunnel[0]?.count || 1;
              const widthPct = Math.max(15, Math.round((stage.count / maxCount) * 100));
              return (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{stage.stage}</span>
                    <span className="font-bold text-slate-900">{stage.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0
                          ? 'bg-blue-400'
                          : idx === 1
                          ? 'bg-indigo-500'
                          : idx === 2
                          ? 'bg-emerald-500'
                          : idx === 3
                          ? 'bg-orange-500'
                          : idx === 4
                          ? 'bg-purple-600'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Overall Conversion:</span>
            <span className="font-bold text-emerald-700">
              {metrics.totalLeads > 0
                ? `${Math.round(((metrics.dealsFinalized || 0) / metrics.totalLeads) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Employee Performance Comparison & Live Leaderboard Preview */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Sales Team Activity & Performance Matrix</h2>
            <p className="text-xs text-slate-500">
              Actual database records for meetings, closed deals, generated revenue & missed follow-up tracking
            </p>
          </div>
          <button
            onClick={() => onSelectView('leaderboard')}
            className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
          >
            Open Full Leaderboard & Podium →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Sales Executive</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Completed Meetings</th>
                <th className="py-2.5 px-3">Finalized Deals</th>
                <th className="py-2.5 px-3">Sales Value</th>
                <th className="py-2.5 px-3">Missed Follow-ups</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(analytics.employeeComparison || []).map((emp: any) => (
                <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                      {emp.name.charAt(0)}
                    </div>
                    {emp.name}
                  </td>
                  <td className="py-3 px-3 text-slate-600">{emp.department}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800">{emp.meetings}</td>
                  <td className="py-3 px-3 font-semibold text-emerald-700">{emp.deals}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">₹{emp.revenue.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3">
                    {emp.missedFollowups > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        {emp.missedFollowups} Overdue
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        Clean (0)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onSelectView('leads')}
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      View Accounts
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
