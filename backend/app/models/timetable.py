"""Timetable and Assignment Models."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base


class TimetableModel(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    academic_term = Column(String(100), default="Semester End")
    status = Column(String(50), default="SUCCESS")  # SUCCESS, INFEASIBLE, TIMEOUT, PARTIAL
    
    total_exams = Column(Integer, default=0)
    scheduled_exams = Column(Integer, default=0)
    hard_violations_count = Column(Integer, default=0)
    soft_penalty_score = Column(Float, default=0.0)
    
    # Solver execution metrics
    execution_time_ms = Column(Float, default=0.0)
    backtracks_count = Column(Integer, default=0)
    assignments_attempted = Column(Integer, default=0)
    constraint_checks_count = Column(Integer, default=0)
    
    # Detailed AI explanations & decisions stored as JSON text
    decision_logs = Column(Text, default="[]")
    conflict_reports = Column(Text, default="[]")
    ai_summary = Column(Text, default="{}")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    assignments = relationship("AssignmentModel", back_populates="timetable", cascade="all, delete-orphan")


class AssignmentModel(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    timetable_id = Column(Integer, ForeignKey("timetables.id", ondelete="CASCADE"), nullable=False, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id"), nullable=False)
    
    date = Column(String(10), nullable=True)  # YYYY-MM-DD
    slot_id = Column(Integer, nullable=True)  # Foreign key or slot number
    room_id = Column(Integer, nullable=True)  # Room id
    
    is_locked = Column(Boolean, default=False)
    has_conflict = Column(Boolean, default=False)
    conflict_reason = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    timetable = relationship("TimetableModel", back_populates="assignments")
