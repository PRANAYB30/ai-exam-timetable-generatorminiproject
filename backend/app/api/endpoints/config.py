"""Scheduling Configuration API Endpoints."""
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.scheduling_config import SchedulingConfigModel
from backend.app.schemas.config import (
    SchedulingConfigCreate,
    SchedulingConfigUpdate,
    SchedulingConfigResponse,
)

router = APIRouter(prefix="/config", tags=["Configuration"])


def _model_to_response(cfg: SchedulingConfigModel) -> SchedulingConfigResponse:
    return SchedulingConfigResponse(
        id=cfg.id,
        name=cfg.name,
        academic_term=cfg.academic_term,
        start_date=cfg.start_date,
        end_date=cfg.end_date,
        dates=json.loads(cfg.dates or "[]"),
        weight_gap=cfg.weight_gap,
        weight_distribution=cfg.weight_distribution,
        weight_utilization=cfg.weight_utilization,
        max_search_seconds=cfg.max_search_seconds,
        max_backtracks=cfg.max_backtracks,
        is_active=cfg.is_active,
        created_at=cfg.created_at,
    )


@router.get("", response_model=SchedulingConfigResponse)
def get_active_config(db: Session = Depends(get_db)):
    cfg = db.query(SchedulingConfigModel).filter(SchedulingConfigModel.is_active == True).first()
    if not cfg:
        # Create default
        cfg = SchedulingConfigModel()
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return _model_to_response(cfg)


@router.put("", response_model=SchedulingConfigResponse)
def update_active_config(payload: SchedulingConfigUpdate, db: Session = Depends(get_db)):
    cfg = db.query(SchedulingConfigModel).filter(SchedulingConfigModel.is_active == True).first()
    if not cfg:
        cfg = SchedulingConfigModel()
        db.add(cfg)

    if payload.name is not None:
        cfg.name = payload.name
    if payload.academic_term is not None:
        cfg.academic_term = payload.academic_term
    if payload.start_date is not None:
        cfg.start_date = payload.start_date
    if payload.end_date is not None:
        cfg.end_date = payload.end_date
    if payload.dates is not None:
        cfg.dates = json.dumps(payload.dates)
    if payload.weight_gap is not None:
        cfg.weight_gap = payload.weight_gap
    if payload.weight_distribution is not None:
        cfg.weight_distribution = payload.weight_distribution
    if payload.weight_utilization is not None:
        cfg.weight_utilization = payload.weight_utilization
    if payload.max_search_seconds is not None:
        cfg.max_search_seconds = payload.max_search_seconds
    if payload.max_backtracks is not None:
        cfg.max_backtracks = payload.max_backtracks

    db.commit()
    db.refresh(cfg)
    return _model_to_response(cfg)


@router.get("/all", response_model=List[SchedulingConfigResponse])
def list_configs(db: Session = Depends(get_db)):
    configs = db.query(SchedulingConfigModel).order_by(SchedulingConfigModel.id.desc()).all()
    return [_model_to_response(c) for c in configs]
