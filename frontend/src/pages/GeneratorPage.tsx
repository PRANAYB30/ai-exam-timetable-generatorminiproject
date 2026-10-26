import React, { useState } from 'react';
import { Timetable, Exam, Room, TimeSlot } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Common/Badge';
import {
  Sparkles,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Building2,
  BookOpen,
  Layers,
  FileText,
} from 'lucide-react';

interface GeneratorPageProps {
  exams: Exam[];
  rooms: Room[];
  slots: TimeSlot[];
  onTimetableGenerated: (timetable: Timetable) => void;
  onNavigate: (tab: any) => void;
  addToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const GeneratorPage: React.FC<GeneratorPageProps> = ({
  exams,
  rooms,
  slots,
  onTimetableGenerated,
  onNavigate,
  addToast,
}) => {
  const [scheduleName, setScheduleName] = useState('Fall 2026 Examination Timetable');
  const [academicTerm, setAcademicTerm] = useState('Autumn 2026-27');
  const [enforceLocked, setEnforceLocked] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastResult, setLastResult] = useState<Timetable | null>(null);

  const handleGenerate = async () => {
    if (exams.length === 0) {
      addToast('error', 'No Examinations', 'Please add or load examinations before generating.');
      return;
    }
    if (rooms.length === 0) {
      addToast('error', 'No Rooms Available', 'Please register at least one exam venue.');
      return;
    }

    setIsGenerating(true);
    setLastResult(null);

    try {
      const timetable = await api.generateTimetable({
        name: scheduleName,
        academic_term: academicTerm,
        enforce_locked: enforceLocked,
      });

      setLastResult(timetable);
      onTimetableGenerated(timetable);

      if (timetable.status === 'SUCCESS') {
        addToast(
          'success',
          'Timetable Generated Successfully',
          `All ${timetable.scheduled_exams} exams scheduled in ${timetable.execution_time_ms}ms with 0 conflicts.`
        );
      } else if (timetable.status === 'INFEASIBLE') {
        addToast(
          'warning',
          'Problem Infeasible',
          'The AI scheduler proved no valid timetable exists with current constraints.'
        );
      } else {
        addToast('warning', 'Search Timeout', 'Allotted search budget was reached.');
      }
    } catch (err: any) {
      addToast('error', 'Generation Error', err.message || 'Failed to generate timetable.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Card */}
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/30 to-slate-900/60 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              AI Timetable Generation Studio
            </h1>
            <p className="text-xs text-slate-400">
              Formulates scheduling as a Constraint Satisfaction Problem (CSP) solved via Backtracking & Heuristics.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration & Pre-requisites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="md:col-span-2 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
            Schedule Parameters
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Timetable Title
              </label>
              <input
                type="text"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Academic Session / Term
              </label>
              <input
                type="text"
                value={academicTerm}
                onChange={(e) => setAcademicTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/70 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={enforceLocked}
                  onChange={(e) => setEnforceLocked(e.target.checked)}
                  className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Preserve Locked Assignments
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Pins manually confirmed exam dates and rooms so the AI scheduler does not modify them.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing CSP Backtracking Search...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 text-indigo-200" />
                    <span>Run AI Timetable Scheduler</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Input Inventory Card */}
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Input Dataset Inventory
            </h2>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-300">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  <span>Examinations</span>
                </div>
                <span className="font-bold text-white">{exams.length} subjects</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-300">
                  <Building2 className="h-4 w-4 text-cyan-400" />
                  <span>Venues / Rooms</span>
                </div>
                <span className="font-bold text-white">{rooms.length} rooms</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span>Daily Slots</span>
                </div>
                <span className="font-bold text-white">{slots.length} sessions</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-slate-300 space-y-1">
            <span className="font-semibold text-indigo-300 block">AI Engine Pipeline:</span>
            <span>1. Domain Pre-filtering</span><br />
            <span>2. MRV Variable Ordering</span><br />
            <span>3. LCV Value Ordering</span><br />
            <span>4. Forward Checking Pruning</span>
          </div>
        </div>
      </div>

      {/* Generation Results Card */}
      {lastResult && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-md space-y-6 animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 uppercase font-semibold">
                  Generation Outcome
                </span>
                <Badge
                  variant={
                    lastResult.status === 'SUCCESS'
                      ? 'success'
                      : lastResult.status === 'INFEASIBLE'
                      ? 'danger'
                      : 'warning'
                  }
                  size="md"
                >
                  {lastResult.status}
                </Badge>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">{lastResult.name}</h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('viewer')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
              >
                <span>View Timetable</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onNavigate('analytics')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all"
              >
                <span>Explain Decisions</span>
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Execution Time
              </span>
              <span className="text-lg font-bold text-indigo-400 font-mono">
                {lastResult.execution_time_ms} ms
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Backtracks
              </span>
              <span className="text-lg font-bold text-white font-mono">
                {lastResult.backtracks_count}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Hard Violations
              </span>
              <span
                className={`text-lg font-bold font-mono ${
                  lastResult.hard_violations_count === 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {lastResult.hard_violations_count}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Soft Penalty Score
              </span>
              <span className="text-lg font-bold text-cyan-400 font-mono">
                {lastResult.soft_penalty_score}
              </span>
            </div>
          </div>

          {/* Infeasibility or Success Banner */}
          {lastResult.status === 'SUCCESS' ? (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Constraint Validation Passed (100%)</span>
                <span>
                  The timetable was independently verified. There are zero student clashes, zero room collisions, and all {lastResult.scheduled_exams} examinations are assigned to venues accommodating their seating capacity.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Scheduling Infeasible Under Constraints</span>
                <span>
                  {lastResult.ai_summary?.summary ||
                    'Domain exhaustion occurred. Review room capacities, availability dates, or student group concurrency.'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
