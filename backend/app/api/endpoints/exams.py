"""Exams CRUD API Endpoints."""
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.exam import ExamModel
from backend.app.schemas.exam import ExamCreate, ExamUpdate, ExamResponse

router = APIRouter(prefix="/exams", tags=["Examinations"])


def _model_to_response(exam: ExamModel) -> ExamResponse:
    return ExamResponse(
        id=exam.id,
        code=exam.code,
        name=exam.name,
        student_group_codes=json.loads(exam.student_group_codes or "[]"),
        student_count=exam.student_count,
        duration_slots=exam.duration_slots,
        permitted_dates=json.loads(exam.permitted_dates or "[]"),
        permitted_slots=json.loads(exam.permitted_slots or "[]"),
        required_room_type=exam.required_room_type,
        required_facilities=json.loads(exam.required_facilities or "[]"),
        created_at=exam.created_at,
    )


@router.get("", response_model=List[ExamResponse])
def list_exams(
    search: Optional[str] = Query(None, description="Search by code or name"),
    db: Session = Depends(get_db),
):
    query = db.query(ExamModel)
    if search:
        search_filter = f"%{search}%"
        query = query.filter((ExamModel.code.ilike(search_filter)) | (ExamModel.name.ilike(search_filter)))
    exams = query.order_by(ExamModel.code).all()
    return [_model_to_response(e) for e in exams]


@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(payload: ExamCreate, db: Session = Depends(get_db)):
    existing = db.query(ExamModel).filter(ExamModel.code == payload.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Exam with code '{payload.code}' already exists.",
        )
    exam = ExamModel(
        code=payload.code,
        name=payload.name,
        student_group_codes=json.dumps(payload.student_group_codes),
        student_count=payload.student_count,
        duration_slots=payload.duration_slots,
        permitted_dates=json.dumps(payload.permitted_dates),
        permitted_slots=json.dumps(payload.permitted_slots),
        required_room_type=payload.required_room_type,
        required_facilities=json.dumps(payload.required_facilities),
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return _model_to_response(exam)


@router.get("/{exam_id}", response_model=ExamResponse)
def get_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(ExamModel).filter(ExamModel.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found.")
    return _model_to_response(exam)


@router.put("/{exam_id}", response_model=ExamResponse)
def update_exam(exam_id: int, payload: ExamUpdate, db: Session = Depends(get_db)):
    exam = db.query(ExamModel).filter(ExamModel.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found.")

    if payload.code is not None:
        if payload.code != exam.code:
            existing = db.query(ExamModel).filter(ExamModel.code == payload.code).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject code already taken.")
        exam.code = payload.code

    if payload.name is not None:
        exam.name = payload.name
    if payload.student_group_codes is not None:
        exam.student_group_codes = json.dumps(payload.student_group_codes)
    if payload.student_count is not None:
        exam.student_count = payload.student_count
    if payload.duration_slots is not None:
        exam.duration_slots = payload.duration_slots
    if payload.permitted_dates is not None:
        exam.permitted_dates = json.dumps(payload.permitted_dates)
    if payload.permitted_slots is not None:
        exam.permitted_slots = json.dumps(payload.permitted_slots)
    if payload.required_room_type is not None:
        exam.required_room_type = payload.required_room_type
    if payload.required_facilities is not None:
        exam.required_facilities = json.dumps(payload.required_facilities)

    db.commit()
    db.refresh(exam)
    return _model_to_response(exam)


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(ExamModel).filter(ExamModel.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found.")
    db.delete(exam)
    db.commit()
    return None
