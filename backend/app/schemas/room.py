from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class RoomBase(BaseModel):
    room_number: str = Field(..., example="LH-101")
    name: str = Field(..., example="Lecture Hall 101")
    capacity: int = Field(..., ge=1, example=80)
    room_type: str = Field(default="Classroom", example="Lecture Hall")
    facilities: List[str] = Field(default_factory=list, example=["Projector", "Audio System"])
    available_dates: List[str] = Field(default_factory=list, example=[])  # Empty means all dates allowed
    unavailable_slots: List[str] = Field(default_factory=list, example=[])  # E.g. ["2026-11-16:1"]
    is_active: bool = True


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    name: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=1)
    room_type: Optional[str] = None
    facilities: Optional[List[str]] = None
    available_dates: Optional[List[str]] = None
    unavailable_slots: Optional[List[str]] = None
    is_active: Optional[bool] = None


class RoomResponse(RoomBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
