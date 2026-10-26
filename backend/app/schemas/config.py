from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class SchedulingConfigBase(BaseModel):
    name: str = Field(default="Semester End Examinations")
    academic_term: str = Field(default="Fall 2026")
    start_date: str = Field(..., example="2026-11-16")
    end_date: str = Field(..., example="2026-11-20")
    dates: List[str] = Field(default_factory=list, example=["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"])
    
    weight_gap: float = Field(default=10.0, ge=0.0)
    weight_distribution: float = Field(default=5.0, ge=0.0)
    weight_utilization: float = Field(default=3.0, ge=0.0)
    
    max_search_seconds: float = Field(default=15.0, ge=0.5, le=120.0)
    max_backtracks: int = Field(default=10000, ge=100, le=200000)
    is_active: bool = True


class SchedulingConfigCreate(SchedulingConfigBase):
    pass


class SchedulingConfigUpdate(BaseModel):
    name: Optional[str] = None
    academic_term: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    dates: Optional[List[str]] = None
    weight_gap: Optional[float] = None
    weight_distribution: Optional[float] = None
    weight_utilization: Optional[float] = None
    max_search_seconds: Optional[float] = None
    max_backtracks: Optional[int] = None
    is_active: Optional[bool] = None


class SchedulingConfigResponse(SchedulingConfigBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
