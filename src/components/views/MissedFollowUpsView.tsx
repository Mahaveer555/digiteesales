'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  ClockAlert,
  Phone,
  CheckCircle2,
  Calendar,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
  Sliders,
} from 'lucide-react';

interface MissedFollowUpsViewProps {
  onOpenClientDetail: (id: string) => void;
  onRefreshStats?: () => void;
}

export default function MissedFollowUpsView({ onOpenClientDetail, onRefreshStats }: MissedFollowUpsViewProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SALES_MANAGER';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals for actions
  const [activeItem, setActiveItem] = useState<any>(null);
  const [actionType, setActionType] = useState<'COMPLETE' | 'RESCHEDULE' | 'REMARKS' | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [newDateInput, setNewDateInput] = useState('');
  const [newTimeInput, setNewTimeInput] = useState('11:00 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchControlCenter = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/followups/control-center');
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchControlCenter();
  }, []);

  const items = data?.items || [];
  const warnings = data?.employeeWarnings || [];

  const filteredItems = items.filter(
    (item: any) =>
      item.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      item.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      item.mobileNumber?.includes(search)
  );

  const handleExecuteAction = async () => {
    if (!activeItem || !actionType) return;
    setIsSubmitting(true);
    try {
      if (actionType === 'COMPLETE') {
        await fetch(`/api/followups/${activeItem.id}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolutionNotes: notesInput || 'Follow-up marked completed via Control Center' }),
        });
      } else if (actionType === 'RESCHEDULE') {
        await fetch(`/api/followups/${activeItem.id}/reschedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newDate: newDateInput,
            newTime: newTimeInput,
            reason: notesInput || 'Client requested call at another time',
          }),
        });
      } else if (actionType === 'REMARKS') {
        await fetch(`/api/followups/${activeItem.id}/remarks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ remarks: notesInput }),
        });
      }

      setActionType(null);
      setActiveItem(null);
      setNotesInput('');
      fetchControlCenter();
      onRefreshStats?.();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-[#0B192C] to-[#1E3E62] text-white p-6 rounded-2xl border border-rose-900/50 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/30 text-rose-400 border border-rose-500/40 flex items-center justify-center font-bold">
              <ClockAlert className="w-7 h-7 animate-pulse text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">MISSED FOLLOW-UP CONTROL CENTER</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white uppercase animate-pulse">
                  CRITICAL ENGINE
                </span>
              </div>
              <p className="text-xs text-rose-200 mt-1 max-w-2xl">
                Automated continuous follow-up monitoring. Follow-ups remain visible here until completed or rescheduled with audit trail.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchControlCenter}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>

        {/* Overdue Stat Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Overdue Follow-ups</span>
            <p className="text-2xl font-black text-rose-400">{data?.totalOverdue ?? 0}</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Grace Period Configured</span>
            <p className="text-lg font-bold text-white">{data?.gracePeriodHours ?? 2} Hours</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Leaderboard Penalty</span>
            <p className="text-lg font-bold text-amber-400">-{data?.penaltyPoints ?? 5} Pts / Miss</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Historical Audit</span>
            <p className="text-lg font-bold text-emerald-400">100% Immutable</p>
          </div>
        </div>
      </div>

      {/* Repeated Missed Warning Cards for Admin (Prompt Section 4 Requirement) */}
      {isAdmin && warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>Employee Repeated Missed Follow-up Warnings (Performance Risk)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {warnings.map((w: any) => (
              <div
                key={w.userId}
                className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{w.name}</p>
                  <p className="text-[11px] text-slate-500">{w.department}</p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      w.warningLevel === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {w.totalMissed} Overdue Activities ({w.warningLevel})
                  </span>
                </div>
                <span className="text-2xl font-black text-rose-600">!</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Center Table & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client, employee or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800"
            />
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Showing <span className="font-bold text-slate-900">{filteredItems.length}</span> overdue follow-ups
          </div>
        </div>

        {/* Spreadsheet-style Control Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Client / Company</th>
                <th className="py-3 px-4">Owner / Contact</th>
                <th className="py-3 px-4">Scheduled Date & Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Overdue Delay</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Actions Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No overdue follow-ups found! All client follow-ups are compliant.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-rose-50/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{item.employeeName}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{item.department}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{item.clientName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{item.ownerName}</div>
                      <a href={`tel:${item.mobileNumber}`} className="text-[11px] text-blue-600 hover:underline">
                        {item.mobileNumber}
                      </a>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div>{item.scheduledDate}</div>
                      <span className="text-[11px] text-slate-500">{item.scheduledTime}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                        OVERDUE
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-rose-600">
                      {item.delay} Overdue
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{item.followUpType}</td>
                    <td className="py-3.5 px-4 text-right">
                      {/* Section 4 Actions: View Client, Call Client, Mark Completed, Reschedule, Add Remarks */}
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() => onOpenClientDetail(item.leadId)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                          title="View Client Timeline"
                        >
                          View
                        </button>
                        <a
                          href={`tel:${item.mobileNumber}`}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1"
                          title="Call Client"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                        <button
                          onClick={() => {
                            setActiveItem(item);
                            setActionType('COMPLETE');
                          }}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => {
                            setActiveItem(item);
                            setActionType('RESCHEDULE');
                            setNewDateInput(new Date().toISOString().split('T')[0]);
                          }}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => {
                            setActiveItem(item);
                            setActionType('REMARKS');
                          }}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] font-semibold"
                        >
                          Remarks
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modals */}
      {activeItem && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {actionType === 'COMPLETE' && `Mark Completed: ${activeItem.clientName}`}
                {actionType === 'RESCHEDULE' && `Reschedule: ${activeItem.clientName}`}
                {actionType === 'REMARKS' && `Add Remarks: ${activeItem.clientName}`}
              </h3>
              <button
                onClick={() => {
                  setActiveItem(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {actionType === 'RESCHEDULE' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Follow-up Date *</label>
                  <input
                    type="date"
                    required
                    value={newDateInput}
                    onChange={(e) => setNewDateInput(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">New Follow-up Time</label>
                  <input
                    type="text"
                    value={newTimeInput}
                    onChange={(e) => setNewTimeInput(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>
            )}

            <div className="text-xs">
              <label className="block font-semibold text-slate-700 mb-1">
                {actionType === 'COMPLETE' ? 'Resolution & Outcome Notes *' : 'Remarks / Reason *'}
              </label>
              <textarea
                rows={3}
                placeholder={
                  actionType === 'COMPLETE'
                    ? 'Enter outcome of conversation, feedback, or decision...'
                    : 'Enter client reason for rescheduling or current note...'
                }
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setActiveItem(null);
                  setActionType(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md"
              >
                {isSubmitting ? 'Saving...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

