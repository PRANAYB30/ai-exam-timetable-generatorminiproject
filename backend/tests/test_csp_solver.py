"""Comprehensive tests for Python CSP Backtracking Scheduler and Heuristics."""
import pytest
from backend.app.ai.csp_solver import CSPScheduler
from backend.app.ai.constraints import (
    validate_timetable_independently,
    build_student_group_conflict_map,
    have_student_conflict,
)
from backend.app.ai.heuristics import select_unassigned_variable, forward_check


def test_1_successful_timetable_generation(sample_csp_data):
    """Scenario 1: Successful timetable generation satisfying all hard constraints."""
    data = sample_csp_data
    scheduler = CSPScheduler(
        exams=data["exams"],
        rooms=data["rooms"],
        groups=data["groups"],
        slots=data["slots"],
        dates=data["dates"],
        config=data["config"],
    )
    result = scheduler.solve()
    assert result["status"] == "SUCCESS", f"Expected SUCCESS, got {result['status']}"
    assert len(result["assignments"]) == len(data["exams"])

    # Independent validation
    assignments_list = [
        {"exam_id": eid, "date": v[0], "slot_id": v[1], "room_id": v[2]}
        for eid, v in result["assignments"].items()
    ]
    val = validate_timetable_independently(
        assignments_list,
        data["exams"],
        data["rooms"],
        data["groups"],
        data["slots"],
        data["dates"],
    )
    assert val["is_valid"] is True
    assert val["hard_violations_count"] == 0


def test_2_no_simultaneous_exams_for_same_student_group(sample_csp_data):
    """Scenario 2: No simultaneous exams for the same student group or shared groups."""
    data = sample_csp_data
    scheduler = CSPScheduler(
        exams=data["exams"],
        rooms=data["rooms"],
        groups=data["groups"],
        slots=data["slots"],
        dates=data["dates"],
        config=data["config"],
    )
    result = scheduler.solve()
    assert result["status"] == "SUCCESS"

    exam_dict = {e["id"]: e for e in data["exams"]}
    conflict_map = build_student_group_conflict_map(data["groups"])

    # Group assignments by (date, slot_id)
    slot_assignments = {}
    for eid, (date, slot_id, _) in result["assignments"].items():
        key = (date, slot_id)
        if key not in slot_assignments:
            slot_assignments[key] = []
        slot_assignments[key].append(eid)

    # Verify no two exams at same (date, slot) have student group overlap
    for (d, s), eids in slot_assignments.items():
        for i in range(len(eids)):
            for j in range(i + 1, len(eids)):
                e1 = exam_dict[eids[i]]
                e2 = exam_dict[eids[j]]
                overlap = have_student_conflict(
                    e1["student_group_codes"],
                    e2["student_group_codes"],
                    conflict_map,
                )
                assert not overlap, f"Conflict: {e1['code']} and {e2['code']} overlap at {d} Slot {s}"


def test_3_no_simultaneous_use_of_same_room(sample_csp_data):
    """Scenario 3: No simultaneous use of the same room."""
    data = sample_csp_data
    scheduler = CSPScheduler(
        exams=data["exams"],
        rooms=data["rooms"],
        groups=data["groups"],
        slots=data["slots"],
        dates=data["dates"],
        config=data["config"],
    )
    result = scheduler.solve()
    assert result["status"] == "SUCCESS"

    room_occupancies = set()
    for eid, (date, slot_id, room_id) in result["assignments"].items():
        occupancy_key = (date, slot_id, room_id)
        assert occupancy_key not in room_occupancies, f"Room collision detected for key {occupancy_key}"
        room_occupancies.add(occupancy_key)


def test_4_insufficient_room_capacity_rejection(sample_csp_data):
    """Scenario 4: Rejects putting an exam in an undersized room and handles oversize exams."""
    data = sample_csp_data
    room_dict = {r["id"]: r for r in data["rooms"]}
    # Add an exam that requires 100 capacity when max room is 60
    large_exam = {
        "id": 99,
        "code": "LARGE99",
        "name": "Massive Lecture",
        "student_group_codes": ["LARGE-GRP"],
        "student_count": 100,
        "duration_slots": 1,
        "permitted_dates": [],
        "permitted_slots": [],
        "required_room_type": None,
        "required_facilities": [],
    }
    exams_with_large = data["exams"] + [large_exam]

    scheduler = CSPScheduler(
        exams=exams_with_large,
        rooms=data["rooms"],
        groups=data["groups"],
        slots=data["slots"],
        dates=data["dates"],
        config=data["config"],
    )
    result = scheduler.solve()
    # Must be INFEASIBLE because LARGE99 cannot fit in any room
    assert result["status"] == "INFEASIBLE"
    assert "infeasibility_reason" in result


