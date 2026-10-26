"""Examination Model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from backend.app.database import Base


class ExamModel(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    student_group_codes = Column(Text, nullable=False, default="[]")  # JSON list of student group codes
    student_count = Column(Integer, nullable=False, default=30)
    duration_slots = Column(Integer, default=1)
    permitted_dates = Column(Text, default="[]")  # JSON list of YYYY-MM-DD; empty means any date
    permitted_slots = Column(Text, default="[]")  # JSON list of slot_ids; empty means any slot
    required_room_type = Column(String(50), nullable=True)  # e.g., "Computer Lab", "Lecture Hall"
    required_facilities = Column(Text, default="[]")  # JSON list, e.g. ["Computers"]
    created_at = Column(DateTime, default=datetime.utcnow)
