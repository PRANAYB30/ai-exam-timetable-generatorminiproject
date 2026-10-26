"""Constraint definitions, validators, and soft constraint penalty calculators."""
from typing import Dict, List, Tuple, Set, Optional, Any
from collections import defaultdict
import math


def build_student_group_conflict_map(groups: List[Dict[str, Any]]) -> Dict[str, Set[str]]:
    """Builds a symmetric lookup map of student groups that conflict with each other.
    
    If group A explicitly lists group B as a shared-conflict group, both A and B conflict.
    Also, any group trivially conflicts with itself.
    """
    conflict_map = defaultdict(set)
    for g in groups:
        code = g.get("code")
        if not code:
            continue
        conflict_map[code].add(code)
        shared = g.get("shared_conflict_groups", []) or []
        for s in shared:
            conflict_map[code].add(s)
            conflict_map[s].add(code)
    return conflict_map


def have_student_conflict(
    groups_1: List[str],
    groups_2: List[str],
    group_conflict_map: Dict[str, Set[str]],
) -> bool:
    """Checks if two exams have any overlapping or conflicting student groups."""
    for g1 in groups_1:
        conflicts = group_conflict_map.get(g1, {g1})
        for g2 in groups_2:
            if g2 in conflicts:
                return True
    return False


def is_assignment_consistent(
    exam_id: int,
    val: Tuple[str, int, int],  # (date, slot_id, room_id)
    current_assignments: Dict[int, Tuple[str, int, int]],
    exam_dict: Dict[int, Dict[str, Any]],
    room_dict: Dict[int, Dict[str, Any]],
    group_conflict_map: Dict[str, Set[str]],
) -> Tuple[bool, Optional[str]]:
    """Checks all hard constraints for assigning exam_id to val = (date, slot_id, room_id).
    
    Returns (is_consistent, failure_reason).
    """
    date, slot_id, room_id = val
    exam = exam_dict[exam_id]
    room = room_dict[room_id]

    # Hard Constraint 1: Room capacity
    if room["capacity"] < exam["student_count"]:
        return False, f"Room {room['room_number']} capacity ({room['capacity']}) < exam student count ({exam['student_count']})"

    # Hard Constraint 2: Room type compatibility (if specified)
    req_type = exam.get("required_room_type")
    if req_type and req_type.strip() and req_type.lower() != "any":
        if room.get("room_type", "").lower() != req_type.lower():
            return False, f"Room {room['room_number']} type ({room.get('room_type')}) != required ({req_type})"

    # Hard Constraint 3: Room facilities (if required)
    req_facilities = set(f.lower() for f in exam.get("required_facilities", []) or [])
    room_facilities = set(f.lower() for f in room.get("facilities", []) or [])
    if req_facilities and not req_facilities.issubset(room_facilities):
        missing = req_facilities - room_facilities
        return False, f"Room {room['room_number']} missing facilities: {', '.join(missing)}"

    # Hard Constraint 4: Room availability on date & slot
    available_dates = room.get("available_dates", []) or []
    if available_dates and date not in available_dates:
        return False, f"Room {room['room_number']} is not available on date {date}"

    unavailable_slots = room.get("unavailable_slots", []) or []
    if f"{date}:{slot_id}" in unavailable_slots:
        return False, f"Room {room['room_number']} is restricted on {date} slot {slot_id}"

    # Hard Constraint 5: Permitted dates for exam
    permitted_dates = exam.get("permitted_dates", []) or []
    if permitted_dates and date not in permitted_dates:
        return False, f"Exam {exam['code']} is not permitted on date {date}"

    # Hard Constraint 6: Permitted slots for exam
    permitted_slots = exam.get("permitted_slots", []) or []
    if permitted_slots and slot_id not in permitted_slots:
        return False, f"Exam {exam['code']} is not permitted in slot {slot_id}"

    # Hard Constraint 7: Conflicts with other currently assigned exams
    for other_id, other_val in current_assignments.items():
        if other_id == exam_id:
            continue
        other_date, other_slot, other_room = other_val
        
        # Room collision: Two simultaneous exams in the same room
        if date == other_date and slot_id == other_slot and room_id == other_room:
            other_exam = exam_dict[other_id]
            return False, f"Room conflict: Room {room['room_number']} already assigned to {other_exam['code']} at {date} Slot {slot_id}"

        # Student group collision: Two simultaneous exams for same student group
        if date == other_date and slot_id == other_slot:
            other_exam = exam_dict[other_id]
            if have_student_conflict(
                exam.get("student_group_codes", []),
                other_exam.get("student_group_codes", []),
                group_conflict_map,
            ):
                return False, f"Student clash: {exam['code']} and {other_exam['code']} share student groups at {date} Slot {slot_id}"

    return True, None


