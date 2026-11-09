'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  Phone,
  User,
  CheckCircle2,
  ClockAlert,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
} from 'date-fns';

interface CalendarViewProps {
  onOpenClientDetail: (id: string) => void;
}

export default function CalendarView({ onOpenClientDetail }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 7)); // November 2026 as in metadata
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 10, 7));
  const [viewMode, setViewMode] = useState<'month' | 'day' | 'week'>('month');
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/calendar/events');
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Generate calendar days grid
  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const selectedDateEvents = events.filter((e) => e.date === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Interactive Sales Calendar (2026–2027)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              COLOR-CODED ACTIVITIES
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized schedule of market visits, overdue alerts, phone calls and client discussions.
          </p>
        </div>

        {/* Month Navigation & View Modes */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-200/80"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-900 px-3 min-w-[120px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-1.5 rounded-lg hover:bg-slate-200/80"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {['month', 'week', 'day'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`px-3 py-1 rounded-lg font-bold capitalize transition-all ${
                  viewMode === mode ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 uppercase py-1 border-b border-slate-100">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d, idx) => {
              const dateStr = format(d, 'yyyy-MM-dd');
              const dayEvents = events.filter((e) => e.date === dateStr);
              const isSelected = isSameDay(d, selectedDate);
              const isCurrentMonth = isSameMonth(d, currentDate);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(d)}
                  className={`min-h-[90px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                      : isCurrentMonth
                      ? 'border-slate-200 bg-white hover:bg-slate-50'
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className={isSelected ? 'text-blue-700 font-black' : 'text-slate-800'}>
                      {format(d, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 text-[9px] flex items-center justify-center font-bold">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Tiny Event Pills */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="text-[9px] px-1.5 py-0.5 rounded truncate font-semibold text-white"
                        style={{ backgroundColor: ev.color }}
                        title={ev.title}
                      >
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-slate-400 font-bold block pl-1">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Meeting
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Follow-up
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Final Discussion
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Overdue Alert
            </span>
          </div>
        </div>

        {/* Selected Date Detail Drawer (1 col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Activities for {format(selectedDate, 'EEEE, dd MMMM yyyy')}
            </h2>
            <p className="text-xs text-slate-500">{selectedDateEvents.length} scheduled events</p>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[500px]">
            {selectedDateEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No meetings or follow-ups scheduled for this date.
              </div>
            ) : (
              selectedDateEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl border border-slate-200 text-xs space-y-2 bg-slate-50/60"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
                      style={{ backgroundColor: ev.color }}
                    >
                      {ev.category}
                    </span>
                    <span className="text-[11px] font-bold text-slate-700">{ev.time}</span>
                  </div>

                  <p className="font-bold text-slate-900 text-sm">{ev.clientName}</p>
                  <p className="text-[11px] text-slate-500">{ev.description}</p>
                  <p className="text-[10px] text-slate-400">Assigned: {ev.executiveName}</p>

                  <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                    <button
                      onClick={() => onOpenClientDetail(ev.leadId)}
                      className="text-blue-600 hover:underline font-semibold text-[11px]"
                    >
                      Open Client Details →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

