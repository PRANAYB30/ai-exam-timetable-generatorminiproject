from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class StudentGroupBase(BaseModel):
    code: str = Field(..., example="CS-Y3")
    name: str = Field(..., example="Computer Science Year 3")
    student_count: int = Field(..., ge=1, example=60)
    shared_conflict_groups: List[str] = Field(default_factory=list, example=["IT-Y3"])


class StudentGroupCreate(StudentGroupBase):
    pass


class StudentGroupUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    student_count: Optional[int] = Field(None, ge=1)
    shared_conflict_groups: Optional[List[str]] = None


class StudentGroupResponse(StudentGroupBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
