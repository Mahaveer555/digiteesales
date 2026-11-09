'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Trophy,
  Award,
  Medal,
  Crown,
  Sparkles,
  TrendingUp,
  Percent,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { LeaderboardEntry } from '@/lib/types';

export default function LeaderboardView() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all-time'>('monthly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [scoringWeights, setScoringWeights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?period=${period}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setScoringWeights(data.scoringWeights || null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [period]);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-6">
      {/* Hero Header & Mode Switcher */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#1A365D] to-[#0B192C] text-white p-6 rounded-3xl shadow-xl border border-slate-700/80 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-wide">LIVE SALES TEAM LEADERBOARD</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 uppercase">
                  Verified Data
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time performance rankings based on verified meetings, finalized deals, and client satisfaction.
              </p>
            </div>
          </div>

          {/* Ranking Mode Toggle (Prompt Section 5) */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-700">
            {[
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'all-time', label: 'All-Time' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setPeriod(m.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === m.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Configurable Points Weight Pill */}
        {scoringWeights && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-3 text-[11px] text-slate-300 flex-wrap">
            <span className="font-bold text-amber-400">Scoring Weights:</span>
            <span>Meeting: +{scoringWeights.pointsMeetingCompleted} pts</span>
            <span>•</span>
            <span>Interested Client: +{scoringWeights.pointsInterestedClient} pts</span>
            <span>•</span>
            <span>Final Discussion: +{scoringWeights.pointsFinalDiscussion} pts</span>
            <span>•</span>
            <span>Finalized Deal: +{scoringWeights.pointsDealFinalized} pts</span>
            <span>•</span>
            <span className="text-rose-400 font-semibold">Missed Follow-up Penalty: -{scoringWeights.penaltyOverdueFollowup} pts</span>
          </div>
        )}
      </div>

      {/* Visual Podium for Top 3 Employees (Prompt Section 5 Requirement) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
        {/* 2nd Position: Silver Trophy */}
        {top2 && (
          <div className="order-2 md:order-1 bg-gradient-to-t from-slate-100 to-white rounded-2xl border-2 border-slate-300 p-5 shadow-md flex flex-col items-center text-center relative">
            <div className="absolute -top-5 w-10 h-10 rounded-full bg-slate-200 border-2 border-slate-400 text-slate-700 font-black flex items-center justify-center text-base shadow-sm">
              🥈 2
            </div>
            <div className="w-16 h-16 rounded-full bg-slate-300 border-2 border-slate-400 overflow-hidden mt-3 shadow">
              <img
                src={top2.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
                alt={top2.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mt-2">{top2.name}</h3>
            <p className="text-[11px] text-slate-500">{top2.department}</p>
            <div className="mt-3 py-1.5 px-4 bg-slate-200/70 rounded-full text-slate-800 font-extrabold text-xs">
              {top2.score} Points
            </div>
            <div className="grid grid-cols-2 gap-2 w-full mt-3 pt-3 border-t border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-400 block font-medium">Deals Won</span>
                <span className="font-bold text-slate-800">{top2.dealsFinalized}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Revenue</span>
                <span className="font-bold text-emerald-700">₹{(top2.totalRevenue || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        {/* 1st Position: Gold Trophy (Elevated Podium) */}
        {top1 && (
          <div className="order-1 md:order-2 bg-gradient-to-t from-amber-50 to-white rounded-3xl border-2 border-amber-400 p-6 shadow-xl flex flex-col items-center text-center relative gold-glow transform md:-translate-y-3">
            <div className="absolute -top-6 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 border-2 border-amber-300 text-white font-black flex items-center justify-center text-xl shadow-lg">
              👑
            </div>
            <div className="w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-400 overflow-hidden mt-3 shadow-md">
              <img
                src={top1.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={top1.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase">
                1st Place • Champion
              </span>
            </div>
            <h3 className="font-black text-slate-900 text-base mt-1">{top1.name}</h3>
            <p className="text-xs text-slate-500">{top1.department}</p>
            <div className="mt-3 py-1.5 px-6 bg-amber-500 text-slate-950 rounded-full font-black text-sm shadow-md shadow-amber-500/30">
              {top1.score} Points
            </div>
            <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-amber-200 text-[11px]">
              <div>
                <span className="text-slate-500 block font-medium">Meetings</span>
                <span className="font-bold text-slate-900">{top1.completedMeetings}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Deals</span>
                <span className="font-bold text-emerald-700">{top1.dealsFinalized}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Revenue</span>
                <span className="font-bold text-slate-900">₹{(top1.totalRevenue || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3rd Position: Bronze Trophy */}
        {top3 && (
          <div className="order-3 bg-gradient-to-t from-orange-50 to-white rounded-2xl border-2 border-amber-700/30 p-5 shadow-md flex flex-col items-center text-center relative">
            <div className="absolute -top-5 w-10 h-10 rounded-full bg-amber-100 border-2 border-amber-700/50 text-amber-900 font-black flex items-center justify-center text-base shadow-sm">
              🥉 3
            </div>
            <div className="w-16 h-16 rounded-full bg-orange-100 border-2 border-amber-700/40 overflow-hidden mt-3 shadow">
              <img
                src={top3.avatarUrl || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'}
                alt={top3.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mt-2">{top3.name}</h3>
            <p className="text-[11px] text-slate-500">{top3.department}</p>
            <div className="mt-3 py-1.5 px-4 bg-orange-200/70 rounded-full text-amber-950 font-extrabold text-xs">
              {top3.score} Points
            </div>
            <div className="grid grid-cols-2 gap-2 w-full mt-3 pt-3 border-t border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-400 block font-medium">Deals Won</span>
                <span className="font-bold text-slate-800">{top3.dealsFinalized}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Revenue</span>
                <span className="font-bold text-emerald-700">₹{(top3.totalRevenue || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Complete Team Standings</h2>
          <span className="text-xs text-slate-500 font-semibold">{leaderboard.length} Active Sales Reps</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Completed Meetings</th>
                <th className="py-3 px-4 text-center">Interested Clients</th>
                <th className="py-3 px-4 text-center">Follow-ups Done</th>
                <th className="py-3 px-4 text-center">Missed Follow-ups</th>
                <th className="py-3 px-4 text-center">Deals Finalized</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-center">Conversion</th>
                <th className="py-3 px-4 text-center">Target Ach.</th>
                <th className="py-3 px-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboard.map((emp) => {
                const isCurrentUser = user?.id === emp.userId;
                return (
                  <tr
                    key={emp.userId}
                    className={`hover:bg-slate-50 transition-colors ${
                      isCurrentUser ? 'bg-blue-50/70 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      {emp.rank === 1 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-950">
                          🥇 1st
                        </span>
                      ) : emp.rank === 2 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-slate-300 text-slate-900">
                          🥈 2nd
                        </span>
                      ) : emp.rank === 3 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-700/20 text-amber-900">
                          🥉 3rd
                        </span>
                      ) : (
                        <span className="font-bold text-slate-600 pl-2">#{emp.rank}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <span>{emp.name}</span>
                        {isCurrentUser && (
                          <span className="ml-1 text-[10px] text-blue-600 font-bold">(You)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{emp.department}</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">{emp.completedMeetings}</td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-700">{emp.interestedClients}</td>
                    <td className="py-3 px-4 text-center font-semibold text-emerald-700">{emp.followUpsCompleted}</td>
                    <td className="py-3 px-4 text-center">
                      {emp.missedFollowUps > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                          {emp.missedFollowUps}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">{emp.dealsFinalized}</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      ₹{emp.totalRevenue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">{emp.conversionRate}%</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-700">{emp.targetAchievement}%</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 font-black text-xs">
                        {emp.score} pts
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

