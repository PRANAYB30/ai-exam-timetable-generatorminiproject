"""Rooms CRUD API Endpoints."""
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.room import RoomModel
from backend.app.schemas.room import RoomCreate, RoomUpdate, RoomResponse

router = APIRouter(prefix="/rooms", tags=["Rooms"])


def _model_to_response(room: RoomModel) -> RoomResponse:
    return RoomResponse(
        id=room.id,
        room_number=room.room_number,
        name=room.name,
        capacity=room.capacity,
        room_type=room.room_type,
        facilities=json.loads(room.facilities or "[]"),
        available_dates=json.loads(room.available_dates or "[]"),
        unavailable_slots=json.loads(room.unavailable_slots or "[]"),
        is_active=room.is_active,
        created_at=room.created_at,
    )


@router.get("", response_model=List[RoomResponse])
def list_rooms(
    room_type: Optional[str] = Query(None),
    min_capacity: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(RoomModel)
    if room_type:
        query = query.filter(RoomModel.room_type == room_type)
    if min_capacity is not None:
        query = query.filter(RoomModel.capacity >= min_capacity)
    rooms = query.order_by(RoomModel.room_number).all()
    return [_model_to_response(r) for r in rooms]


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(payload: RoomCreate, db: Session = Depends(get_db)):
    existing = db.query(RoomModel).filter(RoomModel.room_number == payload.room_number).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Room with number '{payload.room_number}' already exists.",
        )
    room = RoomModel(
        room_number=payload.room_number,
        name=payload.name,
        capacity=payload.capacity,
        room_type=payload.room_type,
        facilities=json.dumps(payload.facilities),
        available_dates=json.dumps(payload.available_dates),
        unavailable_slots=json.dumps(payload.unavailable_slots),
        is_active=payload.is_active,
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return _model_to_response(room)


@router.get("/{room_id}", response_model=RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found.")
    return _model_to_response(room)


@router.put("/{room_id}", response_model=RoomResponse)
def update_room(room_id: int, payload: RoomUpdate, db: Session = Depends(get_db)):
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found.")

    if payload.room_number is not None and payload.room_number != room.room_number:
        existing = db.query(RoomModel).filter(RoomModel.room_number == payload.room_number).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Room number already in use.")
        room.room_number = payload.room_number

    if payload.name is not None:
        room.name = payload.name
    if payload.capacity is not None:
        room.capacity = payload.capacity
    if payload.room_type is not None:
        room.room_type = payload.room_type
    if payload.facilities is not None:
        room.facilities = json.dumps(payload.facilities)
    if payload.available_dates is not None:
        room.available_dates = json.dumps(payload.available_dates)
    if payload.unavailable_slots is not None:
        room.unavailable_slots = json.dumps(payload.unavailable_slots)
    if payload.is_active is not None:
        room.is_active = payload.is_active

    db.commit()
    db.refresh(room)
    return _model_to_response(room)


@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found.")
    db.delete(room)
    db.commit()
    return None
