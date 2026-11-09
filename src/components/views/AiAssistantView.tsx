'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  BrainCircuit,
  Send,
  Sparkles,
  Bot,
  User,
  Table,
  RefreshCw,
  Trophy,
  ClockAlert,
  ArrowRight,
} from 'lucide-react';
import { AiQueryResult } from '@/lib/ai-assistant';

export default function AiAssistantView({
  onSelectView,
  onOpenClientDetail,
}: {
  onSelectView: (view: string) => void;
  onOpenClientDetail: (id: string) => void;
}) {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<
    Array<{
      sender: 'user' | 'ai';
      text: string;
      dataSummary?: any;
      suggestedFollowUps?: string[];
    }>
  >([
    {
      sender: 'ai',
      text: `Hello ${user?.name}! I am your DIGITEE WORLD AI Sales Intelligence Assistant. I am directly connected to your live CRM database and can answer questions about sales activities, top performers, overdue follow-ups, and clients ready to close.\n\nClick any suggested question below or type freely:`,
      suggestedFollowUps: [
        'Which employee missed the most follow-ups this week?',
        'Who is today’s top performer?',
        'Which clients are ready to finalize?',
        'Show me all meetings scheduled for tomorrow.',
        'Which leads have not been contacted in 7 days?',
        'Give me today’s complete sales report.',
        'Which employee has the highest conversion rate?',
        'Show all clients interested in website development.',
      ],
    },
  ]);
  const [isQuerying, setIsQuerying] = useState(false);

  const handleSend = async (queryText?: string) => {
    const q = queryText || prompt;
    if (!q.trim() || isQuerying) return;

    const userMessage = { sender: 'user' as const, text: q };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt('');
    setIsQuerying(true);

    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q }),
      });
      const data: AiQueryResult = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: data.answerText,
          dataSummary: data.dataSummary,
          suggestedFollowUps: data.suggestedFollowUps,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Apologies, I encountered a network error while querying the CRM database.',
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white p-4 rounded-2xl flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <BrainCircuit className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              DIGITEE WORLD — Smart AI Sales Assistant
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Connected to Live DB
              </span>
            </h1>
            <p className="text-xs text-slate-300">
              Ask natural language questions to query employee performance, missed follow-ups, and client deals.
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 text-xs ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-[#0B192C] text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`p-4 rounded-2xl max-w-2xl space-y-3 ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20 font-medium'
                  : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-bl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>

              {/* Factual Data Summary (Table / Records) */}
              {m.dataSummary && m.dataSummary.records && (
                <div className="mt-3 overflow-x-auto bg-white rounded-xl border border-slate-200 p-3 shadow-inner text-[11px]">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-slate-500 font-bold uppercase">
                    <span className="flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-blue-600" />
                      Verified Database Results ({m.dataSummary.type})
                    </span>
                  </div>

                  <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-100">
                      {m.dataSummary.records.map((row: any, rIdx: number) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          {Object.entries(row).map(([key, val]: any) => (
                            <td key={key} className="py-1.5 px-2">
                              <span className="text-slate-400 font-medium block text-[9px] uppercase">{key}</span>
                              <span className="font-semibold text-slate-800">{String(val)}</span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Suggested Follow-up chips */}
              {m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Questions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {m.suggestedFollowUps.map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => handleSend(chip)}
                        className="text-[11px] px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 font-medium rounded-lg border border-blue-200 transition-colors shadow-2xs text-left"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
        ))}

        {isQuerying && (
          <div className="flex gap-3 text-xs justify-start items-center text-slate-400 p-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>AI is querying authorized DIGITEE WORLD database...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 shrink-0">
        <input
          type="text"
          placeholder="Ask anything about sales, missed follow-ups, top performers, or clients..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
        />
        <button
          onClick={() => handleSend()}
          disabled={!prompt.trim() || isQuerying}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-600/30"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Ask AI</span>
        </button>
      </div>
    </div>
  );
}

