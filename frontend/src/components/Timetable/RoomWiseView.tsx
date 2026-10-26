import React, { useState } from 'react';
import { AssignmentItem, Room, TimeSlot } from '../../types';
import { Building2, Calendar, Users, AlertCircle } from 'lucide-react';

interface RoomWiseViewProps {
  assignments: AssignmentItem[];
  rooms: Room[];
  slots: TimeSlot[];
  dates: string[];
  onSelectAssignment: (assignment: AssignmentItem) => void;
}

export const RoomWiseView: React.FC<RoomWiseViewProps> = ({
  assignments,
  rooms,
  slots,
  dates,
  onSelectAssignment,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(dates[0] || '');

  // Map: (room_id, slot_id) on selectedDate -> list of assignments
  const allocationMap = new Map<string, AssignmentItem[]>();

  assignments
    .filter((a) => a.date === selectedDate)
    .forEach((a) => {
      if (a.room_id && a.slot_id) {
        const key = `${a.room_id}:${a.slot_id}`;
        if (!allocationMap.has(key)) {
          allocationMap.set(key, []);
        }
        allocationMap.get(key)!.push(a);
      }
    });

  return (
    <div className="space-y-4">
      {/* Date Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-2">
          <Calendar className="h-4 w-4 text-indigo-400" />
          Filter Date:
        </span>
        {dates.map((date) => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedDate === date
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {date}
          </button>
        ))}
      </div>

      {/* Room Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-md">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80">
              <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 w-52 border-r border-slate-800">
                Room Venue
              </th>
              {slots.map((slot) => (
                <th
                  key={slot.id}
                  className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-300 border-r border-slate-800 last:border-r-0 min-w-[240px]"
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
            {rooms.map((room) => (
              <tr key={room.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 align-top border-r border-slate-800 bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-white">{room.room_number}</div>
                      <div className="text-[11px] text-slate-400">{room.name}</div>
                      <div className="mt-1 text-[10px] text-indigo-400 font-medium">
                        Cap: {room.capacity} • {room.room_type}
                      </div>
                    </div>
                  </div>
                </td>

                {slots.map((slot) => {
                  const key = `${room.id}:${slot.id}`;
                  const items = allocationMap.get(key) || [];
                  const isCollision = items.length > 1;

                  return (
                    <td
                      key={slot.id}
                      className={`p-3 align-top border-r border-slate-800 last:border-r-0 ${
                        isCollision ? 'bg-rose-500/10' : ''
                      }`}
                    >
                      {items.length === 0 ? (
                        <div className="h-14 rounded-lg border border-dashed border-slate-800/60 flex items-center justify-center text-[11px] text-slate-600">
                          Vacant
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {isCollision && (
                            <div className="flex items-center gap-1 text-[11px] text-rose-400 font-bold">
                              <AlertCircle className="h-3.5 w-3.5" />
                              <span>Overbooked ({items.length} exams)</span>
                            </div>
                          )}
                          {items.map((item) => {
                            const isCapDeficit = room.capacity < item.student_count;
                            return (
                              <div
                                key={item.exam_id}
                                onClick={() => onSelectAssignment(item)}
                                className={`p-2.5 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${
                                  isCapDeficit || item.has_conflict
                                    ? 'bg-rose-500/20 border-rose-500/40'
                                    : 'bg-slate-800 border-slate-700 hover:border-indigo-500'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-xs text-white">
                                    {item.exam_code}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {item.student_count} / {room.capacity} seats
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-300 truncate mt-0.5">
                                  {item.exam_name}
                                </div>
                                <div className="text-[10px] text-indigo-300 mt-1 flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>{item.student_group_codes.join(', ')}</span>
                                </div>
                              </div>
                            );
                          })}
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
