'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  CalendarDays,
  PlusCircle,
  Building2,
  Phone,
  CheckCircle2,
  Clock,
  MapPin,
  Check,
  Search,
} from 'lucide-react';
import { formatDateDDMMYYYY } from '@/lib/date-utils';

interface MeetingsViewProps {
  onOpenClientDetail: (id: string) => void;
}

export default function MeetingsView({ onOpenClientDetail }: MeetingsViewProps) {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Update outcome modal
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [outcomeInput, setOutcomeInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const res = await fetch(`/api/meetings?${params.toString()}`);
      const data = await res.json();
      setMeetings(data.meetings || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [statusFilter]);

  const handleCompleteMeeting = async () => {
    if (!selectedMeeting) return;
    setIsUpdating(true);
    try {
      await fetch(`/api/meetings/${selectedMeeting.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          outcome: outcomeInput || 'Meeting completed with client.',
        }),
      });
      setSelectedMeeting(null);
      setOutcomeInput('');
      fetchMeetings();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredMeetings = meetings.filter(
    (m) =>
      m.lead?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      m.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Client Meetings & Market Visits</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              AUDIT LOGGED
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Log market visit notes, meeting discussion points, and verify completion outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Meetings List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search meetings by company or executive..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
          <span className="text-xs text-slate-500">{filteredMeetings.length} Meetings</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Executive</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 max-w-sm">Discussion Points / Outcome</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMeetings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No meetings found.
                  </td>
                </tr>
              ) : (
                filteredMeetings.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{formatDateDDMMYYYY(m.meetingDate)}</div>
                      <span className="text-[10px] text-slate-500">{m.meetingTime}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <button
                        onClick={() => onOpenClientDetail(m.leadId)}
                        className="text-blue-700 hover:underline text-left font-bold"
                      >
                        {m.lead?.companyName}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{m.meetingType?.replace('_', ' ')}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{m.user?.name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate" title={m.outcome || m.discussionPoints}>
                      {m.outcome || m.discussionPoints || 'Pending meeting outcome submission.'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {m.status !== 'COMPLETED' && (
                          <button
                            onClick={() => {
                              setSelectedMeeting(m);
                              setOutcomeInput(m.discussionPoints || '');
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => onOpenClientDetail(m.leadId)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                        >
                          View
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

      {/* Complete Meeting Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
              Submit Meeting Outcome: {selectedMeeting.lead?.companyName}
            </h3>

            <div className="text-xs">
              <label className="block font-semibold text-slate-700 mb-1">
                Meeting Discussion Points & Client Feedback *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Enter client response, services requested, quotation terms..."
                value={outcomeInput}
                onChange={(e) => setOutcomeInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedMeeting(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteMeeting}
                disabled={isUpdating || !outcomeInput.trim()}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
              >
                {isUpdating ? 'Saving...' : 'Mark Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

