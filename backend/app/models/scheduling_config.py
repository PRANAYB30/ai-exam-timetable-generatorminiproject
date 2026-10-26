"""Scheduling Configuration Model."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime
from backend.app.database import Base


class SchedulingConfigModel(Base):
    __tablename__ = "scheduling_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, default="Default Exam Period")
    academic_term = Column(String(100), default="Fall 2026 / Sem End")
    start_date = Column(String(10), nullable=False, default="2026-11-16")
    end_date = Column(String(10), nullable=False, default="2026-11-20")
    # Explicit list of permitted exam dates in YYYY-MM-DD
    dates = Column(Text, default='["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"]')
    
    # Soft constraint weights
    weight_gap = Column(Float, default=10.0)  # penalty for exams without minimum gap
    weight_distribution = Column(Float, default=5.0)  # penalty for uneven daily distribution
    weight_utilization = Column(Float, default=3.0)  # penalty for excessive unused room capacity
    
    # Search budget limits
    max_search_seconds = Column(Float, default=15.0)
    max_backtracks = Column(Integer, default=10000)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
