"""Student Groups CRUD API Endpoints."""
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.student_group import StudentGroupModel
from backend.app.schemas.student_group import (
    StudentGroupCreate,
    StudentGroupUpdate,
    StudentGroupResponse,
)

router = APIRouter(prefix="/groups", tags=["Student Groups"])


def _model_to_response(group: StudentGroupModel) -> StudentGroupResponse:
    return StudentGroupResponse(
        id=group.id,
        code=group.code,
        name=group.name,
        student_count=group.student_count,
        shared_conflict_groups=json.loads(group.shared_conflict_groups or "[]"),
        created_at=group.created_at,
    )


@router.get("", response_model=List[StudentGroupResponse])
def list_groups(db: Session = Depends(get_db)):
    groups = db.query(StudentGroupModel).order_by(StudentGroupModel.code).all()
    return [_model_to_response(g) for g in groups]


@router.post("", response_model=StudentGroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(payload: StudentGroupCreate, db: Session = Depends(get_db)):
    existing = db.query(StudentGroupModel).filter(StudentGroupModel.code == payload.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student group '{payload.code}' already exists.",
        )
    group = StudentGroupModel(
        code=payload.code,
        name=payload.name,
        student_count=payload.student_count,
        shared_conflict_groups=json.dumps(payload.shared_conflict_groups),
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    return _model_to_response(group)


@router.get("/{group_id}", response_model=StudentGroupResponse)
def get_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(StudentGroupModel).filter(StudentGroupModel.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")
    return _model_to_response(group)


@router.put("/{group_id}", response_model=StudentGroupResponse)
def update_group(group_id: int, payload: StudentGroupUpdate, db: Session = Depends(get_db)):
    group = db.query(StudentGroupModel).filter(StudentGroupModel.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")

    if payload.code is not None and payload.code != group.code:
        existing = db.query(StudentGroupModel).filter(StudentGroupModel.code == payload.code).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Group code already in use.")
        group.code = payload.code

    if payload.name is not None:
        group.name = payload.name
    if payload.student_count is not None:
        group.student_count = payload.student_count
    if payload.shared_conflict_groups is not None:
        group.shared_conflict_groups = json.dumps(payload.shared_conflict_groups)

    db.commit()
    db.refresh(group)
    return _model_to_response(group)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(StudentGroupModel).filter(StudentGroupModel.id == group_id).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found.")
    db.delete(group)
    db.commit()
    return None
