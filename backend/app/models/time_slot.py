"""Time Slot Model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from backend.app.database import Base


class TimeSlotModel(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    slot_number = Column(Integer, nullable=False, unique=True)
    name = Column(String(100), nullable=False)  # e.g., "Morning Slot", "Afternoon Slot"
    start_time = Column(String(10), nullable=False)  # HH:MM format, e.g. "09:30"
    end_time = Column(String(10), nullable=False)  # HH:MM format, e.g. "12:30"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
