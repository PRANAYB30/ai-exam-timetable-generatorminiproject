from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TimeSlotBase(BaseModel):
    slot_number: int = Field(..., ge=1, example=1)
    name: str = Field(..., example="Morning Slot (09:30 - 12:30)")
    start_time: str = Field(..., example="09:30")
    end_time: str = Field(..., example="12:30")
    is_active: bool = True


class TimeSlotCreate(TimeSlotBase):
    pass


class TimeSlotUpdate(BaseModel):
    slot_number: Optional[int] = None
    name: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_active: Optional[bool] = None


class TimeSlotResponse(TimeSlotBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
