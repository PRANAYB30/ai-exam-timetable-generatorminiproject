import React, { useState } from 'react';
import { Timetable, Room, TimeSlot, StudentGroup, AssignmentItem, UserProfile } from '../types';
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
  Lock,
  Search,
  Filter,
  CheckCircle2,
  X,
} from 'lucide-react';

interface TimetableViewerPageProps {
  timetable: Timetable | null;
  rooms: Room[];
  slots: TimeSlot[];
  groups: StudentGroup[];
  dates: string[];
  user?: UserProfile | null;
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
  user,
  onTimetableUpdated,
  onNavigate,
  addToast,
}) => {
  const [viewMode, setViewMode] = useState<'master' | 'rooms' | 'groups' | 'table'>('master');
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Quick Filter State (Simplifies finding a specific batch or hall)
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Filtered assignments based on search, batch, and room
  const filteredAssignments = timetable.assignments.filter((a) => {
    const matchesBatch =
      selectedBatch === 'ALL' ||
      a.student_group_codes.some((g) => g.toLowerCase() === selectedBatch.toLowerCase());
    const matchesRoom =
      selectedRoom === 'ALL' ||
      (a.room_number && a.room_number.toLowerCase() === selectedRoom.toLowerCase());
    const matchesSearch =
      !searchQuery.trim() ||
      a.exam_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.exam_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBatch && matchesRoom && matchesSearch;
  });

  const isFiltering = selectedBatch !== 'ALL' || selectedRoom !== 'ALL' || searchQuery.trim() !== '';

  const handleClearFilters = () => {
    setSelectedBatch('ALL');
    setSelectedRoom('ALL');
    setSearchQuery('');
  };

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
    <div className="space-y-5">
      {/* Top Academic Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl print:hidden">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base font-bold text-white tracking-tight">{timetable.name}</h1>
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
              {hasConflicts ? `${timetable.hard_violations_count} Conflicts` : '100% Conflict-Free'}
            </Badge>

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3" />
              <span>Official CoE Release</span>
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Academic Term: <span className="text-indigo-400 font-medium">{timetable.academic_term}</span> • Scheduled Papers: <span className="text-white font-medium">{timetable.scheduled_exams} / {timetable.total_exams}</span> • Quality Score: <span className="text-cyan-400 font-mono font-semibold">{timetable.soft_penalty_score}</span>
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
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
              <span>Venues</span>
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
              <span>Batches</span>
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
          {user?.role !== 'ADMIN' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span>Student View (Read-Only)</span>
            </div>
          )}

          {hasConflicts && user?.role === 'ADMIN' && (
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
            <span>Audit</span>
          </button>

          <a
            href={api.getExportCsvUrl(timetable.id)}
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span>CSV</span>
          </a>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Official Circular</span>
          </button>
        </div>
      </div>

      {/* Interactive Quick Filter Toolbar (Simplifies viewing specific batch or venue) */}
      <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course code or name..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Batch Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium hidden sm:inline">Batch:</span>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Student Batches</option>
              {groups.map((g) => (
                <option key={g.id} value={g.code}>
                  {g.code} ({g.name})
                </option>
              ))}
            </select>
          </div>

          {/* Venue / Room Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium hidden sm:inline">Venue:</span>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Venues & Halls</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.room_number}>
                  {r.room_number} ({r.name})
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {isFiltering && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Filter Results Count Indicator */}
        <div className="text-slate-400">
          Showing <span className="font-bold text-white">{filteredAssignments.length}</span> of{' '}
          <span className="text-slate-300">{timetable.assignments.length}</span> examinations
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
            assignments={filteredAssignments}
            dates={dates}
            slots={slots}
            onSelectAssignment={(a) => setEditingAssignment(a)}
          />
        )}

        {viewMode === 'rooms' && (
          <RoomWiseView
            assignments={filteredAssignments}
            rooms={rooms}
            slots={slots}
            dates={dates}
            onSelectAssignment={(a) => setEditingAssignment(a)}
          />
        )}

        {viewMode === 'groups' && (
          <GroupWiseView
            assignments={filteredAssignments}
            groups={groups}
            onSelectAssignment={(a) => setEditingAssignment(a)}
          />
        )}

        {viewMode === 'table' && (
          <TabularView
            assignments={filteredAssignments}
            onSelectAssignment={(a) => setEditingAssignment(a)}
          />
        )}
      </div>

      {/* Printable Report Component (Updated with institutional circular letterhead) */}
      <PrintableTimetable timetable={timetable} filteredBatch={selectedBatch} />

      {/* Manual Edit Modal */}
      <ManualEditModal
        isOpen={editingAssignment !== null}
        onClose={() => setEditingAssignment(null)}
        assignment={editingAssignment}
        rooms={rooms}
        slots={slots}
        dates={dates}
        readOnly={user?.role !== 'ADMIN'}
        onSave={handleSaveAssignment}
      />
    </div>
  );
};

export default TimetableViewerPage;
