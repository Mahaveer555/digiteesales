'use client';

import React, { useState, useEffect } from 'react';
import { X, Bell, Check, ClockAlert, CheckCircle2, Trophy, Sparkles } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function NotificationDrawer({ isOpen, onClose, onRefresh }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      fetchNotifications();
      onRefresh?.();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      onRefresh?.();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 bg-[#0B192C] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Notification Center</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-semibold text-blue-300 hover:text-white transition-colors"
            >
              Mark all read
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">No notifications at this time.</div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => !item.isRead && handleMarkSingleRead(item.id)}
                className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                  item.isRead
                    ? 'bg-slate-50 border-slate-200 opacity-70'
                    : 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-500/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    {item.type === 'MISSED_FOLLOWUP' && <ClockAlert className="w-4 h-4 text-rose-500 shrink-0" />}
                    {item.type === 'DEAL_CLOSED' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {item.type === 'TARGET_ACHIEVED' && <Trophy className="w-4 h-4 text-amber-500 shrink-0" />}
                    <span>{item.title}</span>
                  </div>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>
                  )}
                </div>
                <p className="text-slate-600 mt-1">{item.message}</p>
                <div className="text-[10px] text-slate-400 mt-2">
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
