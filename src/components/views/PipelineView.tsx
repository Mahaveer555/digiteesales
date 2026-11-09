'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  KanbanSquare,
  PlusCircle,
  Building2,
  Phone,
  Flame,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface PipelineViewProps {
  onOpenClientDetail: (id: string) => void;
  onOpenAddLeadModal: () => void;
}

export default function PipelineView({ onOpenClientDetail, onOpenAddLeadModal }: PipelineViewProps) {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const stages = [
    { id: 'NEW_LEAD', label: 'New Lead', color: 'border-t-blue-500 bg-blue-50/20' },
    { id: 'MEETING_SCHEDULED', label: 'Meeting Scheduled', color: 'border-t-indigo-500 bg-indigo-50/20' },
    { id: 'MEETING_COMPLETED', label: 'Meeting Completed', color: 'border-t-cyan-500 bg-cyan-50/20' },
    { id: 'INTERESTED', label: 'Interested', color: 'border-t-emerald-500 bg-emerald-50/20' },
    { id: 'HOT_LEAD', label: 'Hot Lead', color: 'border-t-orange-500 bg-orange-50/20' },
    { id: 'FINAL_DISCUSSION', label: 'Final Discussion', color: 'border-t-purple-600 bg-purple-50/20' },
    { id: 'DEAL_FINALIZED', label: 'Deal Finalized 🎉', color: 'border-t-emerald-600 bg-emerald-100/30' },
  ];

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leads?limit=100');
      const data = await res.json();
      setLeads(data.leads || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleMoveStage = async (leadId: string, newStage: string) => {
    try {
      await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStage }),
      });
      fetchLeads();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Visual Sales Pipeline</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              STAGE CONVERSION
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Progress deals across lifecycle stages from initial contact to finalized agreement.
          </p>
        </div>

        <button
          onClick={onOpenAddLeadModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Lead to Pipeline</span>
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.status === stage.id);
          const stageValue = stageLeads.reduce((sum, l) => sum + (l.dealValue || l.clientBudget || 0), 0);

          return (
            <div
              key={stage.id}
              className={`w-72 shrink-0 bg-slate-100/80 rounded-2xl border border-slate-200 flex flex-col max-h-[75vh] border-t-4 ${stage.color}`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between bg-white/60 rounded-t-2xl">
                <div>
                  <h3 className="font-bold text-xs text-slate-900">{stage.label}</h3>
                  <span className="text-[10px] text-slate-500 font-medium">
                    ₹{stageValue.toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="p-3 overflow-y-auto space-y-3 flex-1">
                {stageLeads.length === 0 ? (
                  <div className="p-6 text-center text-[11px] text-slate-400 border border-dashed border-slate-300 rounded-xl">
                    No leads in this stage
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-2 group"
                    >
                      <div className="flex items-start justify-between">
                        <button
                          onClick={() => onOpenClientDetail(lead.id)}
                          className="font-bold text-xs text-slate-900 hover:text-blue-600 text-left"
                        >
                          {lead.companyName}
                        </button>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            lead.interestLevel === 'HOT'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {lead.interestLevel}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <p>{lead.ownerName}</p>
                        <a href={`tel:${lead.mobileNumber}`} className="text-blue-600 hover:underline block">
                          {lead.mobileNumber}
                        </a>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="font-extrabold text-slate-800">
                          ₹{(lead.dealValue || lead.clientBudget || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400">{lead.assignedTo?.name}</span>
                      </div>

                      {/* Quick Move Dropdown */}
                      <div className="pt-1">
                        <select
                          value={lead.status}
                          onChange={(e) => handleMoveStage(lead.id, e.target.value)}
                          className="w-full text-[10px] p-1 border border-slate-200 rounded bg-slate-50 text-slate-700"
                        >
                          {stages.map((s) => (
                            <option key={s.id} value={s.id}>
                              Move to: {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

