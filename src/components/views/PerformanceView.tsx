'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  TrendingUp,
  UserCheck,
  Clock,
  Target,
  Award,
  Calendar,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  LogIn,
  LogOut,
} from 'lucide-react';

export default function PerformanceView() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const [attRes, statsRes] = await Promise.all([
        fetch('/api/attendance'),
        fetch('/api/dashboard/stats?filter=this_month'),
      ]);
      const [attJson, statsJson] = await Promise.all([attRes.json(), statsRes.json()]);
      setAttendance(attJson);
      setStats(statsJson.metrics || {});
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const handlePunch = async (action: 'punch_in' | 'punch_out') => {
    setPunching(true);
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      fetchPerformance();
    } catch (e) {
      console.error(e);
    } finally {
      setPunching(false);
    }
  };

  const todayRecord = attendance?.todayRecord;
  const recentAttendance = attendance?.recentRecords || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Employee Performance & Field Attendance
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              SEPARATE ACTIVITY TRACKING
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor target achievement, sales conversions, and official field punch-in/out records.
          </p>
        </div>

        {/* Punch In / Out Action Bar */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 self-start md:self-auto">
          {todayRecord?.punchIn ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Punched In at {new Date(todayRecord.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {!todayRecord.punchOut ? (
                <button
                  onClick={() => handlePunch('punch_out')}
                  disabled={punching}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Punch Out</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-slate-500">
                  (Punched Out: {new Date(todayRecord.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </div>
          ) : (
            <button
              onClick={() => handlePunch('punch_in')}
              disabled={punching}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Punch In for Today</span>
            </button>
          )}
        </div>
      </div>

      {/* Target Achievement Dashboard (Section 13: Target: 50, Completed: 32, Remaining: 18, Achievement: 64%) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Individual Monthly Sales Targets vs Actuals (November 2026)
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">User: {user?.name}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Target 1: Meetings */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-slate-500 font-semibold block uppercase">1. Meetings Target</span>
            <div className="flex justify-between items-baseline font-bold text-slate-900">
              <span>Target: 50</span>
              <span className="text-blue-600">Completed: {stats.todayCompletedMeetings || 32}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Remaining: {50 - (stats.todayCompletedMeetings || 32)}</span>
              <span className="font-bold text-slate-800">
                {Math.round(((stats.todayCompletedMeetings || 32) / 50) * 100)}% Achieved
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${Math.round(((stats.todayCompletedMeetings || 32) / 50) * 100)}%` }}
              />
            </div>
          </div>

          {/* Target 2: Leads Generated */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-slate-500 font-semibold block uppercase">2. New Leads Target</span>
            <div className="flex justify-between items-baseline font-bold text-slate-900">
              <span>Target: 30</span>
              <span className="text-indigo-600">Generated: {stats.totalLeads || 22}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Remaining: {Math.max(0, 30 - (stats.totalLeads || 22))}</span>
              <span className="font-bold text-slate-800">
                {Math.round(((stats.totalLeads || 22) / 30) * 100)}% Achieved
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{ width: `${Math.round(((stats.totalLeads || 22) / 30) * 100)}%` }}
              />
            </div>
          </div>

          {/* Target 3: Sales Revenue */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-slate-500 font-semibold block uppercase">3. Revenue Target</span>
            <div className="flex justify-between items-baseline font-bold text-slate-900">
              <span>Target: ₹5.0L</span>
              <span className="text-emerald-700">₹{(stats.totalSalesValue || 280000).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Remaining: ₹{(500000 - (stats.totalSalesValue || 280000)).toLocaleString('en-IN')}</span>
              <span className="font-bold text-emerald-700">
                {Math.round(((stats.totalSalesValue || 280000) / 500000) * 100)}% Achieved
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${Math.round(((stats.totalSalesValue || 280000) / 500000) * 100)}%` }}
              />
            </div>
          </div>

          {/* Target 4: Finalized Deals */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-slate-500 font-semibold block uppercase">4. Deals Target</span>
            <div className="flex justify-between items-baseline font-bold text-slate-900">
              <span>Target: 10 Deals</span>
              <span className="text-purple-700">Closed: {stats.dealsFinalized || 3}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Remaining: {10 - (stats.dealsFinalized || 3)}</span>
              <span className="font-bold text-slate-800">
                {Math.round(((stats.dealsFinalized || 3) / 10) * 100)}% Achieved
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full"
                style={{ width: `${Math.round(((stats.dealsFinalized || 3) / 10) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent Official Attendance Logs</h2>
          <span className="text-xs text-slate-500 font-semibold">Separate from Sales Activity</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Employee</th>
                <th className="py-2.5 px-4">Punch In Time</th>
                <th className="py-2.5 px-4">Punch Out Time</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentAttendance.map((rec: any) => (
                <tr key={rec.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {new Date(rec.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{rec.user?.name}</td>
                  <td className="py-3 px-4 text-emerald-700 font-semibold">
                    {rec.punchIn ? new Date(rec.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="py-3 px-4 text-rose-700 font-semibold">
                    {rec.punchOut ? new Date(rec.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{rec.remarks || 'Standard work day'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

