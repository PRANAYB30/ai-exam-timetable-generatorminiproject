"""Genuine CSP Backtracking Solver for Examination Timetable Generation.

Features:
- Constraint Satisfaction Problem (CSP) formulation
- Variable domains generated from dates, slots, and rooms
- Minimum Remaining Values (MRV) variable selection
- Degree Heuristic tie-breaker
- Least Constraining Value (LCV) value ordering
- Forward Checking domain reduction with rollback
- Hard constraint validation & soft constraint optimization
- Bounded search budget (time limit & max backtracks)
- Detailed decision trace logging for academic AI explanation
"""
import time
from typing import Dict, List, Tuple, Set, Optional, Any
from backend.app.ai.constraints import (
    build_student_group_conflict_map,
    is_assignment_consistent,
    calculate_soft_penalty,
)
from backend.app.ai.heuristics import (
    select_unassigned_variable,
    order_domain_values,
    forward_check,
    restore_pruned_domains,
)


class CSPScheduler:
    def __init__(
        self,
        exams: List[Dict[str, Any]],
        rooms: List[Dict[str, Any]],
        groups: List[Dict[str, Any]],
        slots: List[Dict[str, Any]],
        dates: List[str],
        config: Optional[Dict[str, Any]] = None,
        locked_assignments: Optional[Dict[int, Tuple[str, int, int]]] = None,
    ):
        self.exams = exams
        self.rooms = rooms
        self.groups = groups
        self.slots = slots
        self.dates = dates
        self.config = config or {}
        self.locked_assignments = locked_assignments or {}

        # Lookups
        self.exam_dict = {e["id"]: e for e in exams}
        self.room_dict = {r["id"]: r for r in rooms}
        self.slot_dict = {s["id"]: s for s in slots}
        self.group_conflict_map = build_student_group_conflict_map(groups)

        # Search budget
        self.max_search_seconds = float(self.config.get("max_search_seconds", 15.0))
        self.max_backtracks = int(self.config.get("max_backtracks", 10000))
        
        # Soft weights
        self.weight_gap = float(self.config.get("weight_gap", 10.0))
        self.weight_distribution = float(self.config.get("weight_distribution", 5.0))
        self.weight_utilization = float(self.config.get("weight_utilization", 3.0))

        # Metrics
        self.assignments_attempted = 0
        self.backtracks_count = 0
        self.constraint_checks_count = 0
        self.start_time = 0.0
        self.execution_time_ms = 0.0
        self.max_depth = 0
        self.timed_out = False
        self.proven_infeasible = False

        # AI Decision logs (capped to prevent memory bloat, but rich enough for UI analysis)
        self.decision_logs: List[Dict[str, Any]] = []
        self._log_counter = 0

    def _log_decision(self, event: str, exam_code: Optional[str], reason: str, details: Optional[Dict[str, Any]] = None):
        """Records an AI decision event."""
        self._log_counter += 1
        if len(self.decision_logs) < 250:  # store up to 250 decision steps for UI trace
            self.decision_logs.append({
                "step": self._log_counter,
                "event": event,
                "exam_code": exam_code,
                "reason": reason,
                "details": details or {},
            })

    def generate_initial_domains(self) -> Dict[int, List[Tuple[str, int, int]]]:
        """Generates domain values (date, slot_id, room_id) for each examination
        after filtering out inherently invalid options (capacity, facilities, room availability, permitted dates/slots).
        """
        domains: Dict[int, List[Tuple[str, int, int]]] = {}
        active_slots = [s for s in self.slots if s.get("is_active", True)]
        active_rooms = [r for r in self.rooms if r.get("is_active", True)]

        for exam in self.exams:
            exam_id = exam["id"]
            perm_dates = exam.get("permitted_dates", []) or self.dates
            perm_slots = exam.get("permitted_slots", []) or [s["id"] for s in active_slots]
            
            allowed_dates = [d for d in self.dates if d in perm_dates]
            allowed_slots = [s["id"] for s in active_slots if s["id"] in perm_slots]

            req_type = exam.get("required_room_type")
            req_fac = set(f.lower() for f in exam.get("required_facilities", []) or [])
            st_count = exam.get("student_count", 0)

            valid_values = []

            for date in allowed_dates:
                for slot_id in allowed_slots:
                    for room in active_rooms:
                        # 1. Capacity check
                        if room["capacity"] < st_count:
                            continue

                        # 2. Room type check
                        if req_type and req_type.strip() and req_type.lower() != "any":
                            if room.get("room_type", "").lower() != req_type.lower():
                                continue

                        # 3. Facilities check
                        room_fac = set(f.lower() for f in room.get("facilities", []) or [])
                        if req_fac and not req_fac.issubset(room_fac):
                            continue

                        # 4. Room availability dates check
                        avail_dates = room.get("available_dates", []) or []
                        if avail_dates and date not in avail_dates:
                            continue

                        # 5. Room unavailable slots check
                        unavail_slots = room.get("unavailable_slots", []) or []
                        if f"{date}:{slot_id}" in unavail_slots:
                            continue

                        valid_values.append((date, slot_id, room["id"]))

            domains[exam_id] = valid_values

        return domains

    def solve(self) -> Dict[str, Any]:
        """Executes the CSP backtracking search algorithm."""
        self.start_time = time.time()
        self.assignments_attempted = 0
        self.backtracks_count = 0
        self.constraint_checks_count = 0
        self.decision_logs = []
        self._log_counter = 0
        self.timed_out = False
        self.proven_infeasible = False

        if not self.exams:
            return {
                "status": "SUCCESS",
                "assignments": {},
                "metrics": self._build_metrics(0, 0),
                "decision_logs": [],
                "soft_penalty_score": 0.0,
                "penalty_details": {},
            }

        # 1. Build Initial Domains
        domains = self.generate_initial_domains()

        # Check for immediate domain wipeout before search
        for exam in self.exams:
            eid = exam["id"]
            if len(domains.get(eid, [])) == 0:
                self.proven_infeasible = True
                self._log_decision(
                    event="DEAD_END",
                    exam_code=exam["code"],
                    reason=f"Immediate infeasibility: Exam '{exam['code']}' has 0 valid domain values matching room capacities, facilities, or permitted slots.",
                    details={"student_count": exam["student_count"], "required_room_type": exam.get("required_room_type")},
                )
                self.execution_time_ms = round((time.time() - self.start_time) * 1000, 2)
                return {
                    "status": "INFEASIBLE",
                    "assignments": {},
                    "metrics": self._build_metrics(len(self.exams), 0),
                    "decision_logs": self.decision_logs,
                    "soft_penalty_score": 0.0,
                    "penalty_details": {},
                    "infeasibility_reason": f"No available room accommodates Exam '{exam['code']}' ({exam['name']}) with student count {exam['student_count']} and required facilities.",
                }

        current_assignments: Dict[int, Tuple[str, int, int]] = {}
        unassigned_exam_ids: Set[int] = set(self.exam_dict.keys())

        # 2. Process Locked Assignments (if any)
        for locked_id, locked_val in self.locked_assignments.items():
            if locked_id in unassigned_exam_ids:
                d, s, r = locked_val
                # Check consistency of locked assignment
                self.constraint_checks_count += 1
                consistent, reason = is_assignment_consistent(
                    locked_id,
                    locked_val,
                    current_assignments,
                    self.exam_dict,
                    self.room_dict,
                    self.group_conflict_map,
                )
                if not consistent:
                    self.proven_infeasible = True
                    self.execution_time_ms = round((time.time() - self.start_time) * 1000, 2)
                    return {
                        "status": "INFEASIBLE",
                        "assignments": {},
                        "metrics": self._build_metrics(len(self.exams), 0),
                        "decision_logs": self.decision_logs,
                        "soft_penalty_score": 0.0,
                        "penalty_details": {},
                        "infeasibility_reason": f"Locked assignment for exam '{self.exam_dict[locked_id]['code']}' violates constraints: {reason}",
                    }
                
                # Apply locked assignment
                current_assignments[locked_id] = locked_val
                unassigned_exam_ids.remove(locked_id)
                domains[locked_id] = [locked_val]

                # Forward check locked assignment
                feasible, pruned = forward_check(
                    locked_id,
                    locked_val,
                    domains,
                    unassigned_exam_ids,
                    self.exam_dict,
                    self.group_conflict_map,
                )
                if not feasible:
                    self.proven_infeasible = True
                    self.execution_time_ms = round((time.time() - self.start_time) * 1000, 2)
                    return {
                        "status": "INFEASIBLE",
                        "assignments": {},
                        "metrics": self._build_metrics(len(self.exams), 0),
                        "decision_logs": self.decision_logs,
                        "soft_penalty_score": 0.0,
                        "penalty_details": {},
                        "infeasibility_reason": f"Locked assignment for '{self.exam_dict[locked_id]['code']}' leaves no legal domain options for one or more other examinations.",
                    }

        # 3. Start Recursive Backtracking
        solution = self._backtrack(current_assignments, unassigned_exam_ids, domains, depth=1)

        self.execution_time_ms = round((time.time() - self.start_time) * 1000, 2)

        if solution is not None:
            penalty, penalty_details = calculate_soft_penalty(
                solution,
                self.exam_dict,
                self.room_dict,
                self.group_conflict_map,
                self.dates,
                self.weight_gap,
                self.weight_distribution,
                self.weight_utilization,
            )
            self._log_decision(
                event="SOLUTION_FOUND",
                exam_code=None,
                reason=f"Successfully found valid schedule for all {len(self.exams)} examinations satisfying 100% of hard constraints. Soft penalty score: {penalty}.",
                details={"soft_penalty_score": penalty},
            )
            return {
                "status": "SUCCESS",
                "assignments": solution,
                "metrics": self._build_metrics(len(self.exams), len(solution)),
                "decision_logs": self.decision_logs,
                "soft_penalty_score": penalty,
                "penalty_details": penalty_details,
            }
        else:
            if not self.timed_out:
                self.proven_infeasible = True
            status = "TIMEOUT" if self.timed_out else "INFEASIBLE"
            reason = (
                f"Search budget of {self.max_search_seconds}s or {self.max_backtracks} backtracks exhausted before a conflict-free timetable could be finalized."
                if self.timed_out
                else "Exhaustive backtracking search proved that no combination of dates, slots, and rooms can satisfy all hard constraints."
            )
            return {
                "status": status,
                "assignments": {},
                "metrics": self._build_metrics(len(self.exams), 0),
                "decision_logs": self.decision_logs,
                "soft_penalty_score": 0.0,
                "penalty_details": {},
                "infeasibility_reason": reason,
            }

    def _backtrack(
        self,
        current_assignments: Dict[int, Tuple[str, int, int]],
        unassigned_exam_ids: Set[int],
        domains: Dict[int, List[Tuple[str, int, int]]],
        depth: int,
    ) -> Optional[Dict[int, Tuple[str, int, int]]]:
        """Recursive Backtracking procedure with MRV, Degree Heuristic, LCV, and Forward Checking."""
        self.max_depth = max(self.max_depth, depth)

        # Base case: all variables assigned!
        if not unassigned_exam_ids:
            return current_assignments

        # Budget check
        if time.time() - self.start_time > self.max_search_seconds:
            self.timed_out = True
            return None

        if self.backtracks_count >= self.max_backtracks:
            self.timed_out = True
            return None

        # 1. Select Variable using MRV + Degree Heuristic
        selected_exam_id, decision_info = select_unassigned_variable(
            unassigned_exam_ids,
            domains,
            self.exam_dict,
            self.group_conflict_map,
        )
        exam = self.exam_dict[selected_exam_id]

        self._log_decision(
            event="SELECT_VARIABLE",
            exam_code=exam["code"],
            reason=decision_info["heuristic_reason"],
            details={
                "domain_size": decision_info["min_domain_size"],
                "degree": decision_info["degree"],
                "depth": depth,
            },
        )

        # Fail early if domain is empty
        if decision_info["min_domain_size"] == 0:
            self.backtracks_count += 1
            self._log_decision(
                event="BACKTRACK",
                exam_code=exam["code"],
                reason=f"Empty domain for exam '{exam['code']}'. Backtracking to previous assignment.",
                details={"depth": depth},
            )
            return None

        # 2. Order Candidate Values using LCV (Least Constraining Value)
        ordered_values = order_domain_values(
            selected_exam_id,
            domains,
            unassigned_exam_ids,
            self.exam_dict,
            self.room_dict,
            self.group_conflict_map,
            current_assignments,
        )

        # 3. Try each candidate value
        for val, eliminated_count, room_waste in ordered_values:
            # Check budget
            if time.time() - self.start_time > self.max_search_seconds or self.backtracks_count >= self.max_backtracks:
                self.timed_out = True
                return None

            date, slot_id, room_id = val
            room = self.room_dict[room_id]

            self.constraint_checks_count += 1
            consistent, fail_reason = is_assignment_consistent(
                selected_exam_id,
                val,
                current_assignments,
                self.exam_dict,
                self.room_dict,
                self.group_conflict_map,
            )

            if not consistent:
                continue

            # Tentatively assign
            self.assignments_attempted += 1
            current_assignments[selected_exam_id] = val
            unassigned_exam_ids.remove(selected_exam_id)

            self._log_decision(
                event="ASSIGN",
                exam_code=exam["code"],
                reason=(
                    f"Assigned '{exam['code']}' to {date} Slot {slot_id} Room '{room['room_number']}'. "
                    f"LCV score: eliminated {eliminated_count} options in neighboring unassigned domains."
                ),
                details={
                    "date": date,
                    "slot_id": slot_id,
                    "room_number": room["room_number"],
                    "eliminated_count": eliminated_count,
                    "depth": depth,
                },
            )

            # 4. Forward Checking: prune incompatible values from remaining domains
            feasible, pruned = forward_check(
                selected_exam_id,
                val,
                domains,
                unassigned_exam_ids,
                self.exam_dict,
                self.group_conflict_map,
            )

            if feasible:
                # Recurse
                result = self._backtrack(current_assignments, unassigned_exam_ids, domains, depth + 1)
                if result is not None:
                    return result

            # Backtrack: restore pruned domains and unassign
            restore_pruned_domains(domains, pruned)
            del current_assignments[selected_exam_id]
            unassigned_exam_ids.add(selected_exam_id)
            self.backtracks_count += 1

            self._log_decision(
                event="BACKTRACK",
                exam_code=exam["code"],
                reason=f"Subtree exhausted for assignment '{exam['code']}' at {date} Slot {slot_id}. Undoing assignment.",
                details={"depth": depth, "backtracks_count": self.backtracks_count},
            )

        # No valid assignment in domain worked at this point
        return None

    def _build_metrics(self, total_exams: int, scheduled_exams: int) -> Dict[str, Any]:
        return {
            "execution_time_ms": self.execution_time_ms,
            "backtracks_count": self.backtracks_count,
            "assignments_attempted": self.assignments_attempted,
            "constraint_checks_count": self.constraint_checks_count,
            "total_exams": total_exams,
            "scheduled_exams": scheduled_exams,
            "max_search_depth": self.max_depth,
            "timed_out": self.timed_out,
            "proven_infeasible": self.proven_infeasible,
        }
