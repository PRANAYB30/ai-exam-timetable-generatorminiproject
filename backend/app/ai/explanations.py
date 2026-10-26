"""AI Decision Explanation Generator.

Transforms raw solver execution traces, MRV selections, LCV rankings,
and forward-checking prunes into transparent, academic explanations for college vivas and reports.
"""
from typing import Dict, List, Any
from collections import defaultdict


def generate_ai_explanation(
    solver_result: Dict[str, Any],
    exams: List[Dict[str, Any]],
    rooms: List[Dict[str, Any]],
    groups: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Generates an academic, transparent summary explaining how the AI scheduler arrived at its timetable."""
    status = solver_result.get("status", "UNKNOWN")
    metrics = solver_result.get("metrics", {})
    decision_logs = solver_result.get("decision_logs", [])
    assignments = solver_result.get("assignments", {})
    soft_penalty = solver_result.get("soft_penalty_score", 0.0)
    penalty_details = solver_result.get("penalty_details", {})

    total_exams = len(exams)
    scheduled_count = len(assignments)

    # Analyze MRV and Degree decisions
    first_selection = None
    variable_selections = []
    backtrack_points = []
    lcv_insights = []

    for log in decision_logs:
        evt = log.get("event")
        if evt == "SELECT_VARIABLE":
            if first_selection is None:
                first_selection = log
            variable_selections.append(log)
        elif evt == "BACKTRACK":
            backtrack_points.append(log)
        elif evt == "ASSIGN":
            lcv_insights.append(log)

    # Key highlights
    highlights = []
    if first_selection:
        highlights.append(
            f"Initial Selection: Examination '{first_selection.get('exam_code')}' was chosen first "
            f"because it possessed the tightest constraint profile (MRV / Degree heuristic)."
        )

    if backtrack_points:
        highlights.append(
            f"Search Recovery: The backtracking engine encountered {len(backtrack_points)} dead-end states "
            f"and successfully pruned incompatible branches via Forward Checking without infinite looping."
        )
    else:
        highlights.append(
            "Optimal Path: The combination of MRV and LCV enabled a deterministic path to a conflict-free solution with 0 backtracks."
        )

    if status == "SUCCESS":
        summary_text = (
            f"A valid, conflict-free timetable scheduling all {total_exams} examinations was generated "
            f"in {metrics.get('execution_time_ms', 0)}ms. "
            f"All hard constraints (student group concurrency, room collisions, capacities, and facilities) "
            f"were 100% satisfied with an optimization soft penalty score of {soft_penalty}."
        )
    elif status == "INFEASIBLE":
        summary_text = (
            f"The CSP solver proved that no mathematically valid timetable exists under current constraints. "
            f"{solver_result.get('infeasibility_reason', 'Domain exhaustion occurred.')}"
        )
    else:
        summary_text = (
            f"Search timeout after {metrics.get('execution_time_ms', 0)}ms. "
            f"The allotted search budget was reached before finding a complete assignment."
        )

    # Group examinations per day
    day_distribution = defaultdict(int)
    for eid, (d, s, r) in assignments.items():
        day_distribution[d] += 1

    return {
        "status": status,
        "summary": summary_text,
        "first_variable_selected": first_selection,
        "total_backtracks": metrics.get("backtracks_count", 0),
        "total_assignments_tried": metrics.get("assignments_attempted", 0),
        "total_constraint_checks": metrics.get("constraint_checks_count", 0),
        "execution_time_ms": metrics.get("execution_time_ms", 0),
        "soft_penalty_score": soft_penalty,
        "soft_penalty_breakdown": penalty_details,
        "highlights": highlights,
        "days_utilized": len(day_distribution),
        "day_distribution": dict(day_distribution),
        "algorithm_components": [
            {
                "name": "Constraint Satisfaction Problem (CSP)",
                "role": "Formalizes examinations as variables, (Date, Slot, Room) as values, and rules as strict constraints.",
            },
            {
                "name": "Minimum Remaining Values (MRV)",
                "role": "Picks the variable with fewest remaining legal values (fail-first principle).",
            },
            {
                "name": "Degree Heuristic",
                "role": "Tie-breaker prioritizing exams with the highest number of conflicting unassigned neighbors.",
            },
            {
                "name": "Least Constraining Value (LCV)",
                "role": "Orders domain values to minimize pruning of options for neighboring unassigned exams.",
            },
            {
                "name": "Forward Checking",
                "role": "Filters neighbor domains after every assignment; detects domain wipeout immediately to trigger backtracking.",
            },
        ],
    }
