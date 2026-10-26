"""Timetable Service layer for generation, manual editing, validation, and repair."""
import json
import csv
import io
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session

from backend.app.models.exam import ExamModel
from backend.app.models.room import RoomModel
from backend.app.models.student_group import StudentGroupModel
from backend.app.models.time_slot import TimeSlotModel
from backend.app.models.scheduling_config import SchedulingConfigModel
from backend.app.models.timetable import TimetableModel, AssignmentModel

from backend.app.ai.csp_solver import CSPScheduler
from backend.app.ai.constraints import validate_timetable_independently
from backend.app.ai.explanations import generate_ai_explanation
from backend.app.ai.repair import repair_timetable


def _exam_to_dict(exam: ExamModel) -> Dict[str, Any]:
    return {
        "id": exam.id,
        "code": exam.code,
        "name": exam.name,
        "student_group_codes": json.loads(exam.student_group_codes or "[]"),
        "student_count": exam.student_count,
        "duration_slots": exam.duration_slots,
        "permitted_dates": json.loads(exam.permitted_dates or "[]"),
        "permitted_slots": json.loads(exam.permitted_slots or "[]"),
        "required_room_type": exam.required_room_type,
        "required_facilities": json.loads(exam.required_facilities or "[]"),
    }


def _room_to_dict(room: RoomModel) -> Dict[str, Any]:
    return {
        "id": room.id,
        "room_number": room.room_number,
        "name": room.name,
        "capacity": room.capacity,
        "room_type": room.room_type,
        "facilities": json.loads(room.facilities or "[]"),
        "available_dates": json.loads(room.available_dates or "[]"),
        "unavailable_slots": json.loads(room.unavailable_slots or "[]"),
        "is_active": room.is_active,
    }


def _group_to_dict(group: StudentGroupModel) -> Dict[str, Any]:
    return {
        "id": group.id,
        "code": group.code,
        "name": group.name,
        "student_count": group.student_count,
        "shared_conflict_groups": json.loads(group.shared_conflict_groups or "[]"),
    }


def _slot_to_dict(slot: TimeSlotModel) -> Dict[str, Any]:
    return {
        "id": slot.id,
        "slot_number": slot.slot_number,
        "name": slot.name,
        "start_time": slot.start_time,
        "end_time": slot.end_time,
        "is_active": slot.is_active,
    }


def generate_timetable(
    db: Session,
    name: Optional[str] = None,
    academic_term: Optional[str] = None,
    config_id: Optional[int] = None,
    enforce_locked: bool = True,
) -> TimetableModel:
    """Invokes the Python CSP scheduler and saves the resulting timetable."""
    # 1. Fetch active configuration
    config_query = db.query(SchedulingConfigModel)
    if config_id:
        cfg = config_query.filter(SchedulingConfigModel.id == config_id).first()
    else:
        cfg = config_query.filter(SchedulingConfigModel.is_active == True).first()
    
    if not cfg:
        # Fallback to creating a default config
        cfg = SchedulingConfigModel()
        db.add(cfg)
        db.commit()
        db.refresh(cfg)

    dates = json.loads(cfg.dates or "[]")
    config_dict = {
        "weight_gap": cfg.weight_gap,
        "weight_distribution": cfg.weight_distribution,
        "weight_utilization": cfg.weight_utilization,
        "max_search_seconds": cfg.max_search_seconds,
        "max_backtracks": cfg.max_backtracks,
    }

    # 2. Fetch input data
    exams_raw = db.query(ExamModel).all()
    rooms_raw = db.query(RoomModel).filter(RoomModel.is_active == True).all()
    groups_raw = db.query(StudentGroupModel).all()
    slots_raw = db.query(TimeSlotModel).filter(TimeSlotModel.is_active == True).order_by(TimeSlotModel.slot_number).all()

    exams = [_exam_to_dict(e) for e in exams_raw]
    rooms = [_room_to_dict(r) for r in rooms_raw]
    groups = [_group_to_dict(g) for g in groups_raw]
    slots = [_slot_to_dict(s) for s in slots_raw]

    # Check for locked assignments if enforcing locked
    locked_map = {}
    if enforce_locked:
        latest_tt = db.query(TimetableModel).order_by(TimetableModel.id.desc()).first()
        if latest_tt:
            for a in latest_tt.assignments:
                if a.is_locked and a.date and a.slot_id and a.room_id:
                    locked_map[a.exam_id] = (a.date, a.slot_id, a.room_id)

    # 3. Instantiate and run CSP Scheduler
    scheduler = CSPScheduler(
        exams=exams,
        rooms=rooms,
        groups=groups,
        slots=slots,
        dates=dates,
        config=config_dict,
        locked_assignments=locked_map,
    )
    result = scheduler.solve()

    # 4. Independent Validation Check
    assignment_items = []
    assignments_dict = result.get("assignments", {})

    for exam in exams:
        eid = exam["id"]
        if eid in assignments_dict:
            d, s, r = assignments_dict[eid]
            assignment_items.append({
                "exam_id": eid,
                "date": d,
                "slot_id": s,
                "room_id": r,
            })
        else:
            assignment_items.append({
                "exam_id": eid,
                "date": None,
                "slot_id": None,
                "room_id": None,
            })

    validation = validate_timetable_independently(
        assignment_items,
        exams,
        rooms,
        groups,
        slots,
        dates,
    )

    # 5. Generate AI Explanations
    explanation = generate_ai_explanation(result, exams, rooms, groups)

    # 6. Save Timetable Model to DB
    tt_name = name or f"Timetable - {cfg.name}"
    tt_term = academic_term or cfg.academic_term

    timetable = TimetableModel(
        name=tt_name,
        academic_term=tt_term,
        status=result["status"],
        total_exams=len(exams),
        scheduled_exams=len(assignments_dict),
        hard_violations_count=validation["hard_violations_count"],
        soft_penalty_score=validation["soft_penalty_score"],
        execution_time_ms=result["metrics"]["execution_time_ms"],
        backtracks_count=result["metrics"]["backtracks_count"],
        assignments_attempted=result["metrics"]["assignments_attempted"],
        constraint_checks_count=result["metrics"]["constraint_checks_count"],
        decision_logs=json.dumps(result.get("decision_logs", [])),
        conflict_reports=json.dumps(validation.get("conflicts", [])),
        ai_summary=json.dumps(explanation),
    )
    db.add(timetable)
    db.commit()
    db.refresh(timetable)

    # 7. Save Assignments
    for exam in exams:
        eid = exam["id"]
        if eid in assignments_dict:
            d, s, r = assignments_dict[eid]
            assignment = AssignmentModel(
                timetable_id=timetable.id,
                exam_id=eid,
                date=d,
                slot_id=s,
                room_id=r,
                is_locked=(eid in locked_map),
                has_conflict=False,
            )
        else:
            assignment = AssignmentModel(
                timetable_id=timetable.id,
                exam_id=eid,
                date=None,
                slot_id=None,
                room_id=None,
                is_locked=False,
                has_conflict=True,
                conflict_reason="Unscheduled due to domain constraints",
            )
        db.add(assignment)

    db.commit()
    db.refresh(timetable)
    return timetable


