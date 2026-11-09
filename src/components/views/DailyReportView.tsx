'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Printer,
  CheckCircle2,
  ClockAlert,
  Flame,
  Award,
  Users,
  Lightbulb,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DailyReportData } from '@/lib/daily-report';

export default function DailyReportView() {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/daily?date=${reportDate}`);
      const data = await res.json();
      setReport(data.report || null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportDate]);

  // PDF Export using jsPDF and jspdf-autotable
  const handleDownloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();

    // Header branding
    doc.setFillColor(11, 25, 44); // #0B192C
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('DIGITEE WORLD — AI DAILY SALES REPORT', 14, 15);
    doc.setFontSize(10);
    doc.text(`Report Date: ${report.reportDateStr} | Generated from Live CRM Data`, 14, 23);

    // Summary Section
    doc.setTextColor(11, 25, 44);
    doc.setFontSize(12);
    doc.text('A. DAILY TEAM SUMMARY', 14, 40);

    const summaryTable = [
      ['Metric', 'Value', 'Metric', 'Value'],
      ['Meetings Scheduled', report.summary.totalMeetingsScheduled, 'Deals Finalized', report.summary.totalDealsFinalized],
      ['Meetings Completed', report.summary.totalMeetingsCompleted, 'Sales Revenue (INR)', `Rs. ${report.summary.totalSalesRevenue.toLocaleString('en-IN')}`],
      ['New Leads Generated', report.summary.totalNewLeads, 'Follow-ups Completed', report.summary.totalFollowUpsCompleted],
      ['Interested Clients', report.summary.totalInterestedClients, 'Missed Follow-ups', report.summary.totalMissedFollowUps],
    ];

    autoTable(doc, {
      startY: 45,
      head: [summaryTable[0]],
      body: summaryTable.slice(1),
      theme: 'striped',
      styles: { fontSize: 8 },
    });

    // Employee Performance Section
    const nextY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('B. EMPLOYEE-WISE SALES PERFORMANCE', 14, nextY);

    const empTableRows = report.employeePerformance.map((e) => [
      `#${e.rank}`,
      e.name,
      e.meetingsCompleted,
      e.leadsGenerated,
      e.interestedClients,
      e.followUpsCompleted,
      e.missedFollowUps,
      e.dealsFinalized,
      `Rs. ${e.salesValue.toLocaleString('en-IN')}`,
    ]);

    autoTable(doc, {
      startY: nextY + 5,
      head: [['Rank', 'Name', 'Meetings', 'Leads', 'Interested', 'Follow-ups', 'Missed', 'Deals', 'Revenue']],
      body: empTableRows,
      theme: 'grid',
      styles: { fontSize: 8 },
    });

    // Save
    doc.save(`DigiteeWorld_DailySalesReport_${report.reportDateStr}.pdf`);
  };

  const handleDownloadExcel = () => {
    window.location.href = `/api/reports/export?format=excel&date=${reportDate}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Daily Sales Intelligence Report</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              AUTOMATED ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified company-wide report generated from actual sales visits, client calls, and closed deals.
          </p>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none"
            />
          </div>

          <button
            onClick={handleDownloadPDF}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">
          Generating AI Daily Sales Report from database records...
        </div>
      ) : !report ? (
        <div className="p-12 text-center text-xs text-rose-500">
          No records found for selected date.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section A: DAILY TEAM SUMMARY */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                  A
                </span>
                DAILY TEAM SUMMARY ({report.reportDateStr})
              </h2>

              {/* Day & Week Comparison Indicators */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400">vs Yesterday:</span>
                  {report.comparison.prevDayDiff.revenueDiff >= 0 ? (
                    <span className="text-emerald-600 font-bold flex items-center">
                      <TrendingUp className="w-3 h-3" /> +₹{report.comparison.prevDayDiff.revenueDiff.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold flex items-center">
                      <TrendingDown className="w-3 h-3" /> -₹{Math.abs(report.comparison.prevDayDiff.revenueDiff).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block">Meetings Scheduled / Done</span>
                <p className="text-lg font-black text-slate-900 mt-1">
                  {report.summary.totalMeetingsCompleted} / {report.summary.totalMeetingsScheduled}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block">New Leads Generated</span>
                <p className="text-lg font-black text-blue-600 mt-1">{report.summary.totalNewLeads}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block">Hot & Interested Clients</span>
                <p className="text-lg font-black text-emerald-600 mt-1">
                  {report.summary.totalHotLeads + report.summary.totalInterestedClients}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium block">Follow-ups Done / Missed</span>
                <p className="text-lg font-black mt-1">
                  <span className="text-emerald-700">{report.summary.totalFollowUpsCompleted}</span> /{' '}
                  <span className="text-rose-600">{report.summary.totalMissedFollowUps}</span>
                </p>
              </div>

              <div className="p-3 bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white rounded-xl col-span-2 sm:col-span-1">
                <span className="text-slate-300 font-medium block">Closed Sales Revenue</span>
                <p className="text-lg font-black text-amber-400 mt-1">
                  ₹{report.summary.totalSalesRevenue.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Section B: EMPLOYEE-WISE PERFORMANCE */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                B
              </span>
              EMPLOYEE-WISE SALES PERFORMANCE
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Rank</th>
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-3 text-center">Meetings Completed</th>
                    <th className="py-2.5 px-3 text-center">Leads Generated</th>
                    <th className="py-2.5 px-3 text-center">Interested</th>
                    <th className="py-2.5 px-3 text-center">Follow-ups Done</th>
                    <th className="py-2.5 px-3 text-center">Missed</th>
                    <th className="py-2.5 px-3 text-center">Deals Finalized</th>
                    <th className="py-2.5 px-3 text-right">Sales Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.employeePerformance.map((emp) => (
                    <tr key={emp.name} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-amber-600">#{emp.rank}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{emp.name}</td>
                      <td className="py-2.5 px-3 text-center font-semibold">{emp.meetingsCompleted}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-blue-600">{emp.leadsGenerated}</td>
                      <td className="py-2.5 px-3 text-center font-semibold text-emerald-600">{emp.interestedClients}</td>
                      <td className="py-2.5 px-3 text-center font-semibold">{emp.followUpsCompleted}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-600">{emp.missedFollowUps}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-purple-700">{emp.dealsFinalized}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        ₹{emp.salesValue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section C: IMPORTANT CLIENTS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                C
              </span>
              IMPORTANT CLIENT ACCOUNTS & PRIORITY LEADS
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Highly Interested */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                <h3 className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-emerald-600" />
                  Highly Interested Clients
                </h3>
                {report.importantClients.highlyInterested.length === 0 ? (
                  <p className="text-slate-400">None today</p>
                ) : (
                  report.importantClients.highlyInterested.map((c) => (
                    <div key={c.id} className="p-2 bg-white rounded-lg border border-emerald-100">
                      <p className="font-bold text-slate-900">{c.companyName}</p>
                      <p className="text-[11px] text-slate-500">
                        Budget: ₹{c.budget.toLocaleString('en-IN')} • Rep: {c.employee}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Ready for Final Discussion */}
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2">
                <h3 className="font-bold text-purple-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-600" />
                  Ready for Final Discussion
                </h3>
                {report.importantClients.finalDiscussions.length === 0 ? (
                  <p className="text-slate-400">None today</p>
                ) : (
                  report.importantClients.finalDiscussions.map((c) => (
                    <div key={c.id} className="p-2 bg-white rounded-lg border border-purple-100">
                      <p className="font-bold text-slate-900">{c.companyName}</p>
                      <p className="text-[11px] text-slate-500">
                        Budget: ₹{c.budget.toLocaleString('en-IN')} • Rep: {c.employee}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Callback Requested */}
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                <h3 className="font-bold text-amber-900 flex items-center gap-1.5">
                  <ClockAlert className="w-4 h-4 text-amber-600" />
                  Requested Callbacks
                </h3>
                {report.importantClients.callbacksRequested.length === 0 ? (
                  <p className="text-slate-400">None today</p>
                ) : (
                  report.importantClients.callbacksRequested.map((c) => (
                    <div key={c.id} className="p-2 bg-white rounded-lg border border-amber-100">
                      <p className="font-bold text-slate-900">{c.companyName}</p>
                      <p className="text-[11px] text-slate-500">
                        Next: {c.nextTime} • Rep: {c.employee}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Section D: MANAGEMENT INSIGHTS */}
          <div className="bg-gradient-to-br from-slate-900 to-[#0B192C] text-white p-6 rounded-2xl shadow-md space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">
                D
              </span>
              AI MANAGEMENT INTELLIGENCE & RISK ADVISORY
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700">
                  <span className="text-[11px] font-bold text-amber-400 block uppercase">
                    🏆 Top Performer Today
                  </span>
                  <p className="text-sm font-bold text-white mt-1">
                    {report.managementInsights.bestPerformer}
                  </p>
                </div>

                <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700">
                  <span className="text-[11px] font-bold text-rose-400 block uppercase">
                    🚨 Pipeline Risks & Drop-off Warnings
                  </span>
                  <ul className="mt-1 space-y-1 text-slate-300 list-disc list-inside">
                    {report.managementInsights.potentialRisks.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-slate-800/70 rounded-xl border border-slate-700 space-y-2">
                <span className="text-[11px] font-bold text-blue-400 block uppercase flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  Tactical Suggestions for Tomorrow
                </span>
                <ul className="space-y-2 text-slate-200 mt-2">
                  {report.managementInsights.tomorrowSuggestions.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-600/50 text-blue-300 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Section E: TOMORROW'S ACTION PLAN */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                E
              </span>
              TOMORROW'S PREPARED ACTION PLAN
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-800">Scheduled Market Visits & Meetings</h3>
                {report.tomorrowActionPlan.meetings.length === 0 ? (
                  <p className="text-slate-400">No scheduled meetings for tomorrow yet.</p>
                ) : (
                  report.tomorrowActionPlan.meetings.map((m, i) => (
                    <div key={i} className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{m.companyName}</p>
                        <p className="text-[11px] text-slate-500">Rep: {m.executive}</p>
                      </div>
                      <span className="font-semibold text-blue-700">{m.time}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-800">Critical Priority Phone Calls</h3>
                {report.tomorrowActionPlan.calls.length === 0 ? (
                  <p className="text-slate-400">No scheduled calls for tomorrow.</p>
                ) : (
                  report.tomorrowActionPlan.calls.map((c, i) => (
                    <div key={i} className="p-2 bg-white rounded-lg border border-slate-200 flex justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{c.companyName}</p>
                        <p className="text-[11px] text-slate-500">Contact: {c.phone} • Rep: {c.executive}</p>
                      </div>
                      <span className="font-semibold text-amber-700">{c.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

