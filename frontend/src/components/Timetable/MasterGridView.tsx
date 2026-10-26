import React from 'react';
import { AssignmentItem, TimeSlot } from '../../types';
import { Lock, AlertCircle, Building2, Users } from 'lucide-react';
import { Badge } from '../Common/Badge';

interface MasterGridViewProps {
  assignments: AssignmentItem[];
  dates: string[];
  slots: TimeSlot[];
  onSelectAssignment: (assignment: AssignmentItem) => void;
}

export const MasterGridView: React.FC<MasterGridViewProps> = ({
  assignments,
  dates,
  slots,
  onSelectAssignment,
}) => {
  // Map (date, slot_id) -> assignments
  const gridMap = new Map<string, AssignmentItem[]>();

  assignments.forEach((a) => {
    if (a.date && a.slot_id) {
      const key = `${a.date}:${a.slot_id}`;
      if (!gridMap.has(key)) {
        gridMap.set(key, []);
      }
      gridMap.get(key)!.push(a);
    }
  });

  // Collect unscheduled
  const unscheduled = assignments.filter((a) => !a.date || !a.slot_id);

  return (
    <div className="space-y-6">
      {/* Unscheduled Warning if any */}
      {unscheduled.length > 0 && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 backdrop-blur-md">
          <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs mb-2">
            <AlertCircle className="h-4 w-4 text-rose-400" />
            <span>{unscheduled.length} Unscheduled Examination(s)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((a) => (
              <button
                key={a.exam_id}
                onClick={() => onSelectAssignment(a)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-rose-500/40 text-xs text-rose-200 hover:border-rose-400 flex items-center gap-2"
              >
                <span className="font-bold">{a.exam_code}</span>
                <span className="text-slate-400">({a.student_count} students)</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-md">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80">
              <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 w-36 border-r border-slate-800">
                Examination Date
              </th>
              {slots.map((slot) => (
                <th
                  key={slot.id}
                  className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-300 border-r border-slate-800 last:border-r-0 min-w-[280px]"
                >
                  <div className="flex items-center justify-between">
                    <span>{slot.name}</span>
                    <span className="text-[11px] font-normal text-indigo-400">
                      {slot.start_time} - {slot.end_time}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {dates.map((date) => (
              <tr key={date} className="hover:bg-slate-800/30 transition-colors">
                {/* Date Header Cell */}
                <td className="p-4 align-top font-semibold text-xs text-white border-r border-slate-800 bg-slate-950/40">
                  <div className="sticky top-20">
                    <div className="text-sm font-bold text-indigo-300">
                      {new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">{date}</div>
                  </div>
                </td>

                {/* Slots Cells */}
                {slots.map((slot) => {
                  const cellKey = `${date}:${slot.id}`;
                  const cellAssignments = gridMap.get(cellKey) || [];

                  return (
                    <td
                      key={slot.id}
                      className="p-3 align-top border-r border-slate-800 last:border-r-0 min-h-[120px]"
                    >
                      {cellAssignments.length === 0 ? (
                        <div className="h-full min-h-[90px] rounded-xl border border-dashed border-slate-800/60 p-4 flex items-center justify-center text-xs text-slate-600">
                          No exams scheduled
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {cellAssignments.map((item) => (
                            <div
                              key={item.exam_id}
                              onClick={() => onSelectAssignment(item)}
                              className={`group relative rounded-xl border p-3 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg ${
                                item.has_conflict
                                  ? 'bg-rose-500/10 border-rose-500/50 hover:border-rose-400'
                                  : 'bg-slate-800/80 border-slate-700/80 hover:border-indigo-500/60 hover:bg-slate-800'
                              }`}
                            >
                              {/* Top row: Subject Code & Icons */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-xs text-white tracking-wide">
                                    {item.exam_code}
                                  </span>
                                  {item.is_locked && (
                                    <span title="Assignment Locked">
                                      <Lock className="h-3 w-3 text-amber-400" />
                                    </span>
                                  )}
                                  {item.has_conflict && (
                                    <Badge variant="danger" size="sm">
                                      Conflict
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {item.student_count} std
                                </span>
                              </div>

                              {/* Exam Name */}
                              <p className="mt-1 text-xs text-slate-300 font-medium line-clamp-1">
                                {item.exam_name}
                              </p>

                              {/* Details: Room and Groups */}
                              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/50 pt-2">
                                <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                                  <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                                  <span>{item.room_number || 'No Room'}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    (Cap: {item.room_capacity})
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 text-slate-400">
                                  <Users className="h-3 w-3 text-slate-400" />
                                  <span>{item.student_group_codes.join(', ')}</span>
                                </div>
                              </div>

                              {/* Conflict tooltip/reason */}
                              {item.has_conflict && item.conflict_reason && (
                                <p className="mt-1.5 text-[10px] text-rose-300 bg-rose-950/60 p-1.5 rounded border border-rose-800/60">
                                  {item.conflict_reason}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
