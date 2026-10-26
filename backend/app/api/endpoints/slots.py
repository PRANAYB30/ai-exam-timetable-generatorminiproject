"""Time Slots CRUD API Endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.time_slot import TimeSlotModel
from backend.app.schemas.time_slot import (
    TimeSlotCreate,
    TimeSlotUpdate,
    TimeSlotResponse,
)

router = APIRouter(prefix="/slots", tags=["Time Slots"])


@router.get("", response_model=List[TimeSlotResponse])
def list_slots(db: Session = Depends(get_db)):
    slots = db.query(TimeSlotModel).order_by(TimeSlotModel.slot_number).all()
    return slots


@router.post("", response_model=TimeSlotResponse, status_code=status.HTTP_201_CREATED)
def create_slot(payload: TimeSlotCreate, db: Session = Depends(get_db)):
    existing = db.query(TimeSlotModel).filter(TimeSlotModel.slot_number == payload.slot_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Slot number {payload.slot_number} already exists.",
        )
    slot = TimeSlotModel(**payload.model_dump())
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


@router.put("/{slot_id}", response_model=TimeSlotResponse)
def update_slot(slot_id: int, payload: TimeSlotUpdate, db: Session = Depends(get_db)):
    slot = db.query(TimeSlotModel).filter(TimeSlotModel.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found.")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(slot, k, v)

    db.commit()
    db.refresh(slot)
    return slot


@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_slot(slot_id: int, db: Session = Depends(get_db)):
    slot = db.query(TimeSlotModel).filter(TimeSlotModel.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found.")
    db.delete(slot)
    db.commit()
    return None
