export interface UserProfile {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'STUDENT' | 'GUEST';
  designation: string;
  department: string;
  staff_id: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface StudentGroup {
  id: number;
  code: string;
  name: string;
  student_count: number;
  shared_conflict_groups: string[];
  created_at?: string;
}

export interface Room {
  id: number;
  room_number: string;
  name: string;
  capacity: number;
  room_type: string;
  facilities: string[];
  available_dates: string[];
  unavailable_slots: string[];
  is_active: boolean;
  created_at?: string;
}

export interface TimeSlot {
  id: number;
  slot_number: number;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface Exam {
  id: number;
  code: string;
  name: string;
  student_group_codes: string[];
  student_count: number;
  duration_slots: number;
  permitted_dates: string[];
  permitted_slots: number[];
  required_room_type?: string | null;
  required_facilities: string[];
  created_at?: string;
}

export interface SchedulingConfig {
  id?: number;
  name: string;
  academic_term: string;
  start_date: string;
  end_date: string;
  dates: string[];
  weight_gap: number;
  weight_distribution: number;
  weight_utilization: number;
  max_search_seconds: number;
  max_backtracks: number;
  is_active?: boolean;
}

export interface AssignmentItem {
  id?: number;
  exam_id: number;
  exam_code: string;
  exam_name: string;
  student_group_codes: string[];
  student_count: number;
  date?: string | null;
  slot_id?: number | null;
  slot_name?: string | null;
  slot_start?: string | null;
  slot_end?: string | null;
  room_id?: number | null;
  room_number?: string | null;
  room_name?: string | null;
  room_capacity?: number | null;
  room_type?: string | null;
  is_locked: boolean;
  has_conflict: boolean;
  conflict_reason?: string | null;
}

export interface ConflictItem {
  type: string;
  severity: string;
  message: string;
  affected_exam_ids: number[];
  affected_exam_codes: string[];
  suggested_action: string;
}

export interface AIDecisionLog {
  step: number;
  event: string;
  exam_code?: string | null;
  reason: string;
  details?: Record<string, any> | null;
}

export interface Timetable {
  id: number;
  name: string;
  academic_term: string;
  status: 'SUCCESS' | 'INFEASIBLE' | 'TIMEOUT' | 'PARTIAL';
  total_exams: number;
  scheduled_exams: number;
  hard_violations_count: number;
  soft_penalty_score: number;
  execution_time_ms: number;
  backtracks_count: number;
  assignments_attempted: number;
  constraint_checks_count: number;
  assignments: AssignmentItem[];
  conflict_reports: ConflictItem[];
  decision_logs: AIDecisionLog[];
  ai_summary: Record<string, any>;
  created_at?: string;
}

export interface DashboardData {
  total_exams: number;
  total_rooms: number;
  total_slots: number;
  total_groups: number;
  latest_timetable: {
    id: number | null;
    name: string | null;
    status: string;
    scheduled_exams: number;
    total_exams: number;
    hard_violations_count: number;
    soft_penalty_score: number;
    execution_time_ms: number;
    backtracks_count: number;
    room_utilization_percent: number;
    day_distribution: Record<string, number>;
    room_utilization_data: Array<{
      room_number: string;
      room_name: string;
      capacity: number;
      sessions_scheduled: number;
    }>;
  } | null;
  recent_timetables: Array<{
    id: number;
    name: string;
    academic_term: string;
    status: string;
    scheduled_exams: number;
    total_exams: number;
    hard_violations_count: number;
    soft_penalty_score: number;
    execution_time_ms: number;
    backtracks_count: number;
    created_at: string;
  }>;
}
