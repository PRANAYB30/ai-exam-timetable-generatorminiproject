from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ExamBase(BaseModel):
    code: str = Field(..., example="CS301")
    name: str = Field(..., example="Operating Systems")
    student_group_codes: List[str] = Field(..., min_items=1, example=["CS-Y3"])
    student_count: int = Field(..., ge=1, example=60)
    duration_slots: int = Field(default=1, ge=1)
    permitted_dates: List[str] = Field(default_factory=list, example=[])  # Empty means all dates
    permitted_slots: List[int] = Field(default_factory=list, example=[])  # Empty means all slots
    required_room_type: Optional[str] = Field(None, example="Lecture Hall")
    required_facilities: List[str] = Field(default_factory=list, example=[])


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    student_group_codes: Optional[List[str]] = None
    student_count: Optional[int] = Field(None, ge=1)
    duration_slots: Optional[int] = Field(None, ge=1)
    permitted_dates: Optional[List[str]] = None
    permitted_slots: Optional[List[int]] = None
    required_room_type: Optional[str] = None
    required_facilities: Optional[List[str]] = None


class ExamResponse(ExamBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