def revalidate_timetable(db: Session, timetable_id: int) -> Dict[str, Any]:
    """Runs independent validation on a stored timetable and updates violation records."""
    timetable = db.query(TimetableModel).filter(TimetableModel.id == timetable_id).first()
    if not timetable:
        raise ValueError(f"Timetable ID {timetable_id} not found.")

    exams = [_exam_to_dict(e) for e in db.query(ExamModel).all()]
    rooms = [_room_to_dict(r) for r in db.query(RoomModel).all()]
    groups = [_group_to_dict(g) for g in db.query(StudentGroupModel).all()]
    slots = [_slot_to_dict(s) for s in db.query(TimeSlotModel).all()]
    
    cfg = db.query(SchedulingConfigModel).filter(SchedulingConfigModel.is_active == True).first()
    dates = json.loads(cfg.dates or "[]") if cfg else []

    assignment_items = []
    for a in timetable.assignments:
        assignment_items.append({
            "assignment_id": a.id,
            "exam_id": a.exam_id,
            "date": a.date,
            "slot_id": a.slot_id,
            "room_id": a.room_id,
        })

    validation = validate_timetable_independently(
        assignment_items,
        exams,
        rooms,
        groups,
        slots,
        dates,
    )

    # Update timetable metrics
    timetable.hard_violations_count = validation["hard_violations_count"]
    timetable.soft_penalty_score = validation["soft_penalty_score"]
    timetable.conflict_reports = json.dumps(validation["conflicts"])
    
    # Mark individual assignments has_conflict flag
    conflicted_exam_ids = set()
    exam_conflict_reasons = {}
    for c in validation["conflicts"]:
        for eid in c["affected_exam_ids"]:
            conflicted_exam_ids.add(eid)
            exam_conflict_reasons[eid] = c["message"]

    for a in timetable.assignments:
        if a.exam_id in conflicted_exam_ids or not a.date:
            a.has_conflict = True
            a.conflict_reason = exam_conflict_reasons.get(a.exam_id, "Involved in timetable conflict")
        else:
            a.has_conflict = False
            a.conflict_reason = None

    db.commit()
    return validation


