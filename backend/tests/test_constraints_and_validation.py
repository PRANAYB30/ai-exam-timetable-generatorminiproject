"""Tests for independent constraint validation, manual edits, repair, and soft penalties."""
import pytest
from backend.app.ai.constraints import (
    validate_timetable_independently,
    calculate_soft_penalty,
    build_student_group_conflict_map,
)
from backend.app.services.demo_data import seed_demo_data
from backend.app.services.timetable_service import (
    generate_timetable,
    update_assignment,
    repair_existing_timetable,
)
from backend.app.models.timetable import TimetableModel


def test_9_independent_validation_detects_deliberate_conflicts(sample_csp_data):
    """Scenario 9: Independent validation detects deliberately injected conflicts."""
    data = sample_csp_data

    # Deliberately inject 3 conflicts:
    # 1. Room overbooking: Exam 1 and Exam 3 in Room 1 at same (date, slot)
    # 2. Student clash: Exam 1 and Exam 2 (both group CS-1) at same (date, slot)
    # 3. Capacity deficit: Exam 1 (50 students) put in room with cap 20
    custom_rooms = data["rooms"] + [{"id": 99, "room_number": "TINY", "name": "Tiny Room", "capacity": 20, "facilities": [], "is_active": True}]
    
    deliberate_assignments = [
        {"exam_id": 1, "date": "2026-11-16", "slot_id": 1, "room_id": 1},
        {"exam_id": 2, "date": "2026-11-16", "slot_id": 1, "room_id": 2},  # Student clash with Exam 1 (both CS-1 at same time)
        {"exam_id": 3, "date": "2026-11-16", "slot_id": 1, "room_id": 1},  # Room collision with Exam 1 in Room 1
        {"exam_id": 4, "date": "2026-11-17", "slot_id": 1, "room_id": 99}, # Capacity deficit: Exam 4 (45 students) in TINY (20 cap)
    ]

    val = validate_timetable_independently(
        deliberate_assignments,
        data["exams"],
        custom_rooms,
        data["groups"],
        data["slots"],
        data["dates"],
    )

    assert val["is_valid"] is False
    assert val["hard_violations_count"] >= 3
    
    types = [c["type"] for c in val["conflicts"]]
    assert "STUDENT_GROUP_CLASH" in types
    assert "ROOM_OVERBOOKING" in types
    assert "CAPACITY_DEFICIT" in types


def test_10_manual_changes_trigger_revalidation_and_repair(db_session):
    """Scenario 10: Manual assignment edit triggers revalidation, and AI repair restores validity."""
    seed_demo_data(db_session)
    # Generate initial valid timetable
    tt = generate_timetable(db_session, enforce_locked=False)
    assert tt.hard_violations_count == 0
    assert tt.status == "SUCCESS"

    # Pick two assignments and deliberately force them into the same date, slot, and room
    a1 = tt.assignments[0]
    a2 = tt.assignments[1]

    original_date = a2.date
    original_slot = a2.slot_id
    original_room = a2.room_id

    # Manually move a2 into colliding slot with a1
    update_assignment(
        db=db_session,
        timetable_id=tt.id,
        assignment_id=a2.id,
        date=a1.date,
        slot_id=a1.slot_id,
        room_id=a1.room_id,
    )

    # Re-fetch timetable
    db_session.refresh(tt)
    assert tt.hard_violations_count > 0, "Expected violation to be detected after collision edit"
    assert a2.has_conflict is True or a1.has_conflict is True

    # Now lock a1 so it cannot be moved
    update_assignment(
        db=db_session,
        timetable_id=tt.id,
        assignment_id=a1.id,
        is_locked=True,
    )

    # Trigger AI repair
    repaired_tt = repair_existing_timetable(db_session, tt.id, keep_locked=True)
    db_session.refresh(repaired_tt)

    assert repaired_tt.hard_violations_count == 0
    # Locked assignment must be preserved
    a1_repaired = next(a for a in repaired_tt.assignments if a.id == a1.id)
    assert a1_repaired.is_locked is True


def test_11_correct_soft_constraint_scoring(sample_csp_data):
    """Scenario 11: Correct soft-constraint calculation for gaps, distribution, and utilization."""
    data = sample_csp_data
    exam_dict = {e["id"]: e for e in data["exams"]}
    room_dict = {r["id"]: r for r in data["rooms"]}
    group_map = build_student_group_conflict_map(data["groups"])

    # Schedule where Group CS-1 has exams on same day (penalty!)
    bad_gap_assignments = {
        1: ("2026-11-16", 1, 1),
        2: ("2026-11-16", 2, 2),  # CS-1 has 2 exams on same day!
        3: ("2026-11-16", 1, 3),  # IT-1
    }

    score_bad, details_bad = calculate_soft_penalty(
        bad_gap_assignments,
        exam_dict,
        room_dict,
        group_map,
        data["dates"],
    )
    assert details_bad["gap"] > 0, "Expected positive gap penalty for same-day exams"

    # Schedule where exams are well-spaced across different days
    good_gap_assignments = {
        1: ("2026-11-16", 1, 1),
        2: ("2026-11-18", 1, 2),  # 2 days gap for CS-1
        3: ("2026-11-17", 1, 3),  # IT-1
    }

    score_good, details_good = calculate_soft_penalty(
        good_gap_assignments,
        exam_dict,
        room_dict,
        group_map,
        data["dates"],
    )
    assert details_good["gap"] < details_bad["gap"], "Spaced exams should have lower gap penalty"
    assert score_good < score_bad, "Overall soft penalty should be lower for well-spaced schedule"
