import React, { useState } from 'react';
import { Timetable, Room, TimeSlot, StudentGroup, AssignmentItem } from '../types';
import { api } from '../services/api';
import { MasterGridView } from '../components/Timetable/MasterGridView';
import { RoomWiseView } from '../components/Timetable/RoomWiseView';
import { GroupWiseView } from '../components/Timetable/GroupWiseView';
import { TabularView } from '../components/Timetable/TabularView';
import { ManualEditModal } from '../components/Timetable/ManualEditModal';
import { PrintableTimetable } from '../components/Timetable/PrintableTimetable';
import { Badge } from '../components/Common/Badge';
import {
  Grid,
  Building2,
  Users,
  Table as TableIcon,
  Printer,
  Download,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface TimetableViewerPageProps {
  timetable: Timetable | null;
  rooms: Room[];
  slots: TimeSlot[];
  groups: StudentGroup[];
  dates: string[];
  onTimetableUpdated: (timetable: Timetable) => void;
  onNavigate: (tab: any) => void;
  addToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const TimetableViewerPage: React.FC<TimetableViewerPageProps> = ({
  timetable,
  rooms,
  slots,
  groups,
  dates,
  onTimetableUpdated,
  onNavigate,
  addToast,
}) => {
  const [viewMode, setViewMode] = useState<'master' | 'rooms' | 'groups' | 'table'>('master');
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  if (!timetable) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
        <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
        <h3 className="text-base font-bold text-white">No Active Timetable</h3>
        <p className="mt-1 text-xs text-slate-400 max-w-sm leading-relaxed">
          There is no examination timetable generated yet. Run the AI scheduler or load sample data.
        </p>
        <button
          onClick={() => onNavigate('generator')}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
        >
          Generate New Timetable
        </button>
      </div>
    );
  }

  const handleSaveAssignment = async (data: {
    date?: string;
    slot_id?: number;
    room_id?: number;
    is_locked?: boolean;
  }) => {
    if (!editingAssignment || !editingAssignment.id) return;
    try {
      const updated = await api.updateAssignment(timetable.id, editingAssignment.id, data);
      onTimetableUpdated(updated);
      addToast('success', 'Assignment Updated', `Changes applied. Live validation complete.`);
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const val = await api.validateTimetable(timetable.id);
      const reloaded = await api.getTimetable(timetable.id);
      onTimetableUpdated(reloaded);
      if (val.is_valid) {
        addToast('success', 'Validation Passed', 'Timetable has 0 hard-constraint violations.');
      } else {
        addToast('warning', 'Violations Detected', `Found ${val.hard_violations_count} constraint violations.`);
      }
    } catch (err: any) {
      addToast('error', 'Validation Failed', err.message);
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
        addToast('success', 'Timetable Repaired', 'All conflicts resolved while preserving locked exams.');
      } else {
        addToast('warning', 'Repair Incomplete', 'Could not resolve all conflicts without unlocking assignments.');
      }
    } catch (err: any) {
      addToast('error', 'Repair Error', err.message);
    } finally {
      setIsRepairing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const hasConflicts = timetable.hard_violations_count > 0;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white">{timetable.name}</h1>
            <Badge
              variant={
                timetable.status === 'SUCCESS' && !hasConflicts
                  ? 'success'
                  : hasConflicts
                  ? 'danger'
                  : 'warning'
              }
              size="sm"
            >
              {hasConflicts ? `${timetable.hard_violations_count} Conflicts` : 'Conflict-Free'}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Academic Term: <span className="text-indigo-400 font-medium">{timetable.academic_term}</span> • Scheduled Papers: <span className="text-white font-medium">{timetable.scheduled_exams} / {timetable.total_exams}</span> • Soft Penalty: <span className="text-cyan-400 font-mono">{timetable.soft_penalty_score}</span>
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Buttons */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('master')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'master'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Master Grid</span>
            </button>
            <button
              onClick={() => setViewMode('rooms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'rooms'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Rooms</span>
            </button>
            <button
              onClick={() => setViewMode('groups')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'groups'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Student Groups</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Action Buttons */}
          {hasConflicts && (
            <button
              onClick={handleRepair}
              disabled={isRepairing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
            >
              <Wrench className="h-3.5 w-3.5 text-amber-400" />
              <span>{isRepairing ? 'Repairing...' : 'Repair with AI'}</span>
            </button>
          )}

          <button
            onClick={handleValidate}
            disabled={isValidating}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Validate</span>
          </button>

          <a
            href={api.getExportCsvUrl(timetable.id)}
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>CSV Export</span>
          </a>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all"
          >
            <Printer className="h-3.5 w-3.5 text-indigo-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Conflicts Alert Banner if any */}
      {hasConflicts && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 backdrop-blur-md print:hidden">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
            <div>
              <span className="font-bold text-xs text-white">
                Detected {timetable.hard_violations_count} Hard Constraint Violation(s)
              </span>
              <p className="text-[11px] text-rose-300">
                Manual changes or unassigned examinations exist. Run AI Repair to resolve conflicts automatically.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('conflicts')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
          >
            View Conflicts Report
          </button>
        </div>
      )}

      {/* Main View Mode Render */}
      <div className="print:hidden">
        {viewMode === 'master' && (
          <MasterGridView
            assignments={timetable.assignments}
            dates={dates}
            slots={slots}
            onSelectAssignment={(a) => setEditingAssignment(a)}
          />
        )}

        {viewMode === 'rooms' && (
          <RoomWiseView
            assignments={timetable.assignments}
            rooms={rooms}
            slots={slots}
            dates={dates}
            onSelectAssignment={(a) => setEditingAssignment(a)}
          />
        )}

        {viewMode === 'groups' && (
          <GroupWiseView
            assignments={timetable.assignments}
            groups={groups}
            onSelectAssignment={(a) => setEditingAssignment(a)}
          />
        )}

        {viewMode === 'table' && (
          <TabularView
            assignments={timetable.assignments}
            onSelectAssignment={(a) => setEditingAssignment(a)}
          />
        )}
      </div>

      {/* Printable Report Component */}
      <PrintableTimetable timetable={timetable} />

      {/* Manual Edit Modal */}
      <ManualEditModal
        isOpen={editingAssignment !== null}
        onClose={() => setEditingAssignment(null)}
        assignment={editingAssignment}
        rooms={rooms}
        slots={slots}
        dates={dates}
        onSave={handleSaveAssignment}
      />
    </div>
  );
};
