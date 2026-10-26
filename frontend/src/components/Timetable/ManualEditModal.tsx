import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { AssignmentItem, Room, TimeSlot } from '../../types';
import { Lock, Unlock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ManualEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: AssignmentItem | null;
  rooms: Room[];
  slots: TimeSlot[];
  dates: string[];
  onSave: (data: {
    date?: string;
    slot_id?: number;
    room_id?: number;
    is_locked?: boolean;
  }) => Promise<void>;
}

export const ManualEditModal: React.FC<ManualEditModalProps> = ({
  isOpen,
  onClose,
  assignment,
  rooms,
  slots,
  dates,
  onSave,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [selectedRoom, setSelectedRoom] = useState<number>(1);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (assignment) {
      setSelectedDate(assignment.date || dates[0] || '');
      setSelectedSlot(assignment.slot_id || (slots[0]?.id ?? 1));
      setSelectedRoom(assignment.room_id || (rooms[0]?.id ?? 1));
      setIsLocked(assignment.is_locked);
    }
  }, [assignment, dates, slots, rooms]);

  if (!assignment) return null;

  const currentRoom = rooms.find((r) => r.id === selectedRoom);
  const isCapacityIssue = currentRoom && currentRoom.capacity < assignment.student_count;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        date: selectedDate,
        slot_id: selectedSlot,
        room_id: selectedRoom,
        is_locked: isLocked,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Assignment: ${assignment.exam_code}`}
      subtitle={`${assignment.exam_name} (${assignment.student_count} students)`}
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Examination Info */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">Student Groups:</span>
            <span className="font-semibold text-white">
              {assignment.student_group_codes.join(', ')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total Students:</span>
            <span className="font-semibold text-white">{assignment.student_count} candidates</span>
          </div>
        </div>

        {/* Date Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Examination Date
          </label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {dates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Time Slot Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Time Slot</label>
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {slots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.start_time} - {s.end_time})
              </option>
            ))}
          </select>
        </div>

        {/* Room Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Assigned Room / Venue
          </label>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.room_number} — {r.name} (Cap: {r.capacity}, {r.room_type})
              </option>
            ))}
          </select>
        </div>

        {/* Capacity Warning Banner */}
        {isCapacityIssue && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold">Capacity Deficit Warning:</span> Room capacity is{' '}
              {currentRoom?.capacity}, which is less than the exam student count of{' '}
              {assignment.student_count}. Saving will introduce a hard conflict.
            </div>
          </div>
        )}

        {/* Lock Assignment Toggle */}
        <div className="pt-2 border-t border-slate-800">
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800/80 transition-colors">
            <input
              type="checkbox"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                {isLocked ? (
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Unlock className="h-3.5 w-3.5 text-slate-400" />
                )}
                <span>Lock this assignment</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Locked exams cannot be moved or altered when running AI repair.
              </p>
            </div>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isSaving ? 'Validating...' : 'Save & Revalidate'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
