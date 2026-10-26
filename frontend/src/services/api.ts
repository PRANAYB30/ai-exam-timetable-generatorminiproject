import {
  Exam,
  Room,
  StudentGroup,
  TimeSlot,
  SchedulingConfig,
  Timetable,
  DashboardData,
  ConflictItem,
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Health
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<{ status: string; service: string }>(res);
  },

  // Dashboard
  getDashboard: async (): Promise<DashboardData> => {
    const res = await fetch(`${API_BASE}/dashboard`);
    return handleResponse<DashboardData>(res);
  },

  // Examinations
  getExams: async (search?: string): Promise<Exam[]> => {
    const url = search ? `${API_BASE}/exams?search=${encodeURIComponent(search)}` : `${API_BASE}/exams`;
    const res = await fetch(url);
    return handleResponse<Exam[]>(res);
  },
  createExam: async (exam: Omit<Exam, 'id' | 'created_at'>): Promise<Exam> => {
    const res = await fetch(`${API_BASE}/exams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam),
    });
    return handleResponse<Exam>(res);
  },
  updateExam: async (id: number, exam: Partial<Exam>): Promise<Exam> => {
    const res = await fetch(`${API_BASE}/exams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exam),
    });
    return handleResponse<Exam>(res);
  },
  deleteExam: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/exams/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Failed to delete exam ${id}`);
    }
  },

  // Student Groups
  getGroups: async (): Promise<StudentGroup[]> => {
    const res = await fetch(`${API_BASE}/groups`);
    return handleResponse<StudentGroup[]>(res);
  },
  createGroup: async (group: Omit<StudentGroup, 'id' | 'created_at'>): Promise<StudentGroup> => {
    const res = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group),
    });
    return handleResponse<StudentGroup>(res);
  },
  updateGroup: async (id: number, group: Partial<StudentGroup>): Promise<StudentGroup> => {
    const res = await fetch(`${API_BASE}/groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group),
    });
    return handleResponse<StudentGroup>(res);
  },
  deleteGroup: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/groups/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Failed to delete student group ${id}`);
    }
  },

  // Rooms
  getRooms: async (roomType?: string, minCapacity?: number): Promise<Room[]> => {
    const params = new URLSearchParams();
    if (roomType) params.append('room_type', roomType);
    if (minCapacity) params.append('min_capacity', minCapacity.toString());
    const res = await fetch(`${API_BASE}/rooms?${params.toString()}`);
    return handleResponse<Room[]>(res);
  },
  createRoom: async (room: Omit<Room, 'id' | 'created_at'>): Promise<Room> => {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(room),
    });
    return handleResponse<Room>(res);
  },
  updateRoom: async (id: number, room: Partial<Room>): Promise<Room> => {
    const res = await fetch(`${API_BASE}/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(room),
    });
    return handleResponse<Room>(res);
  },
  deleteRoom: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/rooms/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Failed to delete room ${id}`);
    }
  },

  // Time Slots
  getSlots: async (): Promise<TimeSlot[]> => {
    const res = await fetch(`${API_BASE}/slots`);
    return handleResponse<TimeSlot[]>(res);
  },
  createSlot: async (slot: Omit<TimeSlot, 'id'>): Promise<TimeSlot> => {
    const res = await fetch(`${API_BASE}/slots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slot),
    });
    return handleResponse<TimeSlot>(res);
  },
  updateSlot: async (id: number, slot: Partial<TimeSlot>): Promise<TimeSlot> => {
    const res = await fetch(`${API_BASE}/slots/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slot),
    });
    return handleResponse<TimeSlot>(res);
  },
  deleteSlot: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/slots/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Failed to delete slot ${id}`);
    }
  },

  // Configuration
  getConfig: async (): Promise<SchedulingConfig> => {
    const res = await fetch(`${API_BASE}/config`);
    return handleResponse<SchedulingConfig>(res);
  },
  updateConfig: async (config: Partial<SchedulingConfig>): Promise<SchedulingConfig> => {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return handleResponse<SchedulingConfig>(res);
  },

  // Timetables
  generateTimetable: async (payload: {
    name?: string;
    academic_term?: string;
    config_id?: number;
    enforce_locked?: boolean;
  }): Promise<Timetable> => {
    const res = await fetch(`${API_BASE}/timetables/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Timetable>(res);
  },
  getTimetables: async (): Promise<Timetable[]> => {
    const res = await fetch(`${API_BASE}/timetables`);
    return handleResponse<Timetable[]>(res);
  },
  getTimetable: async (id: number): Promise<Timetable> => {
    const res = await fetch(`${API_BASE}/timetables/${id}`);
    return handleResponse<Timetable>(res);
  },
  validateTimetable: async (id: number): Promise<{
    is_valid: boolean;
    hard_violations_count: number;
    soft_penalty_score: number;
    conflicts: ConflictItem[];
    summary: string;
  }> => {
    const res = await fetch(`${API_BASE}/timetables/${id}/validate`, {
      method: 'POST',
    });
    return handleResponse(res);
  },
  updateAssignment: async (
    timetableId: number,
    assignmentId: number,
    data: {
      date?: string;
      slot_id?: number;
      room_id?: number;
      is_locked?: boolean;
    }
  ): Promise<Timetable> => {
    const res = await fetch(`${API_BASE}/timetables/${timetableId}/assignments/${assignmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Timetable>(res);
  },
  repairTimetable: async (id: number, keepLocked: boolean = true): Promise<Timetable> => {
    const res = await fetch(`${API_BASE}/timetables/${id}/repair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keep_locked: keepLocked }),
    });
    return handleResponse<Timetable>(res);
  },
  deleteTimetable: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/timetables/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) {
      throw new Error(`Failed to delete timetable ${id}`);
    }
  },
  getExportCsvUrl: (id: number) => `${API_BASE}/timetables/${id}/export/csv`,

  // Demo Data
  loadDemoData: async (autoGenerate: boolean = true): Promise<{
    message: string;
    auto_generated: boolean;
    timetable_id?: number;
  }> => {
    const res = await fetch(`${API_BASE}/demo/load?auto_generate=${autoGenerate}`, {
      method: 'POST',
    });
    return handleResponse(res);
  },
  resetDatabase: async (): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    return handleResponse(res);
  },

  // CSV Import
  importCsv: async (entityType: 'exams' | 'rooms' | 'groups', file: File): Promise<{
    success: boolean;
    imported_count: number;
    errors: Array<{ row: number; error: string }>;
  }> => {
    const formData = new FormData();
    formData.append('entity_type', entityType);
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/import/csv`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },
};
