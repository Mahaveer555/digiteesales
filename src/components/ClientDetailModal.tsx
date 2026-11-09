'use client';

import React, { useState, useEffect } from 'react';
import { X, Building2, Phone, Calendar, Clock, IndianRupee, MessageSquare, History, CheckCircle2, AlertTriangle, ArrowRight, User } from 'lucide-react';
import { formatDateDDMMYYYY } from '@/lib/date-utils';

interface ClientDetailModalProps {
  leadId: string | null;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function ClientDetailModal({ leadId, onClose, onRefresh }: ClientDetailModalProps) {
  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newRemark, setNewRemark] = useState('');
  const [isAddingRemark, setIsAddingRemark] = useState(false);

  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    fetch(`/api/leads/${leadId}`)
      .then((r) => r.json())
      .then((data) => {
        setLead(data.lead);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [leadId]);

  if (!leadId) return null;

  const handleAddRemark = async () => {
    if (!newRemark.trim() || !lead) return;
    setIsAddingRemark(true);
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remarks: `${lead.remarks ? lead.remarks + '\n' : ''}[Note]: ${newRemark.trim()}`,
        }),
      });
      setNewRemark('');
      // Reload
      const r = await fetch(`/api/leads/${lead.id}`);
      const data = await r.json();
      setLead(data.lead);
      onRefresh?.();
    } finally {
      setIsAddingRemark(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="bg-[#0B192C] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {loading ? 'Loading Client...' : lead?.companyName}
                {lead && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    {lead.status.replace('_', ' ')}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-300">
                Owner: {lead?.ownerName} • Contact: {lead?.mobileNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading complete client timeline...</div>
        ) : !lead ? (
          <div className="p-8 text-center text-xs text-rose-500">Client details not found.</div>
        ) : (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Budget</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">₹{lead.clientBudget?.toLocaleString('en-IN')}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Interest Level</span>
                <p className="text-sm font-bold text-blue-700 mt-0.5">{lead.interestLevel}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Assigned Executive</span>
                <p className="text-xs font-bold text-slate-800 mt-1 truncate">{lead.assignedTo?.name}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Next Follow-up</span>
                <p className="text-xs font-bold text-amber-700 mt-1">
                  {lead.nextFollowUpDate ? formatDateDDMMYYYY(lead.nextFollowUpDate) : 'Not scheduled'}
                </p>
              </div>
            </div>

            {/* Client Details Row */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 font-medium">Industry Category: </span>
                  <span className="font-semibold text-slate-800">{lead.industryCategory}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Address: </span>
                  <span className="font-semibold text-slate-800">{lead.address}, {lead.city}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Services Required: </span>
                  <span className="font-semibold text-slate-800">{lead.servicesRequired}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Lead Source: </span>
                  <span className="font-semibold text-slate-800">{lead.leadSource}</span>
                </div>
              </div>
              {lead.remarks && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 font-medium">Remarks History: </span>
                  <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">{lead.remarks}</p>
                </div>
              )}
            </div>

            {/* Quick Add Note / Remark */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add quick follow-up remark or client update..."
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              />
              <button
                onClick={handleAddRemark}
                disabled={isAddingRemark || !newRemark.trim()}
                className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shrink-0 disabled:opacity-50"
              >
                Add Note
              </button>
            </div>

            {/* Section 11: Complete Chronological Activity Timeline */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <History className="w-4 h-4 text-blue-600" />
                Complete Client Activity Timeline (Historical Records Preserved)
              </h3>

              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {lead.timeline?.map((item: any) => (
                  <div key={item.id} className="relative group">
                    {/* Circle Dot */}
                    <div
                      className={`absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                        item.activityType === 'OVERDUE_ALERT'
                          ? 'bg-rose-500'
                          : item.activityType === 'DEAL_WON'
                          ? 'bg-emerald-500'
                          : item.activityType === 'FOLLOWUP_SCHEDULED'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{item.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        </span>
                      </div>
                      <p className="text-slate-600">{item.description}</p>
                      {item.user && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Recorded by {item.user.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
