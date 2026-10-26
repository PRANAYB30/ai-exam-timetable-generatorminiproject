"""Demo Data Loading and Database Reset API Endpoints."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.exam import ExamModel
from backend.app.models.room import RoomModel
from backend.app.models.student_group import StudentGroupModel
from backend.app.models.time_slot import TimeSlotModel
from backend.app.models.scheduling_config import SchedulingConfigModel
from backend.app.models.timetable import TimetableModel, AssignmentModel
from backend.app.services.demo_data import seed_demo_data
from backend.app.services.timetable_service import generate_timetable

router = APIRouter(prefix="/demo", tags=["Demo Data"])


@router.post("/load", status_code=status.HTTP_200_OK)
def load_sample_dataset(auto_generate: bool = True, db: Session = Depends(get_db)):
    """Loads realistic college demo data and generates an AI timetable."""
    # Seed data
    seed_demo_data(db)

    # Automatically generate timetable using the AI algorithm
    tt_id = None
    if auto_generate:
        tt = generate_timetable(
            db=db,
            name="Demo College Examination Schedule",
            academic_term="Autumn 2026-27",
            enforce_locked=False,
        )
        tt_id = tt.id

    return {
        "message": "Demo college dataset successfully initialized.",
        "auto_generated": auto_generate,
        "timetable_id": tt_id,
    }


@router.post("/reset", status_code=status.HTTP_200_OK)
def reset_database(db: Session = Depends(get_db)):
    """Confirmed reset clearing all tables."""
    db.query(AssignmentModel).delete()
    db.query(TimetableModel).delete()
    db.query(ExamModel).delete()
    db.query(StudentGroupModel).delete()
    db.query(RoomModel).delete()
    db.query(TimeSlotModel).delete()
    db.query(SchedulingConfigModel).delete()
    db.commit()

    return {"message": "Database completely reset to clean state."}