def update_assignment(
    db: Session,
    timetable_id: int,
    assignment_id: int,
    date: Optional[str] = None,
    slot_id: Optional[int] = None,
    room_id: Optional[int] = None,
    is_locked: Optional[bool] = None,
) -> AssignmentModel:
    """Manually updates an assignment and re-validates the timetable."""
    assignment = (
        db.query(AssignmentModel)
        .filter(AssignmentModel.id == assignment_id, AssignmentModel.timetable_id == timetable_id)
        .first()
    )
    if not assignment:
        raise ValueError(f"Assignment {assignment_id} in timetable {timetable_id} not found.")

    if date is not None:
        assignment.date = date
    if slot_id is not None:
        assignment.slot_id = slot_id
    if room_id is not None:
        assignment.room_id = room_id
    if is_locked is not None:
        assignment.is_locked = is_locked

    db.commit()
    # Revalidate immediately
    revalidate_timetable(db, timetable_id)
    db.refresh(assignment)
    return assignment


def repair_existing_timetable(db: Session, timetable_id: int, keep_locked: bool = True) -> TimetableModel:
    """Repairs conflicts in an existing timetable using CSP search."""
    timetable = db.query(TimetableModel).filter(TimetableModel.id == timetable_id).first()
    if not timetable:
        raise ValueError(f"Timetable {timetable_id} not found.")

    exams = [_exam_to_dict(e) for e in db.query(ExamModel).all()]
    rooms = [_room_to_dict(r) for r in db.query(RoomModel).filter(RoomModel.is_active == True).all()]
    groups = [_group_to_dict(g) for g in db.query(StudentGroupModel).all()]
    slots = [_slot_to_dict(s) for s in db.query(TimeSlotModel).filter(TimeSlotModel.is_active == True).all()]
    
    cfg = db.query(SchedulingConfigModel).filter(SchedulingConfigModel.is_active == True).first()
    dates = json.loads(cfg.dates or "[]") if cfg else []
    config_dict = {
        "weight_gap": cfg.weight_gap if cfg else 10.0,
        "weight_distribution": cfg.weight_distribution if cfg else 5.0,
        "weight_utilization": cfg.weight_utilization if cfg else 3.0,
        "max_search_seconds": cfg.max_search_seconds if cfg else 15.0,
        "max_backtracks": cfg.max_backtracks if cfg else 10000,
    }

    current_assignments = []
    for a in timetable.assignments:
        current_assignments.append({
            "exam_id": a.exam_id,
            "date": a.date,
            "slot_id": a.slot_id,
            "room_id": a.room_id,
            "is_locked": a.is_locked,
        })

    result = repair_timetable(
        assignments=current_assignments,
        exams=exams,
        rooms=rooms,
        groups=groups,
        slots=slots,
        dates=dates,
        config=config_dict,
        keep_locked=keep_locked,
    )

    if result["status"] == "SUCCESS":
        assignments_map = result["assignments"]
        for a in timetable.assignments:
            if a.exam_id in assignments_map:
                d, s, r = assignments_map[a.exam_id]
                a.date = d
                a.slot_id = s
                a.room_id = r
                a.has_conflict = False
                a.conflict_reason = None

        timetable.status = "SUCCESS"
        timetable.scheduled_exams = len(assignments_map)
        timetable.backtracks_count = result["metrics"]["backtracks_count"]
        timetable.execution_time_ms = result["metrics"]["execution_time_ms"]
        timetable.assignments_attempted = result["metrics"]["assignments_attempted"]
        timetable.constraint_checks_count = result["metrics"]["constraint_checks_count"]
        timetable.decision_logs = json.dumps(result.get("decision_logs", []))

        db.commit()
        revalidate_timetable(db, timetable_id)

    db.refresh(timetable)
    return timetable


def export_timetable_to_csv(db: Session, timetable_id: int) -> str:
    """Exports timetable assignments into a formatted CSV string."""
    timetable = db.query(TimetableModel).filter(TimetableModel.id == timetable_id).first()
    if not timetable:
        raise ValueError(f"Timetable {timetable_id} not found.")

    exams = {e.id: e for e in db.query(ExamModel).all()}
    rooms = {r.id: r for r in db.query(RoomModel).all()}
    slots = {s.id: s for s in db.query(TimeSlotModel).all()}

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Subject Code",
        "Subject Name",
        "Student Groups",
        "Student Count",
        "Exam Date",
        "Time Slot",
        "Start Time",
        "End Time",
        "Room Number",
        "Room Name",
        "Room Capacity",
        "Status",
    ])

    for a in sorted(timetable.assignments, key=lambda x: (x.date or "9999", x.slot_id or 99)):
        exam = exams.get(a.exam_id)
        room = rooms.get(a.room_id)
        slot = slots.get(a.slot_id)

        groups_str = ", ".join(json.loads(exam.student_group_codes or "[]")) if exam else ""

        writer.writerow([
            exam.code if exam else "",
            exam.name if exam else "",
            groups_str,
            exam.student_count if exam else "",
            a.date or "Unscheduled",
            slot.name if slot else "",
            slot.start_time if slot else "",
            slot.end_time if slot else "",
            room.room_number if room else "",
            room.name if room else "",
            room.capacity if room else "",
            "Conflict" if a.has_conflict else "Scheduled",
        ])

    return output.getvalue()
