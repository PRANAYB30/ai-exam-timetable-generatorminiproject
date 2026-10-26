"""Timetables and Assignments API Endpoints."""
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.timetable import TimetableModel, AssignmentModel
from backend.app.models.exam import ExamModel
from backend.app.models.room import RoomModel
from backend.app.models.time_slot import TimeSlotModel
from backend.app.schemas.timetable import (
    TimetableResponse,
    AssignmentItem,
    ConflictItem,
    AIDecisionLog,
    GenerateTimetableRequest,
    AssignmentUpdateRequest,
    RepairTimetableRequest,
    ValidationResponse,
)
from backend.app.services.timetable_service import (
    generate_timetable,
    revalidate_timetable,
    update_assignment,
    repair_existing_timetable,
    export_timetable_to_csv,
)

router = APIRouter(prefix="/timetables", tags=["Timetables"])


def _build_timetable_response(tt: TimetableModel, db: Session) -> TimetableResponse:
    exams = {e.id: e for e in db.query(ExamModel).all()}
    rooms = {r.id: r for r in db.query(RoomModel).all()}
    slots = {s.id: s for s in db.query(TimeSlotModel).all()}

    assignment_items = []
    for a in tt.assignments:
        exam = exams.get(a.exam_id)
        room = rooms.get(a.room_id) if a.room_id else None
        slot = slots.get(a.slot_id) if a.slot_id else None

        assignment_items.append(
            AssignmentItem(
                id=a.id,
                exam_id=a.exam_id,
                exam_code=exam.code if exam else "UNKNOWN",
                exam_name=exam.name if exam else "Unknown Exam",
                student_group_codes=json.loads(exam.student_group_codes or "[]") if exam else [],
                student_count=exam.student_count if exam else 0,
                date=a.date,
                slot_id=a.slot_id,
                slot_name=slot.name if slot else None,
                slot_start=slot.start_time if slot else None,
                slot_end=slot.end_time if slot else None,
                room_id=a.room_id,
                room_number=room.room_number if room else None,
                room_name=room.name if room else None,
                room_capacity=room.capacity if room else None,
                room_type=room.room_type if room else None,
                is_locked=a.is_locked,
                has_conflict=a.has_conflict,
                conflict_reason=a.conflict_reason,
            )
        )

    # Sort assignments by date, slot, room
    assignment_items.sort(key=lambda x: (x.date or "9999", x.slot_id or 99, x.exam_code))

    conflicts_raw = json.loads(tt.conflict_reports or "[]")
    conflicts = [ConflictItem(**c) for c in conflicts_raw]

    logs_raw = json.loads(tt.decision_logs or "[]")
    decision_logs = [AIDecisionLog(**l) for l in logs_raw]

    ai_summary = json.loads(tt.ai_summary or "{}")

    return TimetableResponse(
        id=tt.id,
        name=tt.name,
        academic_term=tt.academic_term,
        status=tt.status,
        total_exams=tt.total_exams,
        scheduled_exams=tt.scheduled_exams,
        hard_violations_count=tt.hard_violations_count,
        soft_penalty_score=tt.soft_penalty_score,
        execution_time_ms=tt.execution_time_ms,
        backtracks_count=tt.backtracks_count,
        assignments_attempted=tt.assignments_attempted,
        constraint_checks_count=tt.constraint_checks_count,
        assignments=assignment_items,
        conflict_reports=conflicts,
        decision_logs=decision_logs,
        ai_summary=ai_summary,
        created_at=tt.created_at,
    )


@router.post("/generate", response_model=TimetableResponse, status_code=status.HTTP_201_CREATED)
def generate_new_timetable(
    payload: GenerateTimetableRequest = GenerateTimetableRequest(),
    db: Session = Depends(get_db),
):
    try:
        tt = generate_timetable(
            db=db,
            name=payload.name,
            academic_term=payload.academic_term,
            config_id=payload.config_id,
            enforce_locked=payload.enforce_locked,
        )
        return _build_timetable_response(tt, db)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("", response_model=List[TimetableResponse])
def list_timetables(db: Session = Depends(get_db)):
    timetables = db.query(TimetableModel).order_by(TimetableModel.id.desc()).all()
    return [_build_timetable_response(tt, db) for tt in timetables]


@router.get("/{timetable_id}", response_model=TimetableResponse)
def get_timetable(timetable_id: int, db: Session = Depends(get_db)):
    tt = db.query(TimetableModel).filter(TimetableModel.id == timetable_id).first()
    if not tt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timetable not found.")
    return _build_timetable_response(tt, db)


@router.post("/{timetable_id}/validate", response_model=ValidationResponse)
def validate_timetable_endpoint(timetable_id: int, db: Session = Depends(get_db)):
    try:
        res = revalidate_timetable(db, timetable_id)
        conflicts = [ConflictItem(**c) for c in res["conflicts"]]
        return ValidationResponse(
            is_valid=res["is_valid"],
            hard_violations_count=res["hard_violations_count"],
            soft_penalty_score=res["soft_penalty_score"],
            conflicts=conflicts,
            summary=res["summary"],
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/{timetable_id}/assignments/{assignment_id}", response_model=TimetableResponse)
def update_assignment_endpoint(
    timetable_id: int,
    assignment_id: int,
    payload: AssignmentUpdateRequest,
    db: Session = Depends(get_db),
):
    try:
        update_assignment(
            db=db,
            timetable_id=timetable_id,
            assignment_id=assignment_id,
            date=payload.date,
            slot_id=payload.slot_id,
            room_id=payload.room_id,
            is_locked=payload.is_locked,
        )
        tt = db.query(TimetableModel).filter(TimetableModel.id == timetable_id).first()
        return _build_timetable_response(tt, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{timetable_id}/repair", response_model=TimetableResponse)
def repair_timetable_endpoint(
    timetable_id: int,
    payload: RepairTimetableRequest = RepairTimetableRequest(),
    db: Session = Depends(get_db),
):
    try:
        tt = repair_existing_timetable(db, timetable_id, keep_locked=payload.keep_locked)
        return _build_timetable_response(tt, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{timetable_id}/export/csv")
def export_csv_endpoint(timetable_id: int, db: Session = Depends(get_db)):
    try:
        csv_data = export_timetable_to_csv(db, timetable_id)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=exam_timetable_{timetable_id}.csv"},
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{timetable_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timetable(timetable_id: int, db: Session = Depends(get_db)):
    tt = db.query(TimetableModel).filter(TimetableModel.id == timetable_id).first()
    if not tt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timetable not found.")
    db.delete(tt)
    db.commit()
    return None