def test_5_room_availability_restrictions(sample_csp_data):
    """Scenario 5: Room availability restrictions (date blackouts and slot restrictions)."""
    data = sample_csp_data
    # Restrict LAB1 (room_id=3) so it's unavailable on 2026-11-16:1 and 2026-11-16:2
    data["rooms"][2]["unavailable_slots"] = ["2026-11-16:1", "2026-11-16:2"]

    scheduler = CSPScheduler(
        exams=data["exams"],
        rooms=data["rooms"],
        groups=data["groups"],
        slots=data["slots"],
        dates=data["dates"],
        config=data["config"],
    )
    result = scheduler.solve()
    assert result["status"] == "SUCCESS"

    # Exam 4 requires LAB1 (Computer Lab). Ensure it was NOT scheduled on 2026-11-16
    assigned_date, assigned_slot, assigned_room = result["assignments"][4]
    assert assigned_room == 3
    assert assigned_date != "2026-11-16", f"Restricted room was assigned on blackout date {assigned_date}"


def test_6_mrv_and_backtracking_behavior(sample_csp_data):
    """Scenario 6: MRV prioritizes exams with constrained domains and logs backtracks."""
    data = sample_csp_data
    # Make exam 4 highly constrained (only permitted on 1 date and 1 slot)
    data["exams"][3]["permitted_dates"] = ["2026-11-18"]
    data["exams"][3]["permitted_slots"] = [1]

    scheduler = CSPScheduler(
        exams=data["exams"],
        rooms=data["rooms"],
        groups=data["groups"],
        slots=data["slots"],
        dates=data["dates"],
        config=data["config"],
    )
    result = scheduler.solve()
    assert result["status"] == "SUCCESS"

    # The decision logs should record MRV selection
    logs = result["decision_logs"]
    first_var_log = next((l for l in logs if l["event"] == "SELECT_VARIABLE"), None)
    assert first_var_log is not None
    # Exam 4 has the smallest domain (only 1 valid date & slot in LAB1)
    assert first_var_log["exam_code"] == "CS103-LAB"


def test_7_impossible_scheduling_scenarios(sample_csp_data):
    """Scenario 7: Provably impossible scheduling scenarios report INFEASIBLE (not TIMEOUT)."""
    # 5 conflicting exams, but only 1 day and 1 slot available with 1 room
    tight_exams = [
        {"id": i, "code": f"T{i}", "name": f"Tight {i}", "student_group_codes": ["GRP-A"], "student_count": 30,
         "duration_slots": 1, "permitted_dates": [], "permitted_slots": [], "required_room_type": None, "required_facilities": []}
        for i in range(1, 6)
    ]
    tight_rooms = [{"id": 1, "room_number": "R1", "name": "Room 1", "capacity": 50, "room_type": "Classroom",
                    "facilities": [], "available_dates": [], "unavailable_slots": [], "is_active": True}]
    tight_slots = [{"id": 1, "slot_number": 1, "name": "Slot 1", "start_time": "09:00", "end_time": "12:00", "is_active": True}]
    tight_dates = ["2026-11-16"]

    scheduler = CSPScheduler(
        exams=tight_exams,
        rooms=tight_rooms,
        groups=[{"id": 1, "code": "GRP-A", "name": "Batch A", "student_count": 30, "shared_conflict_groups": []}],
        slots=tight_slots,
        dates=tight_dates,
        config={"max_search_seconds": 3.0, "max_backtracks": 500},
    )
    result = scheduler.solve()
    assert result["status"] == "INFEASIBLE"
    assert result["metrics"]["proven_infeasible"] is True


def test_8_every_required_exam_scheduled_exactly_once(sample_csp_data):
    """Scenario 8: Every required exam is scheduled exactly once with no duplicates."""
    data = sample_csp_data
    scheduler = CSPScheduler(
        exams=data["exams"],
        rooms=data["rooms"],
        groups=data["groups"],
        slots=data["slots"],
        dates=data["dates"],
        config=data["config"],
    )
    result = scheduler.solve()
    assert result["status"] == "SUCCESS"
    assert len(result["assignments"]) == len(data["exams"])
    # All exam IDs must be present in the keys
    expected_ids = set(e["id"] for e in data["exams"])
    actual_ids = set(result["assignments"].keys())
    assert actual_ids == expected_ids
