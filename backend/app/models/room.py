"""Room Model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from backend.app.database import Base


class RoomModel(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    capacity = Column(Integer, nullable=False)
    room_type = Column(String(50), nullable=False, default="Classroom")  # Classroom, Lecture Hall, Computer Lab, Drawing Hall
    facilities = Column(Text, default="[]")  # JSON list, e.g. ["Projector", "Computers", "Audio System"]
    available_dates = Column(Text, default="[]")  # JSON list of YYYY-MM-DD dates; empty means all dates
    unavailable_slots = Column(Text, default="[]")  # JSON list of "YYYY-MM-DD:slot_id" pairs that are restricted
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
