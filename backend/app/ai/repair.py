"""AI Timetable Repair Engine.

Preserves locked assignments as rigid constraints and re-solves remaining
examinations to eliminate manual conflicts while preserving user customizations.
"""
from typing import Dict, List, Tuple, Any
from backend.app.ai.csp_solver import CSPScheduler
from backend.app.ai.constraints import validate_timetable_independently


def repair_timetable(
    assignments: List[Dict[str, Any]],
    exams: List[Dict[str, Any]],
    rooms: List[Dict[str, Any]],
    groups: List[Dict[str, Any]],
    slots: List[Dict[str, Any]],
    dates: List[str],
    config: Dict[str, Any],
    keep_locked: bool = True,
) -> Dict[str, Any]:
    """Repairs conflicts in a timetable.
    
    If keep_locked is True, all assignments marked is_locked=True are frozen
    and treated as hard constants during re-solving.
    """
    locked_map: Dict[int, Tuple[str, int, int]] = {}

    if keep_locked:
        for a in assignments:
            if a.get("is_locked") and a.get("date") and a.get("slot_id") and a.get("room_id"):
                locked_map[a["exam_id"]] = (a["date"], a["slot_id"], a["room_id"])

    # Instantiate CSPScheduler with locked assignments
    scheduler = CSPScheduler(
        exams=exams,
        rooms=rooms,
        groups=groups,
        slots=slots,
        dates=dates,
        config=config,
        locked_assignments=locked_map,
    )

    result = scheduler.solve()
    return result
