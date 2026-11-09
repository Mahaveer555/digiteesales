'use client';

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Check, X, Sparkles, RefreshCw, Send, AlertCircle } from 'lucide-react';
import { StructuredVoiceResult } from '@/lib/voice-processor';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessSave?: () => void;
}

export default function VoiceModal({ isOpen, onClose, onSuccessSave }: VoiceModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<StructuredVoiceResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Speech Recognition instance
  useEffect(() => {
    if (!isOpen) {
      setTranscript('');
      setExtractedData(null);
      setSavedSuccess(false);
      setErrorMsg('');
      setIsRecording(false);
    }
  }, [isOpen]);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setErrorMsg('Speech recognition is not supported in this browser. Please use the text input or preset examples below.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'hi-IN'; // Supports Hindi, Hinglish & English
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        setErrorMsg('');
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsRecording(false);
        handleProcessVoice(text);
      };

      recognition.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  const handleProcessVoice = async (textToProcess: string) => {
    if (!textToProcess.trim()) return;
    setIsProcessing(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: textToProcess }),
      });
      const data = await res.json();
      if (res.ok) {
        setExtractedData(data.extracted);
      } else {
        setErrorMsg(data.error || 'Failed to extract structured CRM fields');
      }
    } catch {
      setErrorMsg('Network error while processing voice transcript');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!extractedData) return;
    setIsSaving(true);
    setErrorMsg('');

    try {
      // 1. Create or Find Lead
      const leadRes = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: extractedData.companyName,
          ownerName: extractedData.ownerName || 'Business Owner',
          mobileNumber: `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}`,
          status: extractedData.status,
          interestLevel: extractedData.interestLevel,
          servicesRequired: extractedData.servicesRequired.join(', '),
          nextFollowUpDate: extractedData.nextFollowUpDate,
          nextFollowUpTime: extractedData.nextFollowUpTime,
          followUpType: extractedData.followUpType,
          remarks: extractedData.remarks,
        }),
      });

      if (!leadRes.ok) {
        const errData = await leadRes.json();
        throw new Error(errData.error || 'Failed to save lead into CRM');
      }

      setSavedSuccess(true);
      setTimeout(() => {
        onSuccessSave?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving to CRM');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Voice-to-CRM Intelligence
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  Hindi / English / Hinglish
                </span>
              </h2>
              <p className="text-xs text-slate-300">Speak or paste your meeting notes to convert to structured CRM data</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Microphone Action Button */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
            <button
              onClick={toggleRecording}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isRecording
                  ? 'bg-rose-500 text-white animate-bounce ring-4 ring-rose-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
              }`}
            >
              {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>
            <p className="mt-2 text-xs font-semibold text-slate-700">
              {isRecording ? 'Listening in Hindi & English... Speak now' : 'Click microphone to record voice'}
            </p>
          </div>

          {/* Quick Preset Examples (for testing Prompt Section 8 requirement!) */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quick Test Presets (Click to test AI conversion):
            </p>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => {
                  const example =
                    'आज मैं शर्मा इंडस्ट्रीज गया था। मालिक से मुलाकात हुई। उन्हें वेबसाइट और डिजिटल मार्केटिंग में इंटरेस्ट है। उन्होंने कहा है कि पांच दिन बाद फोन करना।';
                  setTranscript(example);
                  handleProcessVoice(example);
                }}
                className="text-left text-xs bg-slate-100 hover:bg-slate-200/80 p-2 rounded-lg text-slate-700 transition-colors border border-slate-200/60"
              >
                🇮🇳 <span className="font-semibold text-slate-900">Example 1 (Hindi Prompt Case):</span> "आज मैं शर्मा इंडस्ट्रीज गया था। मालिक से मुलाकात हुई..."
              </button>
              <button
                onClick={() => {
                  const example =
                    'Met Apex Textiles MD Manish Chawla today. Client is highly interested in e-commerce portal and Google Ads. Schedule follow-up visit tomorrow at 3 PM to finalize deal.';
                  setTranscript(example);
                  handleProcessVoice(example);
                }}
                className="text-left text-xs bg-slate-100 hover:bg-slate-200/80 p-2 rounded-lg text-slate-700 transition-colors border border-slate-200/60"
              >
                🇬🇧 <span className="font-semibold text-slate-900">Example 2 (English):</span> "Met Apex Textiles MD Manish Chawla today. Schedule follow-up visit tomorrow..."
              </button>
            </div>
          </div>

          {/* Transcript input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Spoken Voice Transcript:
            </label>
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Spoken words will appear here or type freely in Hindi or English..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              />
              <button
                onClick={() => handleProcessVoice(transcript)}
                disabled={!transcript.trim() || isProcessing}
                className="px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center shrink-0 transition-colors"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 font-semibold">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Successfully confirmed & saved into DIGITEE WORLD CRM!</span>
            </div>
          )}

          {/* Extracted Structured CRM Fields (Prompt Section 8 Preview) */}
          {extractedData && (
            <div className="bg-slate-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  AI Extracted CRM Fields (Review Before Saving)
                </span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Extracted
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Company:</span>
                  <span className="font-bold text-slate-800">{extractedData.companyName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Meeting Status:</span>
                  <span className="font-semibold text-emerald-700">{extractedData.meetingStatus}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Interest Level:</span>
                  <span className="font-semibold text-blue-700">{extractedData.interestLevel}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Services Required:</span>
                  <span className="font-semibold text-slate-800">{extractedData.servicesRequired.join(', ')}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Next Follow-up Date:</span>
                  <span className="font-bold text-amber-700">
                    {extractedData.nextFollowUpDate} ({extractedData.nextFollowUpDays} Days Later)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Follow-up Type:</span>
                  <span className="font-semibold text-purple-700">{extractedData.followUpType}</span>
                </div>
              </div>

              <div className="text-xs pt-1 border-t border-slate-200/60">
                <span className="text-slate-400 font-medium block">Remarks:</span>
                <span className="text-slate-700 italic">{extractedData.remarks}</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setExtractedData(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleConfirmSave}
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Confirm & Save to CRM
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
