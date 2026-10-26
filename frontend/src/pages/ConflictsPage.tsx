import React, { useState } from 'react';
import { Timetable, UserProfile } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Common/Badge';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  Lock,
} from 'lucide-react';

interface ConflictsPageProps {
  timetable: Timetable | null;
  user?: UserProfile | null;
  onTimetableUpdated: (timetable: Timetable) => void;
  onNavigate: (tab: any) => void;
  addToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const ConflictsPage: React.FC<ConflictsPageProps> = ({
  timetable,
  user,
  onTimetableUpdated,
  onNavigate,
  addToast,
}) => {
  const [isRepairing, setIsRepairing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  if (!timetable) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
        <ShieldAlert className="h-10 w-10 text-slate-500 mb-3" />
        <h3 className="text-base font-bold text-white">No Timetable Available</h3>
        <p className="mt-1 text-xs text-slate-400">Generate an examination schedule to run verification audits.</p>
        <button
          onClick={() => onNavigate('generator')}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
        >
          Go to Schedule Planner
        </button>
      </div>
    );
  }

  const conflicts = timetable.conflict_reports || [];
  const isConflictFree = conflicts.length === 0 && timetable.hard_violations_count === 0;

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const val = await api.validateTimetable(timetable.id);
      const reloaded = await api.getTimetable(timetable.id);
      onTimetableUpdated(reloaded);
      if (val.is_valid) {
        addToast('success', 'Validation Complete', 'All hard constraints satisfied (0 conflicts).');
      } else {
        addToast('warning', 'Conflicts Found', `Detected ${val.hard_violations_count} constraint violations.`);
      }
    } catch (err: any) {
      addToast('error', 'Validation Error', err.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRepair = async () => {
    setIsRepairing(true);
    try {
      const repaired = await api.repairTimetable(timetable.id, true);
      onTimetableUpdated(repaired);
      if (repaired.hard_violations_count === 0) {
        addToast('success', 'Repair Successful', 'Conflicts resolved via CSP Backtracking search.');
      } else {
        addToast('warning', 'Partial Repair', 'Some conflicts could not be resolved with current locked assignments.');
      }
    } catch (err: any) {
      addToast('error', 'Repair Error', err.message);
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-xl border ${
              isConflictFree
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {isConflictFree ? (
              <ShieldCheck className="h-6 w-6" />
            ) : (
              <ShieldAlert className="h-6 w-6" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              Examination Schedule Audit & Clash Diagnostics
            </h1>
            <p className="text-xs text-slate-400">
              Official constraint audit for timetable: <span className="text-white font-medium">{timetable.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleValidate}
            disabled={isValidating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:text-white transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? 'animate-spin' : ''}`} />
            <span>Re-Audit Constraints</span>
          </button>

          {!isConflictFree && (
            user?.role === 'ADMIN' ? (
              <button
                onClick={handleRepair}
                disabled={isRepairing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>{isRepairing ? 'Repairing...' : 'Repair Schedule with AI'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                <Lock className="h-3.5 w-3.5" />
                <span>Admin required to repair</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Clean Status State */}
      {isConflictFree ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-950/20 to-slate-900/60 p-8 text-center space-y-4 backdrop-blur-md">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">All Constraints Satisfied</h2>
            <p className="mt-1 text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              The independent validator confirmed zero hard-constraint violations across all student groups, exam rooms, seating capacities, and time sessions.
            </p>
          </div>

          <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-semibold text-emerald-400 block">✓ No Student Clashes</span>
              <span className="text-[11px] text-slate-400">No overlapping exams for any cohort.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-semibold text-emerald-400 block">✓ No Room Collisions</span>
              <span className="text-[11px] text-slate-400">Zero double-booked exam halls.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-semibold text-emerald-400 block">✓ Capacity Verified</span>
              <span className="text-[11px] text-slate-400">Every venue accommodates all students.</span>
            </div>
          </div>
        </div>
      ) : (
        /* List of Conflict Cards */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Found <strong className="text-rose-400">{conflicts.length}</strong> conflict item(s)
            </span>
            <span className="text-slate-500">
              Hard violations prevent timetable publication until resolved.
            </span>
          </div>

          {conflicts.map((conflict, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-rose-500/30 bg-slate-900/80 p-5 shadow-lg backdrop-blur-md space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 mt-0.5">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-wide">
                        {conflict.type.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="danger" size="sm">
                        {conflict.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-rose-200 font-medium">
                      {conflict.message}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {conflict.affected_exam_codes.map((code) => (
                    <Badge key={code} variant="neutral" size="sm">
                      {code}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Corrective Action Box */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                <Lightbulb className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300">Suggested Action: </span>
                  <span>{conflict.suggested_action}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