def calculate_soft_penalty(
    assignments: Dict[int, Tuple[str, int, int]],
    exam_dict: Dict[int, Dict[str, Any]],
    room_dict: Dict[int, Dict[str, Any]],
    group_conflict_map: Dict[str, Set[str]],
    all_dates: List[str],
    weight_gap: float = 10.0,
    weight_distribution: float = 5.0,
    weight_utilization: float = 3.0,
) -> Tuple[float, Dict[str, float]]:
    """Calculates real soft-constraint penalty score.
    Lower score = higher quality timetable.
    
    1. Gap penalty:
       - 2 exams on the exact same day for the same group: +15 penalty
       - Consecutive calendar days without gap: +5 penalty
    2. Distribution penalty:
       - Variance of examinations scheduled per day across the available period
    3. Room utilization penalty:
       - Ratio of unused seats in assigned room: (capacity - students) / capacity
    """
    if not assignments:
        return 0.0, {"gap": 0.0, "distribution": 0.0, "utilization": 0.0}

    # 1. Gap Penalty
    # Map each student group to list of (date, slot_id)
    group_schedules = defaultdict(list)
    for exam_id, (date, slot_id, _) in assignments.items():
        exam = exam_dict[exam_id]
        for g in exam.get("student_group_codes", []):
            group_schedules[g].append((date, slot_id))

    gap_penalty = 0.0
    # Sort dates to measure day distances
    sorted_dates = sorted(list(set(all_dates)))
    date_to_idx = {d: i for i, d in enumerate(sorted_dates)}

    for group, slots in group_schedules.items():
        if len(slots) <= 1:
            continue
        # Check pairs
        for i in range(len(slots)):
            d1, s1 = slots[i]
            idx1 = date_to_idx.get(d1, 0)
            for j in range(i + 1, len(slots)):
                d2, s2 = slots[j]
                idx2 = date_to_idx.get(d2, 0)
                
                day_diff = abs(idx1 - idx2)
                if day_diff == 0:
                    # Same day multiple exams for same group!
                    gap_penalty += 15.0
                elif day_diff == 1:
                    # Consecutive days (0 gap days in between)
                    gap_penalty += 5.0

    # 2. Daily Distribution Variance Penalty
    date_counts = defaultdict(int)
    for d in all_dates:
        date_counts[d] = 0
    for exam_id, (date, _, _) in assignments.items():
        date_counts[date] += 1

    counts = list(date_counts.values())
    if counts:
        mean_exams = sum(counts) / len(counts)
        variance = sum((c - mean_exams) ** 2 for c in counts) / len(counts)
        dist_penalty = round(variance * 2.0, 2)
    else:
        dist_penalty = 0.0

    # 3. Room Utilization Penalty
    util_penalty = 0.0
    for exam_id, (_, _, room_id) in assignments.items():
        exam = exam_dict[exam_id]
        room = room_dict[room_id]
        cap = room["capacity"]
        count = exam["student_count"]
        if cap > count:
            unused_ratio = (cap - count) / cap
            util_penalty += unused_ratio * 4.0

    total_penalty = round(
        (weight_gap * (gap_penalty / 10.0)) +
        (weight_distribution * dist_penalty) +
        (weight_utilization * (util_penalty / max(1, len(assignments)))),
        2
    )

    return total_penalty, {
        "gap": round(gap_penalty, 2),
        "distribution": round(dist_penalty, 2),
        "utilization": round(util_penalty, 2),
    }


