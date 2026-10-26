"""CSV Import and Data Parsing Service with row-level error reporting."""
import csv
import io
import json
from typing import Dict, List, Any
from sqlalchemy.orm import Session

from backend.app.models.exam import ExamModel
from backend.app.models.room import RoomModel
from backend.app.models.student_group import StudentGroupModel


def import_csv_data(db: Session, entity_type: str, file_content: str) -> Dict[str, Any]:
    """Imports CSV data with strict row-level validation and error reporting.
    
    entity_type can be: "exams", "rooms", "groups"
    """
    stream = io.StringIO(file_content.strip())
    reader = csv.DictReader(stream)

    imported_count = 0
    errors: List[Dict[str, Any]] = []

    if entity_type == "exams":
        for row_idx, row in enumerate(reader, start=2):
            code = (row.get("code") or row.get("Subject Code") or "").strip()
            name = (row.get("name") or row.get("Subject Name") or "").strip()
            groups_str = (row.get("student_groups") or row.get("Student Groups") or "").strip()
            count_str = (row.get("student_count") or row.get("Student Count") or "").strip()
            room_type = (row.get("required_room_type") or row.get("Room Type") or "").strip() or None
            fac_str = (row.get("required_facilities") or row.get("Facilities") or "").strip()

            if not code or not name:
                errors.append({"row": row_idx, "error": "Subject code and name are mandatory."})
                continue

            try:
                student_count = int(count_str) if count_str else 30
                if student_count <= 0:
                    errors.append({"row": row_idx, "error": "Student count must be positive."})
                    continue
            except ValueError:
                errors.append({"row": row_idx, "error": f"Invalid student count: '{count_str}'"})
                continue

            groups = [g.strip() for g in groups_str.split(",") if g.strip()] if groups_str else ["DEFAULT"]
            facilities = [f.strip() for f in fac_str.split(",") if f.strip()] if fac_str else []

            # Check if code exists, update or insert
            existing = db.query(ExamModel).filter(ExamModel.code == code).first()
            if existing:
                existing.name = name
                existing.student_group_codes = json.dumps(groups)
                existing.student_count = student_count
                existing.required_room_type = room_type
                existing.required_facilities = json.dumps(facilities)
            else:
                new_exam = ExamModel(
                    code=code,
                    name=name,
                    student_group_codes=json.dumps(groups),
                    student_count=student_count,
                    required_room_type=room_type,
                    required_facilities=json.dumps(facilities),
                )
                db.add(new_exam)
            imported_count += 1

    elif entity_type == "rooms":
        for row_idx, row in enumerate(reader, start=2):
            number = (row.get("room_number") or row.get("Room Number") or "").strip()
            name = (row.get("name") or row.get("Room Name") or "").strip()
            cap_str = (row.get("capacity") or row.get("Capacity") or "").strip()
            room_type = (row.get("room_type") or row.get("Room Type") or "Classroom").strip()
            fac_str = (row.get("facilities") or row.get("Facilities") or "").strip()

            if not number:
                errors.append({"row": row_idx, "error": "Room number is mandatory."})
                continue

            try:
                capacity = int(cap_str)
                if capacity <= 0:
                    errors.append({"row": row_idx, "error": "Capacity must be positive."})
                    continue
            except (ValueError, TypeError):
                errors.append({"row": row_idx, "error": f"Invalid capacity: '{cap_str}'"})
                continue

            facilities = [f.strip() for f in fac_str.split(",") if f.strip()] if fac_str else []

            existing = db.query(RoomModel).filter(RoomModel.room_number == number).first()
            if existing:
                existing.name = name or number
                existing.capacity = capacity
                existing.room_type = room_type
                existing.facilities = json.dumps(facilities)
            else:
                new_room = RoomModel(
                    room_number=number,
                    name=name or number,
                    capacity=capacity,
                    room_type=room_type,
                    facilities=json.dumps(facilities),
                )
                db.add(new_room)
            imported_count += 1

    elif entity_type == "groups":
        for row_idx, row in enumerate(reader, start=2):
            code = (row.get("code") or row.get("Group Code") or "").strip()
            name = (row.get("name") or row.get("Group Name") or "").strip()
            count_str = (row.get("student_count") or row.get("Student Count") or "").strip()
            shared_str = (row.get("shared_conflict_groups") or row.get("Conflicts") or "").strip()

            if not code:
                errors.append({"row": row_idx, "error": "Group code is mandatory."})
                continue

            try:
                student_count = int(count_str) if count_str else 30
            except ValueError:
                errors.append({"row": row_idx, "error": f"Invalid student count: '{count_str}'"})
                continue

            shared = [s.strip() for s in shared_str.split(",") if s.strip()] if shared_str else []

            existing = db.query(StudentGroupModel).filter(StudentGroupModel.code == code).first()
            if existing:
                existing.name = name or code
                existing.student_count = student_count
                existing.shared_conflict_groups = json.dumps(shared)
            else:
                new_grp = StudentGroupModel(
                    code=code,
                    name=name or code,
                    student_count=student_count,
                    shared_conflict_groups=json.dumps(shared),
                )
                db.add(new_grp)
            imported_count += 1

    else:
        raise ValueError(f"Unknown entity_type '{entity_type}'. Must be 'exams', 'rooms', or 'groups'.")

    db.commit()
    return {
        "success": len(errors) == 0,
        "imported_count": imported_count,
        "errors": errors,
    }
