"""Realistic Academic Demo Dataset Generator."""
import json
from sqlalchemy.orm import Session
from backend.app.models.student_group import StudentGroupModel
from backend.app.models.room import RoomModel
from backend.app.models.time_slot import TimeSlotModel
from backend.app.models.exam import ExamModel
from backend.app.models.scheduling_config import SchedulingConfigModel


def seed_demo_data(db: Session) -> None:
    """Clears existing data and loads a comprehensive college examination scenario."""
    # 1. Clear existing
    db.query(ExamModel).delete()
    db.query(StudentGroupModel).delete()
    db.query(RoomModel).delete()
    db.query(TimeSlotModel).delete()
    db.query(SchedulingConfigModel).delete()
    db.commit()

    # 2. Student Groups
    groups = [
        StudentGroupModel(
            code="CS-Y3",
            name="Computer Science & Eng - Year 3",
            student_count=60,
            shared_conflict_groups=json.dumps(["AI-ELEC"]),
        ),
        StudentGroupModel(
            code="CS-Y4",
            name="Computer Science & Eng - Year 4",
            student_count=55,
            shared_conflict_groups=json.dumps(["CYBER-ELEC"]),
        ),
        StudentGroupModel(
            code="IT-Y3",
            name="Information Technology - Year 3",
            student_count=50,
            shared_conflict_groups=json.dumps(["AI-ELEC"]),
        ),
        StudentGroupModel(
            code="IT-Y4",
            name="Information Technology - Year 4",
            student_count=45,
            shared_conflict_groups=json.dumps(["CYBER-ELEC"]),
        ),
        StudentGroupModel(
            code="ECE-Y3",
            name="Electronics & Comm - Year 3",
            student_count=65,
            shared_conflict_groups=json.dumps([]),
        ),
        StudentGroupModel(
            code="AI-ELEC",
            name="Open Elective: AI & Deep Learning",
            student_count=40,
            shared_conflict_groups=json.dumps(["CS-Y3", "IT-Y3"]),
        ),
        StudentGroupModel(
            code="CYBER-ELEC",
            name="Open Elective: Cyber Defense",
            student_count=35,
            shared_conflict_groups=json.dumps(["CS-Y4", "IT-Y4"]),
        ),
    ]
    db.add_all(groups)

    # 3. Rooms
    rooms = [
        RoomModel(
            room_number="AUD-101",
            name="Main Academic Auditorium",
            capacity=150,
            room_type="Auditorium",
            facilities=json.dumps(["Projector", "Audio System", "AC"]),
            available_dates=json.dumps([]),
            unavailable_slots=json.dumps([]),
            is_active=True,
        ),
        RoomModel(
            room_number="LH-201",
            name="Lecture Hall 201 (East Wing)",
            capacity=80,
            room_type="Lecture Hall",
            facilities=json.dumps(["Projector", "Audio System"]),
            available_dates=json.dumps([]),
            unavailable_slots=json.dumps([]),
            is_active=True,
        ),
        RoomModel(
            room_number="LH-202",
            name="Lecture Hall 202 (West Wing)",
            capacity=70,
            room_type="Lecture Hall",
            facilities=json.dumps(["Projector"]),
            available_dates=json.dumps([]),
            unavailable_slots=json.dumps([]),
            is_active=True,
        ),
        RoomModel(
            room_number="SEM-HALL",
            name="Silver Jubilee Seminar Hall",
            capacity=90,
            room_type="Seminar Hall",
            facilities=json.dumps(["Projector", "AC"]),
            available_dates=json.dumps([]),
            unavailable_slots=json.dumps([]),
            is_active=True,
        ),
        RoomModel(
            room_number="LAB-CS1",
            name="Computer Science High-End Lab",
            capacity=45,
            room_type="Computer Lab",
            facilities=json.dumps(["Computers", "Projector", "AC"]),
            available_dates=json.dumps([]),
            unavailable_slots=json.dumps([]),
            is_active=True,
        ),
        RoomModel(
            room_number="LAB-IT1",
            name="Information Technology Software Lab",
            capacity=42,
            room_type="Computer Lab",
            facilities=json.dumps(["Computers", "AC"]),
            available_dates=json.dumps([]),
            unavailable_slots=json.dumps([]),
            is_active=True,
        ),
        RoomModel(
            room_number="CR-301",
            name="Classroom 301",
            capacity=65,
            room_type="Classroom",
            facilities=json.dumps(["Whiteboard", "Projector"]),
            available_dates=json.dumps([]),
            unavailable_slots=json.dumps([]),
            is_active=True,
        ),
        RoomModel(
            room_number="CR-302",
            name="Classroom 302",
            capacity=55,
            room_type="Classroom",
            facilities=json.dumps(["Whiteboard"]),
            available_dates=json.dumps([]),
            unavailable_slots=json.dumps([]),
            is_active=True,
        ),
    ]
    db.add_all(rooms)

    # 4. Time Slots
    slots = [
        TimeSlotModel(
            slot_number=1,
            name="Morning Session (FN)",
            start_time="09:30",
            end_time="12:30",
            is_active=True,
        ),
        TimeSlotModel(
            slot_number=2,
            name="Afternoon Session (AN)",
            start_time="14:00",
            end_time="17:00",
            is_active=True,
        ),
    ]
    db.add_all(slots)

    # 5. Scheduling Config
    exam_dates = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"]
    config = SchedulingConfigModel(
        name="Semester End Examination Nov 2026",
        academic_term="Autumn 2026-27",
        start_date="2026-11-16",
        end_date="2026-11-20",
        dates=json.dumps(exam_dates),
        weight_gap=10.0,
        weight_distribution=5.0,
        weight_utilization=3.0,
        max_search_seconds=15.0,
        max_backtracks=10000,
        is_active=True,
    )
    db.add(config)

    # 6. Examinations
    exams = [
        ExamModel(
            code="CS301",
            name="Design and Analysis of Algorithms",
            student_group_codes=json.dumps(["CS-Y3"]),
            student_count=60,
            duration_slots=1,
            permitted_dates=json.dumps([]),
            permitted_slots=json.dumps([]),
            required_room_type="Lecture Hall",
            required_facilities=json.dumps([]),
        ),
        ExamModel(
            code="CS302",
            name="Operating Systems Concepts",
            student_group_codes=json.dumps(["CS-Y3"]),
            student_count=60,
            duration_slots=1,
            permitted_dates=json.dumps([]),
            permitted_slots=json.dumps([]),
            required_room_type=None,
            required_facilities=json.dumps([]),
        ),
        ExamModel(
            code="CS303-LAB",
            name="Systems Programming Practical Lab",
            student_group_codes=json.dumps(["CS-Y3"]),
            student_count=40,
            duration_slots=1,
            permitted_dates=json.dumps([]),
            permitted_slots=json.dumps([]),
            required_room_type="Computer Lab",
            required_facilities=json.dumps(["Computers"]),
        ),
        ExamModel(
            code="CS401",
            name="Distributed Systems & Cloud Computing",
            student_group_codes=json.dumps(["CS-Y4"]),
            student_count=55,
            duration_slots=1,
            permitted_dates=json.dumps([]),
            permitted_slots=json.dumps([]),
            required_room_type=None,
            required_facilities=json.dumps([]),
        ),
        ExamModel(
            code="CS402",
            name="Deep Learning & Neural Networks",
            student_group_codes=json.dumps(["CS-Y4"]),
            student_count=55,
            duration_slots=1,
            permitted_dates=json.dumps([]),
            permitted_slots=json.dumps([]),
            required_room_type="Lecture Hall",
            required_facilities=json.dumps([]),
        ),
        ExamModel(
            code="IT301",
            name="Full-Stack Web Engineering",
            student_group_codes=json.dumps(["IT-Y3"]),
            student_count=50,
            duration_slots=1,
            permitted_dates=json.dumps([]),
            permitted_slots=json.dumps([]),
            required_room_type=None,
            required_facilities=json.dumps([]),
        ),
        ExamModel(
            code="IT302",
            name="Computer Networks & Protocols",
            student_group_codes=json.dumps(["IT-Y3"]),
            student_count=50,
            duration_slots=1,
            permitted_dates=json.dumps([]),
            permitted_slots=json.dumps([]),
            required_room_type=None,
            required_facilities=json.dumps([]),
        ),
        ExamModel(
            code="IT303-LAB",
            name="Web Application Testing Lab",
            student_group_codes=json.dumps(["IT-Y3"]),
            student_count=38,
            duration_slots=1,
            permitted_dates=json.dumps([]),
            permitted_slots=json.dumps([]),
            required_room_type="Computer Lab",
            required_facilities=json.dumps(["Computers"]),
        ),
        ExamModel(
            code="IT401",
            name="DevOps Architecture & CI/CD",
            student_group_codes=json.dumps(["IT-Y4"]),
            student_count=45,
            duration_slots=1,
            permitted_dates=json.dumps([]),
            permitted_slots=json.dumps([]),
            required_room_type=None,
            required_facilities=json.dumps([]),
        ),
        ExamModel(
            code="ECE301",
            name="Digital Signal Processing",
            student_group_codes=json.dumps(["ECE-Y3"]),
            student_count=65,
            duration_slots=1,
            permitted_dates=json.dumps([]),
            permitted_slots=json.dumps([]),
            required_room_type=None,
            required_facilities=json.dumps([]),
        ),
        ExamModel(
            code="ECE302",
            name="Embedded Systems and IoT",
            student_group_codes=json.dumps(["ECE-Y3"]),
            student_count=65,
            duration_slots=1,
            permitted_dates=json.dumps([]),
            permitted_slots=json.dumps([]),
            required_room_type=None,
            required_facilities=json.dumps([]),
        ),
        ExamModel(
            code="ELEC-AI",
            name="Open Elective: Introduction to AI",
            student_group_codes=json.dumps(["AI-ELEC"]),
            student_count=40,
            duration_slots=1,
            permitted_dates=json.dumps([]),
            permitted_slots=json.dumps([]),
            required_room_type=None,
            required_facilities=json.dumps([]),
        ),
        ExamModel(
            code="ELEC-SEC",
            name="Open Elective: Network Defense & Cryptography",
            student_group_codes=json.dumps(["CYBER-ELEC"]),
            student_count=35,
            duration_slots=1,
            permitted_dates=json.dumps([]),
            permitted_slots=json.dumps([]),
            required_room_type=None,
            required_facilities=json.dumps([]),
        ),
    ]
    db.add_all(exams)
    db.commit()
