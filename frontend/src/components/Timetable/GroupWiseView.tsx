import React, { useState } from 'react';
import { AssignmentItem, StudentGroup } from '../../types';
import { Users, Calendar, Clock, Building2, AlertTriangle } from 'lucide-react';
import { Badge } from '../Common/Badge';

interface GroupWiseViewProps {
  assignments: AssignmentItem[];
  groups: StudentGroup[];
  onSelectAssignment: (assignment: AssignmentItem) => void;
}

export const GroupWiseView: React.FC<GroupWiseViewProps> = ({
  assignments,
  groups,
  onSelectAssignment,
}) => {
  const [selectedGroupCode, setSelectedGroupCode] = useState<string>(
    groups[0]?.code || 'CS-Y3'
  );

  const selectedGroup = groups.find((g) => g.code === selectedGroupCode);

  // Filter assignments for this group
  const groupExams = assignments
    .filter((a) => a.student_group_codes.includes(selectedGroupCode))
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));

  // Calculate gaps between exams
  const scheduleWithGaps = groupExams.map((item, index) => {
    let gapDays = null;
    if (index > 0 && item.date && groupExams[index - 1].date) {
      const prevDate = new Date(groupExams[index - 1].date + 'T00:00:00');
      const currDate = new Date(item.date + 'T00:00:00');
      const diffTime = currDate.getTime() - prevDate.getTime();
      gapDays = Math.round(diffTime / (1000 * 3600 * 24)) - 1;
    }
    return { ...item, gapDays };
  });

  return (
    <div className="space-y-4">
      {/* Group Selector */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <Users className="h-5 w-5 text-indigo-400" />
        <span className="text-xs font-semibold text-slate-300">Select Student Group:</span>
        <div className="flex flex-wrap gap-2">
          {groups.map((grp) => (
            <button
              key={grp.id}
              onClick={() => setSelectedGroupCode(grp.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedGroupCode === grp.code
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {grp.code}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Group Header */}
      {selectedGroup && (
        <div className="flex items-center justify-between px-2">
          <div>
            <h3 className="text-sm font-bold text-white">{selectedGroup.name}</h3>
            <p className="text-xs text-slate-400">
              Total Students: <span className="text-indigo-400 font-semibold">{selectedGroup.student_count}</span> • Scheduled Papers: <span className="text-white font-semibold">{groupExams.length}</span>
            </p>
          </div>
        </div>
      )}

      {/* Timeline List of Exams */}
      {scheduleWithGaps.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-800">
          No examinations assigned to group {selectedGroupCode}.
        </div>
      ) : (
        <div className="space-y-3">
          {scheduleWithGaps.map((exam, idx) => (
            <div key={exam.exam_id} className="relative">
              {/* Gap Indicator */}
              {exam.gapDays !== null && (
                <div className="my-2 ml-8 flex items-center gap-2">
                  <div className="h-4 w-px bg-slate-700" />
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      exam.gapDays === 0
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : exam.gapDays < 0
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {exam.gapDays === 0
                      ? '⚠️ Consecutive Day Exam (0 Gap Days)'
                      : exam.gapDays < 0
                      ? '🚨 Same-Day Clash!'
                      : `✓ ${exam.gapDays} Preparation Gap Day${exam.gapDays > 1 ? 's' : ''}`}
                  </span>
                </div>
              )}

              {/* Exam Card */}
              <div
                onClick={() => onSelectAssignment(exam)}
                className={`flex items-start justify-between p-4 rounded-xl border cursor-pointer transition-all hover:border-indigo-500/60 ${
                  exam.has_conflict
                    ? 'bg-rose-500/10 border-rose-500/40'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center text-indigo-400">
                    <span className="text-[10px] uppercase font-bold">Paper</span>
                    <span className="text-xs font-bold leading-none">{idx + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tracking-wide">{exam.exam_code}</span>
                      <span className="text-xs font-medium text-slate-300">— {exam.exam_name}</span>
                      {exam.is_locked && <Badge variant="warning" size="sm">Locked</Badge>}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 text-indigo-300">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{exam.date || 'Unscheduled'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{exam.slot_name || `Slot ${exam.slot_id}`} ({exam.slot_start} - {exam.slot_end})</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                        <span>{exam.room_number || 'Room TBD'} ({exam.room_name})</span>
                      </div>
                    </div>
                  </div>
                </div>

                {exam.has_conflict && (
                  <Badge variant="danger">Conflict Detected</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
