"""Student Group Model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from backend.app.database import Base


class StudentGroupModel(Base):
    __tablename__ = "student_groups"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    student_count = Column(Integer, nullable=False, default=30)
    # JSON list of group codes or IDs with which this group shares students (cannot take exams at same time)
    shared_conflict_groups = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)
