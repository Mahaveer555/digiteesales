'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Filter,
  Download,
  PlusCircle,
  Building2,
  Calendar,
  Phone,
  Eye,
  Edit2,
  Check,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatDateDDMMYYYY } from '@/lib/date-utils';

interface LeadsTableViewProps {
  onOpenClientDetail: (id: string) => void;
  onOpenAddLeadModal: () => void;
}

export default function LeadsTableView({ onOpenClientDetail, onOpenAddLeadModal }: LeadsTableViewProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SALES_MANAGER';

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [interestFilter, setInterestFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (interestFilter) params.append('interest', interestFilter);

      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page, statusFilter, interestFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleSaveInlineStatus = async (id: string) => {
    if (!editingStatus) return;
    try {
      await fetch(`/api/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editingStatus }),
      });
      setEditingId(null);
      fetchLeads();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportExcel = () => {
    const rows = leads.map((l) => ({
      'First Contact Date': formatDateDDMMYYYY(l.firstMeetingDate),
      'Company Name': l.companyName,
      'Owner Name': l.ownerName,
      Mobile: l.mobileNumber,
      Industry: l.industryCategory,
      Address: l.address,
      'Meeting Time': l.meetingTime,
      Status: l.status,
      'Interest Level': l.interestLevel,
      'Budget (INR)': l.clientBudget,
      'Next Follow-up Date': formatDateDDMMYYYY(l.nextFollowUpDate),
      'Next Follow-up Time': l.nextFollowUpTime,
      'Assigned Employee': l.assignedTo?.name,
      Remarks: l.remarks,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Digitee CRM Leads');
    XLSX.writeFile(wb, `DigiteeWorld_Leads_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Smart Spreadsheet Data Table</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              EXCEL-LIKE CRM
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete database of client accounts with inline status update, search, and instant Excel export.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={onOpenAddLeadModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, owner, phone, city or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="NEW_LEAD">New Lead</option>
            <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
            <option value="MEETING_COMPLETED">Meeting Completed</option>
            <option value="INTERESTED">Interested</option>
            <option value="HOT_LEAD">Hot Lead</option>
            <option value="FINAL_DISCUSSION">Final Discussion</option>
            <option value="DEAL_FINALIZED">Deal Finalized</option>
            <option value="CALLBACK_REQUESTED">Callback Requested</option>
          </select>

          <select
            value={interestFilter}
            onChange={(e) => {
              setInterestFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
          >
            <option value="">All Interest Levels</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="HOT">HOT</option>
          </select>
        </div>
      </div>

      {/* Section 15 Required 14-Column Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="bg-[#0B192C] text-white uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Company Name</th>
                <th className="py-3 px-3">Owner Name</th>
                <th className="py-3 px-3">Mobile</th>
                <th className="py-3 px-3">Industry</th>
                <th className="py-3 px-3">Address</th>
                <th className="py-3 px-3">Meeting Time</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Interest</th>
                <th className="py-3 px-3">Next Follow-up</th>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3 max-w-xs truncate">Remarks</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    Loading accounts...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    No matching leads found.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* 1. Date */}
                    <td className="py-2.5 px-3 font-medium text-slate-600">
                      {formatDateDDMMYYYY(lead.firstMeetingDate)}
                    </td>

                    {/* 2. Company Name */}
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      <button
                        onClick={() => onOpenClientDetail(lead.id)}
                        className="text-blue-700 hover:underline text-left font-bold"
                      >
                        {lead.companyName}
                      </button>
                    </td>

                    {/* 3. Owner Name */}
                    <td className="py-2.5 px-3 text-slate-700">{lead.ownerName}</td>

                    {/* 4. Mobile */}
                    <td className="py-2.5 px-3">
                      <a href={`tel:${lead.mobileNumber}`} className="text-blue-600 hover:underline">
                        {lead.mobileNumber}
                      </a>
                    </td>

                    {/* 5. Industry */}
                    <td className="py-2.5 px-3 text-slate-600">{lead.industryCategory}</td>

                    {/* 6. Address */}
                    <td className="py-2.5 px-3 text-slate-600 truncate max-w-[150px]" title={lead.address}>
                      {lead.address}, {lead.city}
                    </td>

                    {/* 7. Meeting Time */}
                    <td className="py-2.5 px-3 text-slate-600">{lead.meetingTime}</td>

                    {/* 8. Status (with Inline Editing) */}
                    <td className="py-2.5 px-3">
                      {editingId === lead.id ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={editingStatus}
                            onChange={(e) => setEditingStatus(e.target.value)}
                            className="text-[11px] p-1 border rounded bg-white text-slate-900"
                          >
                            <option value="NEW_LEAD">NEW_LEAD</option>
                            <option value="MEETING_SCHEDULED">MEETING_SCHEDULED</option>
                            <option value="MEETING_COMPLETED">MEETING_COMPLETED</option>
                            <option value="INTERESTED">INTERESTED</option>
                            <option value="HOT_LEAD">HOT_LEAD</option>
                            <option value="FINAL_DISCUSSION">FINAL_DISCUSSION</option>
                            <option value="DEAL_FINALIZED">DEAL_FINALIZED</option>
                            <option value="CALLBACK_REQUESTED">CALLBACK_REQUESTED</option>
                          </select>
                          <button
                            onClick={() => handleSaveInlineStatus(lead.id)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingId(lead.id);
                            setEditingStatus(lead.status);
                          }}
                          className="cursor-pointer group flex items-center gap-1"
                        >
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              lead.status === 'DEAL_FINALIZED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : lead.status === 'HOT_LEAD' || lead.status === 'FINAL_DISCUSSION'
                                ? 'bg-orange-100 text-orange-800'
                                : lead.status === 'INTERESTED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {lead.status.replace('_', ' ')}
                          </span>
                          <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                        </div>
                      )}
                    </td>

                    {/* 9. Interest */}
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{lead.interestLevel}</td>

                    {/* 10. Next Follow-up */}
                    <td className="py-2.5 px-3 font-medium text-amber-700">
                      {lead.nextFollowUpDate ? `${formatDateDDMMYYYY(lead.nextFollowUpDate)} ${lead.nextFollowUpTime || ''}` : '-'}
                    </td>

                    {/* 11. Assigned Employee */}
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{lead.assignedTo?.name}</td>

                    {/* 12. Remarks */}
                    <td className="py-2.5 px-3 text-slate-500 max-w-[150px] truncate" title={lead.remarks}>
                      {lead.remarks || '-'}
                    </td>

                    {/* 13. Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onOpenClientDetail(lead.id)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-bold transition-colors"
                      >
                        View Timeline
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Page <span className="font-bold text-slate-900">{page}</span> of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