def validate_timetable_independently(
    assignments: List[Dict[str, Any]],  # list of assignment dicts with exam_id, date, slot_id, room_id
    exams: List[Dict[str, Any]],
    rooms: List[Dict[str, Any]],
    groups: List[Dict[str, Any]],
    slots: List[Dict[str, Any]],
    all_dates: List[str],
) -> Dict[str, Any]:
    """Runs an independent, rigorous validation check across all assignments.
    
    Detects any hard constraint violations, calculates soft penalties,
    and produces human-readable diagnostic messages and suggested corrective actions.
    """
    exam_dict = {e["id"]: e for e in exams}
    room_dict = {r["id"]: r for r in rooms}
    slot_dict = {s["id"]: s for s in slots}
    group_conflict_map = build_student_group_conflict_map(groups)

    conflicts: List[Dict[str, Any]] = []
    hard_violations = 0

    assigned_exam_ids = set()
    room_slot_map = defaultdict(list)  # (date, slot_id, room_id) -> list of exam_ids
    group_slot_map = defaultdict(list)  # (date, slot_id, group_code) -> list of exam_ids

    assignment_tuples = {}

    for item in assignments:
        exam_id = item.get("exam_id")
        date = item.get("date")
        slot_id = item.get("slot_id")
        room_id = item.get("room_id")

        if not exam_id or exam_id not in exam_dict:
            continue

        exam = exam_dict[exam_id]

        if not date or not slot_id or not room_id:
            conflicts.append({
                "type": "UNSCHEDULED_EXAM",
                "severity": "HARD",
                "message": f"Examination '{exam['code']}: {exam['name']}' has not been assigned a valid date, slot, or room.",
                "affected_exam_ids": [exam_id],
                "affected_exam_codes": [exam["code"]],
                "suggested_action": f"Assign a date, time slot, and room with capacity >= {exam['student_count']}.",
            })
            hard_violations += 1
            continue

        assigned_exam_ids.add(exam_id)
        assignment_tuples[exam_id] = (date, slot_id, room_id)

        # Check Room Existence
        if room_id not in room_dict:
            conflicts.append({
                "type": "INVALID_ROOM",
                "severity": "HARD",
                "message": f"Exam '{exam['code']}' references nonexistent room ID {room_id}.",
                "affected_exam_ids": [exam_id],
                "affected_exam_codes": [exam["code"]],
                "suggested_action": "Select a valid room from the active room inventory.",
            })
            hard_violations += 1
            continue

        room = room_dict[room_id]

        # Check Room Capacity
        if room["capacity"] < exam["student_count"]:
            conflicts.append({
                "type": "CAPACITY_DEFICIT",
                "severity": "HARD",
                "message": f"Capacity violation: Room '{room['room_number']}' has capacity {room['capacity']}, but exam '{exam['code']}' requires {exam['student_count']} seats.",
                "affected_exam_ids": [exam_id],
                "affected_exam_codes": [exam["code"]],
                "suggested_action": f"Reassign '{exam['code']}' to a larger hall with at least {exam['student_count']} capacity.",
            })
            hard_violations += 1

        # Check Room Type
        req_type = exam.get("required_room_type")
        if req_type and req_type.strip() and req_type.lower() != "any":
            if room.get("room_type", "").lower() != req_type.lower():
                conflicts.append({
                    "type": "FACILITY_MISMATCH",
                    "severity": "HARD",
                    "message": f"Room type mismatch: Exam '{exam['code']}' requires '{req_type}', but '{room['room_number']}' is a '{room.get('room_type')}'.",
                    "affected_exam_ids": [exam_id],
                    "affected_exam_codes": [exam["code"]],
                    "suggested_action": f"Assign '{exam['code']}' to a room matching type '{req_type}'.",
                })
                hard_violations += 1

        # Check Facilities
        req_fac = set(f.lower() for f in exam.get("required_facilities", []) or [])
        room_fac = set(f.lower() for f in room.get("facilities", []) or [])
        if req_fac and not req_fac.issubset(room_fac):
            missing = req_fac - room_fac
            conflicts.append({
                "type": "FACILITY_MISMATCH",
                "severity": "HARD",
                "message": f"Facility deficit: Exam '{exam['code']}' requires {list(missing)}, not available in room '{room['room_number']}'.",
                "affected_exam_ids": [exam_id],
                "affected_exam_codes": [exam["code"]],
                "suggested_action": f"Move to a room providing {', '.join(missing)}.",
            })
            hard_violations += 1

        # Check Room Availability
        avail_dates = room.get("available_dates", []) or []
        if avail_dates and date not in avail_dates:
            conflicts.append({
                "type": "DATE_SLOT_UNAVAILABLE",
                "severity": "HARD",
                "message": f"Room '{room['room_number']}' is unavailable on {date}.",
                "affected_exam_ids": [exam_id],
                "affected_exam_codes": [exam["code"]],
                "suggested_action": f"Reschedule to an available date for {room['room_number']}.",
            })
            hard_violations += 1

        unavail_slots = room.get("unavailable_slots", []) or []
        if f"{date}:{slot_id}" in unavail_slots:
            conflicts.append({
                "type": "DATE_SLOT_UNAVAILABLE",
                "severity": "HARD",
                "message": f"Room '{room['room_number']}' has a blackout restriction on {date} Slot {slot_id}.",
                "affected_exam_ids": [exam_id],
                "affected_exam_codes": [exam["code"]],
                "suggested_action": "Select another slot or different room.",
            })
            hard_violations += 1

        # Permitted dates / slots
        perm_dates = exam.get("permitted_dates", []) or []
        if perm_dates and date not in perm_dates:
            conflicts.append({
                "type": "PERMITTED_DATE_VIOLATION",
                "severity": "HARD",
                "message": f"Exam '{exam['code']}' is restricted from being held on {date}.",
                "affected_exam_ids": [exam_id],
                "affected_exam_codes": [exam["code"]],
                "suggested_action": f"Move exam to permitted dates: {', '.join(perm_dates)}.",
            })
            hard_violations += 1

        perm_slots = exam.get("permitted_slots", []) or []
        if perm_slots and slot_id not in perm_slots:
            conflicts.append({
                "type": "PERMITTED_SLOT_VIOLATION",
                "severity": "HARD",
                "message": f"Exam '{exam['code']}' is restricted from slot {slot_id}.",
                "affected_exam_ids": [exam_id],
                "affected_exam_codes": [exam["code"]],
                "suggested_action": f"Move exam to permitted slots: {perm_slots}.",
            })
            hard_violations += 1

        # Track room double booking
        room_slot_map[(date, slot_id, room_id)].append(exam_id)

        # Track student group clashes
        for g_code in exam.get("student_group_codes", []):
            group_slot_map[(date, slot_id, g_code)].append(exam_id)

    # Check for Room Overbooking collisions
    for (d, s, r_id), e_ids in room_slot_map.items():
        if len(e_ids) > 1:
            r_name = room_dict.get(r_id, {}).get("room_number", f"Room {r_id}")
            codes = [exam_dict[eid]["code"] for eid in e_ids]
            conflicts.append({
                "type": "ROOM_OVERBOOKING",
                "severity": "HARD",
                "message": f"Room collision: Room '{r_name}' is double-booked on {d} Slot {s} by exams {', '.join(codes)}.",
                "affected_exam_ids": e_ids,
                "affected_exam_codes": codes,
                "suggested_action": f"Move one of the colliding exams ({', '.join(codes)}) to a different room or time slot.",
            })
            hard_violations += len(e_ids) - 1

    # Check for Student Group Clashes (direct and via shared conflict relations)
    checked_clash_pairs = set()
    for (d, s, g_code), e_ids in group_slot_map.items():
        if len(e_ids) > 1:
            for i in range(len(e_ids)):
                for j in range(i + 1, len(e_ids)):
                    pair = tuple(sorted([e_ids[i], e_ids[j]]))
                    if pair not in checked_clash_pairs:
                        checked_clash_pairs.add(pair)
                        code1 = exam_dict[e_ids[i]]["code"]
                        code2 = exam_dict[e_ids[j]]["code"]
                        conflicts.append({
                            "type": "STUDENT_GROUP_CLASH",
                            "severity": "HARD",
                            "message": f"Student clash: Exams '{code1}' and '{code2}' share group '{g_code}' and are both scheduled at {d} Slot {s}.",
                            "affected_exam_ids": list(pair),
                            "affected_exam_codes": [code1, code2],
                            "suggested_action": f"Shift either '{code1}' or '{code2}' to a different time slot or date.",
                        })
                        hard_violations += 1

    # Check cross-group conflict relations at same (date, slot)
    for i in range(len(assignments)):
        for j in range(i + 1, len(assignments)):
            e1_id = assignments[i].get("exam_id")
            e2_id = assignments[j].get("exam_id")
            d1 = assignments[i].get("date")
            s1 = assignments[i].get("slot_id")
            d2 = assignments[j].get("date")
            s2 = assignments[j].get("slot_id")

            if d1 and s1 and d1 == d2 and s1 == s2 and e1_id and e2_id:
                pair = tuple(sorted([e1_id, e2_id]))
                if pair not in checked_clash_pairs:
                    e1 = exam_dict.get(e1_id)
                    e2 = exam_dict.get(e2_id)
                    if e1 and e2 and have_student_conflict(
                        e1.get("student_group_codes", []),
                        e2.get("student_group_codes", []),
                        group_conflict_map,
                    ):
                        checked_clash_pairs.add(pair)
                        conflicts.append({
                            "type": "STUDENT_GROUP_CLASH",
                            "severity": "HARD",
                            "message": f"Shared student conflict: Exams '{e1['code']}' and '{e2['code']}' have overlapping student batches and cannot be simultaneous at {d1} Slot {s1}.",
                            "affected_exam_ids": list(pair),
                            "affected_exam_codes": [e1["code"], e2["code"]],
                            "suggested_action": f"Separate '{e1['code']}' and '{e2['code']}' into distinct time slots.",
                        })
                        hard_violations += 1

    # Check Unscheduled Exams
    all_exam_ids = set(exam_dict.keys())
    missing_ids = all_exam_ids - assigned_exam_ids
    for m_id in missing_ids:
        m_exam = exam_dict[m_id]
        conflicts.append({
            "type": "UNSCHEDULED_EXAM",
            "severity": "HARD",
            "message": f"Mandatory examination '{m_exam['code']}: {m_exam['name']}' is not scheduled in the timetable.",
            "affected_exam_ids": [m_id],
            "affected_exam_codes": [m_exam["code"]],
            "suggested_action": "Run AI scheduler or manually assign a slot and room.",
        })
        hard_violations += 1

    # Compute soft penalties
    soft_penalty, penalty_details = calculate_soft_penalty(
        assignment_tuples,
        exam_dict,
        room_dict,
        group_conflict_map,
        all_dates,
    )

    is_valid = (hard_violations == 0 and len(missing_ids) == 0)
    summary = "Timetable is completely valid with 0 hard-constraint violations." if is_valid else f"Detected {hard_violations} hard-constraint violation(s) requiring resolution."

    return {
        "is_valid": is_valid,
        "hard_violations_count": hard_violations,
        "soft_penalty_score": soft_penalty,
        "penalty_details": penalty_details,
        "conflicts": conflicts,
        "summary": summary,
    }
