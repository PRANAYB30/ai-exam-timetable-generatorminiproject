from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class AssignmentItem(BaseModel):
    id: Optional[int] = None
    exam_id: int
    exam_code: str
    exam_name: str
    student_group_codes: List[str]
    student_count: int
    
    date: Optional[str] = None
    slot_id: Optional[int] = None
    slot_name: Optional[str] = None
    slot_start: Optional[str] = None
    slot_end: Optional[str] = None
    
    room_id: Optional[int] = None
    room_number: Optional[str] = None
    room_name: Optional[str] = None
    room_capacity: Optional[int] = None
    room_type: Optional[str] = None
    
    is_locked: bool = False
    has_conflict: bool = False
    conflict_reason: Optional[str] = None


class ConflictItem(BaseModel):
    type: str  # STUDENT_GROUP_CLASH, ROOM_OVERBOOKING, CAPACITY_DEFICIT, FACILITY_MISMATCH, DATE_SLOT_UNAVAILABLE, UNSCHEDULED_EXAM
    severity: str  # HARD, SOFT
    message: str
    affected_exam_ids: List[int]
    affected_exam_codes: List[str]
    suggested_action: str


class AIDecisionLog(BaseModel):
    step: int
    event: str  # SELECT_VARIABLE, EVALUATE_VALUE, ASSIGN, FORWARD_CHECK, BACKTRACK, DEAD_END, PRUNE
    exam_code: Optional[str] = None
    reason: str
    details: Optional[Dict[str, Any]] = None


class GenerateTimetableRequest(BaseModel):
    name: Optional[str] = None
    academic_term: Optional[str] = None
    config_id: Optional[int] = None
    enforce_locked: bool = True


class AssignmentUpdateRequest(BaseModel):
    date: Optional[str] = None
    slot_id: Optional[int] = None
    room_id: Optional[int] = None
    is_locked: Optional[bool] = None


class RepairTimetableRequest(BaseModel):
    keep_locked: bool = True


class ValidationResponse(BaseModel):
    is_valid: bool
    hard_violations_count: int
    soft_penalty_score: float
    conflicts: List[ConflictItem]
    summary: str


class TimetableResponse(BaseModel):
    id: int
    name: str
    academic_term: str
    status: str
    total_exams: int
    scheduled_exams: int
    hard_violations_count: int
    soft_penalty_score: float
    
    execution_time_ms: float
    backtracks_count: int
    assignments_attempted: int
    constraint_checks_count: int
    
    assignments: List[AssignmentItem] = []
    conflict_reports: List[ConflictItem] = []
    decision_logs: List[AIDecisionLog] = []
    ai_summary: Dict[str, Any] = {}
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
