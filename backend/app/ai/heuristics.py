"""CSP Heuristics: MRV, Degree Heuristic, LCV, and Forward Checking."""
from typing import Dict, List, Tuple, Set, Optional, Any
from backend.app.ai.constraints import have_student_conflict


def calculate_conflict_degree(
    exam_id: int,
    unassigned_exam_ids: Set[int],
    exam_dict: Dict[int, Dict[str, Any]],
    group_conflict_map: Dict[str, Set[str]],
) -> int:
    """Calculates the number of other unassigned examinations that share a student constraint.
    (Degree Heuristic)
    """
    exam = exam_dict[exam_id]
    degree = 0
    for other_id in unassigned_exam_ids:
        if other_id == exam_id:
            continue
        other_exam = exam_dict[other_id]
        if have_student_conflict(
            exam.get("student_group_codes", []),
            other_exam.get("student_group_codes", []),
            group_conflict_map,
        ):
            degree += 1
    return degree


def select_unassigned_variable(
    unassigned_exam_ids: Set[int],
    domains: Dict[int, List[Tuple[str, int, int]]],
    exam_dict: Dict[int, Dict[str, Any]],
    group_conflict_map: Dict[str, Set[str]],
) -> Tuple[int, Dict[str, Any]]:
    """Selects the next unassigned variable using:
    1. Minimum Remaining Values (MRV) - fail-first principle
    2. Degree Heuristic - tie-breaker favoring most constraining exam
    
    Returns (selected_exam_id, decision_explanation_dict).
    """
    if not unassigned_exam_ids:
        raise ValueError("No unassigned variables left to select.")

    best_exam_id = None
    min_domain_size = float("inf")
    max_degree = -1
    all_candidates_info = []

    for exam_id in sorted(list(unassigned_exam_ids)):
        domain_len = len(domains.get(exam_id, []))
        degree = calculate_conflict_degree(exam_id, unassigned_exam_ids, exam_dict, group_conflict_map)
        
        all_candidates_info.append({
            "exam_id": exam_id,
            "code": exam_dict[exam_id]["code"],
            "domain_size": domain_len,
            "degree": degree,
        })

        # MRV condition
        if domain_len < min_domain_size:
            min_domain_size = domain_len
            max_degree = degree
            best_exam_id = exam_id
        elif domain_len == min_domain_size:
            # Degree heuristic tie-breaker
            if degree > max_degree:
                max_degree = degree
                best_exam_id = exam_id

    decision = {
        "selected_exam_id": best_exam_id,
        "selected_code": exam_dict[best_exam_id]["code"],
        "min_domain_size": min_domain_size,
        "degree": max_degree,
        "heuristic_reason": (
            f"Selected exam '{exam_dict[best_exam_id]['code']}' using MRV (domain size {min_domain_size}) "
            f"and Degree Heuristic (conflicts with {max_degree} other unassigned exams)."
        ),
        "candidates_evaluated": len(all_candidates_info),
    }

    return best_exam_id, decision


def order_domain_values(
    exam_id: int,
    domains: Dict[int, List[Tuple[str, int, int]]],
    unassigned_exam_ids: Set[int],
    exam_dict: Dict[int, Dict[str, Any]],
    room_dict: Dict[int, Dict[str, Any]],
    group_conflict_map: Dict[str, Set[str]],
    current_assignments: Dict[int, Tuple[str, int, int]],
) -> List[Tuple[Tuple[str, int, int], int, float]]:
    """Orders domain values for the chosen variable using Least Constraining Value (LCV).
    
    For each candidate assignment val = (d, s, r):
    1. Counts how many domain values it eliminates from other unassigned variables.
    2. Measures capacity fitness: (room_capacity - student_count).
    
    Returns list of tuples: (val, ruled_out_count, room_waste)
    sorted ascending by ruled_out_count, then by room_waste.
    """
    candidate_values = domains.get(exam_id, [])
    if len(candidate_values) <= 1:
        return [(v, 0, 0.0) for v in candidate_values]

    exam = exam_dict[exam_id]
    other_unassigned = [eid for eid in unassigned_exam_ids if eid != exam_id]

    scored_values = []

    for val in candidate_values:
        d, s, r = val
        eliminated_count = 0
        
        # Room waste metric (prefer right-sized rooms)
        room_cap = room_dict[r]["capacity"]
        room_waste = (room_cap - exam["student_count"]) / max(1, room_cap)

        # Count eliminated domain options in neighbor unassigned exams
        for other_id in other_unassigned:
            other_exam = exam_dict[other_id]
            shares_group = have_student_conflict(
                exam.get("student_group_codes", []),
                other_exam.get("student_group_codes", []),
                group_conflict_map,
            )
            
            for other_val in domains.get(other_id, []):
                od, os, oroom = other_val
                # 1. Exact room collision at same time
                if od == d and os == s and oroom == r:
                    eliminated_count += 1
                # 2. Student group clash at same time
                elif od == d and os == s and shares_group:
                    eliminated_count += 1

        scored_values.append((val, eliminated_count, room_waste))

    # Sort primarily by least constraining (lowest eliminated_count),
    # secondarily by least room capacity waste
    scored_values.sort(key=lambda item: (item[1], item[2]))
    return scored_values


def forward_check(
    assigned_exam_id: int,
    assigned_val: Tuple[str, int, int],  # (date, slot_id, room_id)
    domains: Dict[int, List[Tuple[str, int, int]]],
    unassigned_exam_ids: Set[int],
    exam_dict: Dict[int, Dict[str, Any]],
    group_conflict_map: Dict[str, Set[str]],
) -> Tuple[bool, Dict[int, List[Tuple[str, int, int]]]]:
    """Prunes domain values of remaining unassigned variables incompatible with assigned_val.
    
    Returns:
    (feasible, pruned_dict)
    where:
    - feasible is False if any unassigned variable's domain becomes empty (wipeout).
    - pruned_dict maps exam_id -> list of values removed from its domain.
    """
    d, s, r = assigned_val
    assigned_exam = exam_dict[assigned_exam_id]
    pruned: Dict[int, List[Tuple[str, int, int]]] = {}

    for other_id in unassigned_exam_ids:
        if other_id == assigned_exam_id:
            continue

        other_exam = exam_dict[other_id]
        shares_group = have_student_conflict(
            assigned_exam.get("student_group_codes", []),
            other_exam.get("student_group_codes", []),
            group_conflict_map,
        )

        remaining = []
        removed = []

        for val in domains.get(other_id, []):
            vd, vs, vr = val
            
            # Prune condition 1: Same room at the same time
            if vd == d and vs == s and vr == r:
                removed.append(val)
            # Prune condition 2: Same student group at the same time
            elif vd == d and vs == s and shares_group:
                removed.append(val)
            else:
                remaining.append(val)

        if removed:
            pruned[other_id] = removed
            domains[other_id] = remaining

            # Domain wipeout detected! Forward checking fails immediately
            if len(remaining) == 0:
                return False, pruned

    return True, pruned


def restore_pruned_domains(
    domains: Dict[int, List[Tuple[str, int, int]]],
    pruned: Dict[int, List[Tuple[str, int, int]]],
) -> None:
    """Restores pruned domain values during backtracking."""
    for exam_id, removed_values in pruned.items():
        domains[exam_id].extend(removed_values)
