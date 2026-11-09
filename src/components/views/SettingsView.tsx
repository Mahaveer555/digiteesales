'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Settings,
  Shield,
  Sliders,
  ClockAlert,
  Trophy,
  Save,
  Check,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function SettingsView() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>({
    companyName: 'DIGITEE WORLD',
    productName: 'Digitee World AI Sales CRM',
    timezone: 'Asia/Kolkata',
    gracePeriodHours: 2,
    pointsMeetingCompleted: 10,
    pointsInterestedClient: 15,
    pointsFinalDiscussion: 20,
    pointsDealFinalized: 50,
    penaltyOverdueFollowup: 5,
  });
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">CRM System Settings & Rules</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated follow-up monitoring grace periods, leaderboard points, and enterprise branding.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
          Super Admin Access
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Settings successfully saved and active across the CRM system!</span>
          </div>
        )}

        {/* 1. Missed Follow-up Engine Rules (Prompt Section 4 Requirement) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <ClockAlert className="w-5 h-5 text-rose-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Missed Follow-up Automation & Grace Period</h2>
              <p className="text-[11px] text-slate-500">
                Rule engine automatically marks follow-up as OVERDUE after scheduled time + grace period
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Grace Period Before Overdue Alert (Hours)
              </label>
              <input
                type="number"
                min={0}
                max={48}
                value={settings.gracePeriodHours}
                onChange={(e) => setSettings({ ...settings, gracePeriodHours: parseInt(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Current: 2 hours after scheduled time triggers red overdue alert.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Leaderboard Score Penalty Per Overdue Follow-up (Negative Points)
              </label>
              <input
                type="number"
                min={0}
                value={settings.penaltyOverdueFollowup}
                onChange={(e) => setSettings({ ...settings, penaltyOverdueFollowup: parseInt(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-rose-700 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Deducted from sales executive's score on live leaderboard.
              </span>
            </div>
          </div>
        </div>

        {/* 2. Leaderboard Performance Scoring Weights (Prompt Section 5 Requirement) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Trophy className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Leaderboard Scoring Weights Configuration</h2>
              <p className="text-[11px] text-slate-500">
                Custom points awarded for verified activities to compute daily, weekly & monthly rankings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Completed Meeting</label>
              <input
                type="number"
                value={settings.pointsMeetingCompleted}
                onChange={(e) => setSettings({ ...settings, pointsMeetingCompleted: parseInt(e.target.value) || 0 })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-blue-700"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">+10 pts default</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Interested Client</label>
              <input
                type="number"
                value={settings.pointsInterestedClient}
                onChange={(e) => setSettings({ ...settings, pointsInterestedClient: parseInt(e.target.value) || 0 })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-700"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">+15 pts default</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Final Discussion</label>
              <input
                type="number"
                value={settings.pointsFinalDiscussion}
                onChange={(e) => setSettings({ ...settings, pointsFinalDiscussion: parseInt(e.target.value) || 0 })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-purple-700"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">+20 pts default</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Finalized Deal</label>
              <input
                type="number"
                value={settings.pointsDealFinalized}
                onChange={(e) => setSettings({ ...settings, pointsDealFinalized: parseInt(e.target.value) || 0 })}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-amber-600"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">+50 pts default</span>
            </div>
          </div>
        </div>

        {/* 3. Branding & System Identity (Prompt Section 1 Requirement) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Company & Product Identity</h2>
              <p className="text-[11px] text-slate-500">Corporate branding applied across all reports, PDF exports and tables</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Name</label>
              <input
                type="text"
                value={settings.productName}
                onChange={(e) => setSettings({ ...settings, productName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save & Apply Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

