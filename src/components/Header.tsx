'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Mic,
  Bell,
  Search,
  UserCheck,
  ChevronDown,
  LogOut,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface HeaderProps {
  onOpenVoiceModal: () => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
  onSearch?: (query: string) => void;
}

export default function Header({
  onOpenVoiceModal,
  onOpenNotifications,
  unreadCount = 0,
  onSearch,
}: HeaderProps) {
  const { user, switchDemoUser, logout } = useAuth();
  const [showSwitchDropdown, setShowSwitchDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const demoAccounts = [
    { name: 'Vikramaditya Rathore', email: 'admin@digiteeworld.com', role: 'SUPER ADMIN' },
    { name: 'Amit Saxena', email: 'manager@digiteeworld.com', role: 'SALES MANAGER' },
    { name: 'Rahul Sharma', email: 'rahul@digiteeworld.com', role: 'SALES EXECUTIVE (Field)' },
    { name: 'Priya Patel', email: 'priya@digiteeworld.com', role: 'SALES EXECUTIVE (Digital)' },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-72 md:w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads, companies, phones..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch?.(e.target.value);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {/* Voice-to-CRM Microphone Button */}
        <button
          onClick={onOpenVoiceModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-sm hover:from-red-600 hover:to-rose-700 transition-all transform active:scale-95 group"
          title="Voice-to-CRM: Speak in Hindi or English to record meeting"
        >
          <Mic className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">Voice-to-CRM</span>
          <span className="px-1.5 py-0.2 text-[9px] bg-white/20 rounded font-mono uppercase">AI</span>
        </button>

        {/* Demo Account Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSwitchDropdown(!showSwitchDropdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline font-semibold">Test Role:</span>
            <span className="text-blue-700 font-bold">{user?.role?.replace('_', ' ')}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showSwitchDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Switch Demo Account (Role Test)
              </div>
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={async () => {
                    await switchDemoUser(acc.email);
                    setShowSwitchDropdown(false);
                    window.location.reload();
                  }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 transition-colors flex flex-col ${
                    user?.email === acc.email ? 'bg-blue-50/70 border-l-2 border-blue-600' : ''
                  }`}
                >
                  <span className="font-semibold text-slate-800">{acc.name}</span>
                  <span className="text-[10px] text-blue-600 font-medium">{acc.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          title="Notification Center"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-2 border-l border-slate-200"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-500">{user?.department}</p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50">
              <div className="px-3 py-2 border-b border-slate-100 text-xs">
                <p className="font-semibold text-slate-800">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
