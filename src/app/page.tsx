'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import VoiceModal from '@/components/VoiceModal';
import AddLeadModal from '@/components/AddLeadModal';
import ClientDetailModal from '@/components/ClientDetailModal';
import NotificationDrawer from '@/components/NotificationDrawer';

// Views
import AdminDashboardView from '@/components/views/AdminDashboardView';
import EmployeeDashboardView from '@/components/views/EmployeeDashboardView';
import MissedFollowUpsView from '@/components/views/MissedFollowUpsView';
import LeaderboardView from '@/components/views/LeaderboardView';
import DailyReportView from '@/components/views/DailyReportView';
import AiAssistantView from '@/components/views/AiAssistantView';
import LeadsTableView from '@/components/views/LeadsTableView';
import PipelineView from '@/components/views/PipelineView';
import CalendarView from '@/components/views/CalendarView';
import MeetingsView from '@/components/views/MeetingsView';
import PerformanceView from '@/components/views/PerformanceView';
import SettingsView from '@/components/views/SettingsView';
import EmployeesAdminView from '@/components/views/EmployeesAdminView';

import { LogIn, Building2, Sparkles, AlertCircle } from 'lucide-react';

export default function HomePage() {
  const { user, loading, login, switchDemoUser } = useAuth();

  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  // Stats badge counts
  const [missedCount, setMissedCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Login form state (if logged out)
  const [loginEmail, setLoginEmail] = useState('admin@digiteeworld.com');
  const [loginPassword, setLoginPassword] = useState('Password@123');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const fetchBadgeCounts = async () => {
    try {
      const [missedRes, notifRes] = await Promise.all([
        fetch('/api/followups/control-center'),
        fetch('/api/notifications'),
      ]);
      const [missedData, notifData] = await Promise.all([missedRes.json(), notifRes.json()]);
      setMissedCount(missedData.totalOverdue || 0);
      setUnreadCount(notifData.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      fetchBadgeCounts();
    }
  }, [user]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    const res = await login(loginEmail, loginPassword);
    if (!res.success) {
      setLoginError(res.error || 'Invalid credentials');
    }
    setIsLoggingIn(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B192C] text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center animate-bounce shadow-xl shadow-amber-500/20">
          D
        </div>
        <p className="mt-4 font-bold tracking-wide text-sm">DIGITEE WORLD AI SALES CRM</p>
        <p className="text-xs text-slate-400 mt-1">Initializing Secure Enterprise Environment...</p>
      </div>
    );
  }

  // Login View if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B192C] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
              D
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">DIGITEE WORLD</h1>
            <p className="text-xs text-blue-700 font-bold uppercase tracking-wider">AI Powered Sales Intelligence CRM</p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#0B192C] hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-slate-900/30 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoggingIn ? 'Authenticating...' : 'Sign In to CRM'}</span>
            </button>
          </form>

          {/* Quick Demo Switcher on Login */}
          <div className="pt-4 border-t border-slate-100 text-center space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick 1-Click Role Login:
            </p>
            <div className="flex flex-col gap-1.5 text-xs">
              <button
                onClick={() => switchDemoUser('admin@digiteeworld.com')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-left flex justify-between"
              >
                <span>👑 Super Admin (Vikramaditya Rathore)</span>
                <span className="text-[10px] text-purple-700 font-bold uppercase">All Access</span>
              </button>
              <button
                onClick={() => switchDemoUser('manager@digiteeworld.com')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-left flex justify-between"
              >
                <span>👔 Sales Manager (Amit Saxena)</span>
                <span className="text-[10px] text-blue-700 font-bold uppercase">Team Access</span>
              </button>
              <button
                onClick={() => switchDemoUser('rahul@digiteeworld.com')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-left flex justify-between"
              >
                <span>💼 Sales Executive (Rahul Sharma)</span>
                <span className="text-[10px] text-emerald-700 font-bold uppercase">Field Rep</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'SALES_MANAGER';

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => {
          if (view === 'add-lead') {
            setIsAddLeadModalOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
        missedCount={missedCount}
        unreadNotifications={unreadCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
          onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
          unreadCount={unreadCount}
          onSearch={(query) => {
            if (query && currentView !== 'leads') {
              setCurrentView('leads');
            }
          }}
        />

        {/* View Router */}
        <main className="flex-1 p-6 overflow-y-auto">
          {currentView === 'dashboard' &&
            (isAdmin ? (
              <AdminDashboardView
                onSelectView={setCurrentView}
                onOpenClientDetail={setSelectedLeadId}
              />
            ) : (
              <EmployeeDashboardView
                onSelectView={setCurrentView}
                onOpenClientDetail={setSelectedLeadId}
                onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              />
            ))}

          {currentView === 'leads' && (
            <LeadsTableView
              onOpenClientDetail={setSelectedLeadId}
              onOpenAddLeadModal={() => setIsAddLeadModalOpen(true)}
            />
          )}

          {currentView === 'missed-followups' && (
            <MissedFollowUpsView
              onOpenClientDetail={setSelectedLeadId}
              onRefreshStats={fetchBadgeCounts}
            />
          )}

          {currentView === 'leaderboard' && <LeaderboardView />}

          {currentView === 'daily-report' && <DailyReportView />}

          {currentView === 'ai-assistant' && (
            <AiAssistantView
              onSelectView={setCurrentView}
              onOpenClientDetail={setSelectedLeadId}
            />
          )}

          {currentView === 'pipeline' && (
            <PipelineView
              onOpenClientDetail={setSelectedLeadId}
              onOpenAddLeadModal={() => setIsAddLeadModalOpen(true)}
            />
          )}

          {currentView === 'calendar' && (
            <CalendarView onOpenClientDetail={setSelectedLeadId} />
          )}

          {currentView === 'meetings' && (
            <MeetingsView onOpenClientDetail={setSelectedLeadId} />
          )}

          {(currentView === 'team-performance' || currentView === 'my-performance') && (
            <PerformanceView />
          )}

          {currentView === 'todays-followups' && (
            <MissedFollowUpsView
              onOpenClientDetail={setSelectedLeadId}
              onRefreshStats={fetchBadgeCounts}
            />
          )}

          {currentView === 'employees' && <EmployeesAdminView />}

          {(currentView === 'settings' || currentView === 'targets') && <SettingsView />}
        </main>
      </div>

      {/* Global Modals */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSuccessSave={() => {
          fetchBadgeCounts();
          setCurrentView('leads');
        }}
      />

      <AddLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        onSuccess={() => {
          fetchBadgeCounts();
          setCurrentView('leads');
        }}
      />

      <ClientDetailModal
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onRefresh={fetchBadgeCounts}
      />

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        onRefresh={fetchBadgeCounts}
      />
    </div>
  );
}

