'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  ClockAlert,
  Trophy,
  FileSpreadsheet,
  BrainCircuit,
  KanbanSquare,
  Target,
  Bell,
  Settings,
  Sparkles,
  PhoneCall,
  UserCheck,
  PlusCircle,
  Briefcase,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  missedCount?: number;
  unreadNotifications?: number;
}

export default function Sidebar({
  currentView,
  onSelectView,
  missedCount = 0,
  unreadNotifications = 0,
}: SidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SALES_MANAGER';

  // Section 18 Sidebar specifications
  const adminMenuItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'All Employees', icon: Users },
    { id: 'leads', label: 'All Leads & Clients', icon: Building2 },
    { id: 'meetings', label: 'All Meetings', icon: CalendarDays },
    {
      id: 'missed-followups',
      label: 'Missed Follow-up Center',
      icon: ClockAlert,
      badge: missedCount > 0 ? missedCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'leaderboard', label: 'Sales Leaderboard', icon: Trophy, badgeColor: 'bg-amber-500' },
    { id: 'daily-report', label: 'Daily AI Sales Reports', icon: FileSpreadsheet },
    { id: 'team-performance', label: 'Team Performance & Attendance', icon: UserCheck },
    { id: 'pipeline', label: 'Sales Pipeline', icon: KanbanSquare },
    { id: 'calendar', label: '2026-2027 Calendar', icon: CalendarDays },
    { id: 'targets', label: 'Sales Targets', icon: Target },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    { id: 'ai-assistant', label: 'Smart AI Assistant', icon: BrainCircuit, highlight: true },
    { id: 'settings', label: 'CRM Settings', icon: Settings },
  ];

  const employeeMenuItems = [
    { id: 'dashboard', label: 'Personal Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'My Leads', icon: Building2 },
    { id: 'add-lead', label: 'Add New Lead', icon: PlusCircle, isAction: true },
    { id: 'meetings', label: 'My Meetings', icon: CalendarDays },
    { id: 'todays-followups', label: "Today's Follow-ups", icon: PhoneCall },
    {
      id: 'missed-followups',
      label: 'Missed Follow-ups',
      icon: ClockAlert,
      badge: missedCount > 0 ? missedCount : undefined,
      badgeColor: 'bg-rose-500 text-white alert-pulse',
    },
    { id: 'calendar', label: 'My Calendar', icon: CalendarDays },
    { id: 'pipeline', label: 'Sales Pipeline', icon: KanbanSquare },
    { id: 'finalized-deals', label: 'Finalized Deals', icon: CheckCircle2 },
    { id: 'my-performance', label: 'My Performance & Attendance', icon: TrendingUp },
    { id: 'leaderboard', label: 'Sales Leaderboard', icon: Trophy },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    { id: 'ai-assistant', label: 'AI Assistant', icon: BrainCircuit, highlight: true },
  ];

  const menu = isAdmin ? adminMenuItems : employeeMenuItems;

  return (
    <aside className="w-64 bg-[#0B192C] text-slate-200 flex flex-col h-screen border-r border-slate-800 shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold text-xl">
            D
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-wide leading-tight">DIGITEE WORLD</h1>
            <p className="text-[11px] text-amber-400 font-semibold tracking-wider uppercase">AI Sales CRM</p>
          </div>
        </div>
      </div>

      {/* Role Pill */}
      <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium truncate max-w-[130px]">{user?.role?.replace('_', ' ')}</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-700/50">
          {user?.department}
        </span>
      </div>

      {/* Menu List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              } ${item.highlight && !isActive ? 'border border-amber-500/30 text-amber-300 bg-amber-500/5' : ''}`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : item.highlight ? 'text-amber-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    item.badgeColor || 'bg-blue-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Asia/Kolkata (IST)</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">v2.5.0</span>
      </div>
    </aside>
  );
}
