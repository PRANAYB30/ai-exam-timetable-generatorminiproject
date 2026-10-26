"""Dashboard Analytics API Endpoint."""
import json
from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.exam import ExamModel
from backend.app.models.room import RoomModel
from backend.app.models.student_group import StudentGroupModel
from backend.app.models.time_slot import TimeSlotModel
from backend.app.models.timetable import TimetableModel

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_exams = db.query(ExamModel).count()
    total_rooms = db.query(RoomModel).filter(RoomModel.is_active == True).count()
    total_slots = db.query(TimeSlotModel).filter(TimeSlotModel.is_active == True).count()
    total_groups = db.query(StudentGroupModel).count()

    latest_tt = db.query(TimetableModel).order_by(TimetableModel.id.desc()).first()
    recent_timetables = db.query(TimetableModel).order_by(TimetableModel.id.desc()).limit(5).all()

    recent_summary = []
    for tt in recent_timetables:
        recent_summary.append({
            "id": tt.id,
            "name": tt.name,
            "academic_term": tt.academic_term,
            "status": tt.status,
            "scheduled_exams": tt.scheduled_exams,
            "total_exams": tt.total_exams,
            "hard_violations_count": tt.hard_violations_count,
            "soft_penalty_score": tt.soft_penalty_score,
            "execution_time_ms": tt.execution_time_ms,
            "backtracks_count": tt.backtracks_count,
            "created_at": tt.created_at,
        })

    day_distribution = {}
    room_utilization_data = []
    room_utilization_pct = 0.0

    if latest_tt and latest_tt.assignments:
        rooms = {r.id: r for r in db.query(RoomModel).all()}
        exams = {e.id: e for e in db.query(ExamModel).all()}

        room_counts = defaultdict(int)
        day_counts = defaultdict(int)
        total_used_capacity = 0
        total_assigned_students = 0

        for a in latest_tt.assignments:
            if a.date and a.room_id and a.exam_id:
                day_counts[a.date] += 1
                room_counts[a.room_id] += 1

                exam = exams.get(a.exam_id)
                room = rooms.get(a.room_id)
                if exam and room:
                    total_assigned_students += exam.student_count
                    total_used_capacity += room.capacity

        day_distribution = dict(day_counts)

        for rid, room in rooms.items():
            used_slots = room_counts.get(rid, 0)
            room_utilization_data.append({
                "room_number": room.room_number,
                "room_name": room.name,
                "capacity": room.capacity,
                "sessions_scheduled": used_slots,
            })

        if total_used_capacity > 0:
            room_utilization_pct = round((total_assigned_students / total_used_capacity) * 100, 1)

    return {
        "total_exams": total_exams,
        "total_rooms": total_rooms,
        "total_slots": total_slots,
        "total_groups": total_groups,
        "latest_timetable": {
            "id": latest_tt.id if latest_tt else None,
            "name": latest_tt.name if latest_tt else None,
            "status": latest_tt.status if latest_tt else "NO_TIMETABLE",
            "scheduled_exams": latest_tt.scheduled_exams if latest_tt else 0,
            "total_exams": latest_tt.total_exams if latest_tt else total_exams,
            "hard_violations_count": latest_tt.hard_violations_count if latest_tt else 0,
            "soft_penalty_score": latest_tt.soft_penalty_score if latest_tt else 0.0,
            "execution_time_ms": latest_tt.execution_time_ms if latest_tt else 0.0,
            "backtracks_count": latest_tt.backtracks_count if latest_tt else 0,
            "room_utilization_percent": room_utilization_pct,
            "day_distribution": day_distribution,
            "room_utilization_data": room_utilization_data,
        } if latest_tt else None,
        "recent_timetables": recent_summary,
    }
