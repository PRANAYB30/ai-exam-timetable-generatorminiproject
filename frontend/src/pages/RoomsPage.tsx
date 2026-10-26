import React, { useState } from 'react';
import { Room } from '../types';
import { api } from '../services/api';
import { Modal } from '../components/Common/Modal';
import { Badge } from '../components/Common/Badge';
import {
  Building2,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Sliders,
  Check,
  X,
} from 'lucide-react';

interface RoomsPageProps {
  rooms: Room[];
  onRefresh: () => Promise<void>;
  addToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const RoomsPage: React.FC<RoomsPageProps> = ({ rooms, onRefresh, addToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [roomNumber, setRoomNumber] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(80);
  const [roomType, setRoomType] = useState('Lecture Hall');
  const [facilities, setFacilities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableFacilities = ['Projector', 'Computers', 'Audio System', 'AC', 'Whiteboard'];

  const openCreateModal = () => {
    setEditingRoom(null);
    setRoomNumber('');
    setName('');
    setCapacity(80);
    setRoomType('Lecture Hall');
    setFacilities(['Projector']);
    setIsModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setRoomNumber(room.room_number);
    setName(room.name);
    setCapacity(room.capacity);
    setRoomType(room.room_type);
    setFacilities(room.facilities || []);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      addToast('error', 'Validation Error', 'Room number is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRoom) {
        await api.updateRoom(editingRoom.id, {
          room_number: roomNumber.trim(),
          name: name.trim() || roomNumber.trim(),
          capacity: Number(capacity),
          room_type: roomType,
          facilities: facilities,
        });
        addToast('success', 'Room Updated', `Room ${roomNumber} updated.`);
      } else {
        await api.createRoom({
          room_number: roomNumber.trim(),
          name: name.trim() || roomNumber.trim(),
          capacity: Number(capacity),
          room_type: roomType,
          facilities: facilities,
          available_dates: [],
          unavailable_slots: [],
          is_active: true,
        });
        addToast('success', 'Room Added', `Room ${roomNumber} added to venues.`);
      }
      await onRefresh();
      setIsModalOpen(false);
    } catch (err: any) {
      addToast('error', 'Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, number: string) => {
    if (!confirm(`Delete venue ${number}?`)) return;
    try {
      await api.deleteRoom(id);
      addToast('info', 'Venue Deleted', `Room ${number} removed.`);
      await onRefresh();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Examination Rooms & Venues</h1>
            <p className="text-xs text-slate-400">
              Manage physical exam halls, computer labs, capacities, and specialized facilities.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Room Venue</span>
        </button>
      </div>

      {/* Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-bold text-sm text-white">{room.room_number}</span>
                  <h3 className="text-xs text-slate-300 font-medium mt-0.5">{room.name}</h3>
                </div>
                <Badge variant="cyan" size="sm">
                  {room.room_type}
                </Badge>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs py-2 border-y border-slate-800">
                <span className="text-slate-400">Seating Capacity:</span>
                <span className="font-bold text-indigo-300 text-sm">{room.capacity} seats</span>
              </div>

              {/* Facilities Tags */}
              <div className="mt-3">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1.5">
                  Available Facilities:
                </span>
                <div className="flex flex-wrap gap-1">
                  {room.facilities && room.facilities.length > 0 ? (
                    room.facilities.map((f) => (
                      <span
                        key={f}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        ✓ {f}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">Standard Desks</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end gap-2">
              <button
                onClick={() => openEditModal(room)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDelete(room.id, room.room_number)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Room Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? `Edit Room: ${editingRoom.room_number}` : 'Add Examination Venue'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Room Number / Code
              </label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. LH-101"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Seating Capacity
              </label>
              <input
                type="number"
                required
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Venue Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Academic Lecture Hall"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Venue Type</label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Lecture Hall">Lecture Hall</option>
              <option value="Computer Lab">Computer Lab</option>
              <option value="Auditorium">Auditorium</option>
              <option value="Classroom">Classroom</option>
              <option value="Seminar Hall">Seminar Hall</option>
              <option value="Drawing Hall">Drawing Hall</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Facilities</label>
            <div className="flex flex-wrap gap-2 pt-1">
              {availableFacilities.map((facility) => {
                const isSelected = facilities.includes(facility);
                return (
                  <button
                    type="button"
                    key={facility}
                    onClick={() => {
                      if (isSelected) setFacilities(facilities.filter((f) => f !== facility));
                      else setFacilities([...facilities, facility]);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {facility}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Saving...' : editingRoom ? 'Update Room' : 'Add Room'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
