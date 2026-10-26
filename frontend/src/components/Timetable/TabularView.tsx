import React, { useState } from 'react';
import { AssignmentItem } from '../../types';
import { Search, Lock, Edit3, ArrowUpDown } from 'lucide-react';
import { Badge } from '../Common/Badge';

interface TabularViewProps {
  assignments: AssignmentItem[];
  onSelectAssignment: (assignment: AssignmentItem) => void;
}

export const TabularView: React.FC<TabularViewProps> = ({
  assignments,
  onSelectAssignment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'code' | 'room'>('date');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = assignments.filter((a) => {
    const q = searchTerm.toLowerCase();
    return (
      a.exam_code.toLowerCase().includes(q) ||
      a.exam_name.toLowerCase().includes(q) ||
      (a.room_number || '').toLowerCase().includes(q) ||
      a.student_group_codes.some((g) => g.toLowerCase().includes(q))
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'date') {
      const keyA = `${a.date || '9999'}:${a.slot_id || 99}`;
      const keyB = `${b.date || '9999'}:${b.slot_id || 99}`;
      cmp = keyA.localeCompare(keyB);
    } else if (sortField === 'code') {
      cmp = a.exam_code.localeCompare(b.exam_code);
    } else if (sortField === 'room') {
      cmp = (a.room_number || '').localeCompare(b.room_number || '');
    }
    return sortAsc ? cmp : -cmp;
  });

  const toggleSort = (field: 'date' | 'code' | 'room') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subject code, name, room, or student group..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-400">
          Showing <span className="text-white font-semibold">{sorted.length}</span> of{' '}
          {assignments.length} examinations
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-md">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase font-semibold">
              <th
                onClick={() => toggleSort('code')}
                className="p-3.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Subject</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3.5">Student Groups</th>
              <th className="p-3.5">Count</th>
              <th
                onClick={() => toggleSort('date')}
                className="p-3.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Date & Slot</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('room')}
                className="p-3.5 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Room / Venue</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {sorted.map((item) => (
              <tr key={item.exam_id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-3.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>{item.exam_code}</span>
                    {item.is_locked && (
                      <span title="Locked">
                        <Lock className="h-3 w-3 text-amber-400" />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.exam_name}</div>
                </td>
                <td className="p-3.5">
                  <div className="flex flex-wrap gap-1">
                    {item.student_group_codes.map((g) => (
                      <Badge key={g} size="sm" variant="neutral">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="p-3.5 font-medium text-slate-300">{item.student_count}</td>
                <td className="p-3.5">
                  <div className="font-semibold text-white">{item.date || 'Unassigned'}</div>
                  <div className="text-[11px] text-indigo-400">
                    {item.slot_name || `Slot ${item.slot_id || 'TBD'}`} ({item.slot_start || '00:00'} -{' '}
                    {item.slot_end || '00:00'})
                  </div>
                </td>
                <td className="p-3.5">
                  <div className="font-semibold text-white">
                    {item.room_number || 'Unassigned'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Cap: {item.room_capacity || 'N/A'} • {item.room_type || 'Classroom'}
                  </div>
                </td>
                <td className="p-3.5">
                  {item.has_conflict ? (
                    <Badge variant="danger" size="sm">
                      Conflict
                    </Badge>
                  ) : item.date ? (
                    <Badge variant="success" size="sm">
                      Valid
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      Unscheduled
                    </Badge>
                  )}
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => onSelectAssignment(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Edit assignment"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
