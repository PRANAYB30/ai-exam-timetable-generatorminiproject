# AI-Based Examination Timetable Generator — PBL-I

An intelligent, full-stack automated examination timetable scheduling platform built for college mini-projects (**Project-Based Learning - I**). The application models examination timetabling as a formal **Constraint Satisfaction Problem (CSP)** and solves it using **Recursive Backtracking Search** augmented with **Minimum Remaining Values (MRV)**, the **Degree Heuristic**, **Least Constraining Value (LCV)**, and **Forward Checking**.

---

## Table of Contents
1. [Project Overview & Objectives](#1-project-overview--objectives)
2. [Problem Statement & Formal Formulation](#2-problem-statement--formal-formulation)
3. [AI Algorithm Design & Heuristics](#3-ai-algorithm-design--heuristics)
4. [Hard and Soft Constraints](#4-hard-and-soft-constraints)
5. [Technology Stack](#5-technology-stack)
6. [Architecture & Project Structure](#6-architecture--project-structure)
7. [Installation & Setup Guide](#7-installation--setup-guide)
8. [Running the Application](#8-running-the-application)
9. [How to Use the Application](#9-how-to-use-the-application)
10. [Automated Testing Suite (13 Scenarios)](#10-automated-testing-suite-13-scenarios)
11. [API Documentation](#11-api-documentation)
12. [Viva / Presentation Defense Guide](#12-viva--presentation-defense-guide)
13. [Known Limitations & Future Scope](#13-known-limitations--future-scope)

---

## 1. Project Overview & Objectives

In academic institutions, generating examination timetables manually is error-prone, labor-intensive, and computationally complex (NP-complete). Conflicts such as overlapping exams for shared student cohorts, double-booked venues, and undersized rooms create administrative bottlenecks.

### Core Objectives:
- **Zero Hard-Constraint Violations:** Guarantee that no student cohort has simultaneous exams, no venue is double-booked, and every assigned room accommodates the candidate count.
- **Genuine AI Implementation:** Replace random heuristics or simulated progress with a mathematical CSP Backtracking Search engine in Python.
- **Decision Transparency & Explainability:** Provide human-readable decision logs for college vivas (explaining why an exam was selected first via MRV and why a specific room was chosen via LCV).
- **Interactive Manual Editing & AI Repair:** Enable human administrators to manually adjust dates or rooms, with immediate revalidation and an AI repair engine that freezes locked assignments.
- **Modern Academic Dashboard:** Deliver an intuitive, responsive React + TypeScript interface with Recharts analytics and printable examination reports.

---

## 2. Problem Statement & Formal Formulation

The examination scheduling problem is modeled as a Constraint Satisfaction Problem:

$$\text{CSP} = \langle X, D, C \rangle$$

### 1. Variables ($X$)
Each examination $E_i \in X = \{E_1, E_2, \dots, E_n\}$ is a variable that must be assigned a valid scheduling triplet.
- Each examination possesses: Subject Code, Course Name, Registered Student Groups, Candidate Count, Permitted Dates/Slots, and Required Room Facilities.

### 2. Domains ($D$)
For each examination $E_i$, its candidate domain $D_i$ consists of legal assignment triplets:
$$v = (\text{date}, \text{slot\_id}, \text{room\_id})$$
Initial domain filtering prunes inherently impossible options upfront:
- $\text{date} \in \text{permitted\_dates}(E_i) \cap \text{available\_dates}(\text{room})$
- $\text{slot\_id} \in \text{permitted\_slots}(E_i) \setminus \text{unavailable\_slots}(\text{room})$
- $\text{capacity}(\text{room}) \ge \text{student\_count}(E_i)$
- $\text{facilities}(E_i) \subseteq \text{facilities}(\text{room})$

### 3. Constraints ($C$)
Both **Hard Constraints** (must be 100% satisfied) and **Soft Constraints** (optimized via a penalty minimization function).

---

## 3. AI Algorithm Design & Heuristics

The engine executes a genuine recursive Backtracking Search algorithm equipped with classic AI heuristics:

### 1. Minimum Remaining Values (MRV) — Fail-First Principle
- At each decision step, the algorithm selects the unassigned examination with the **fewest legal remaining values** in its domain:
  $$\arg\min_{E \in X_{\text{unassigned}}} |D(E)|$$
- **Rationale:** If an exam has very few valid venues or time slots, scheduling it early exposes dead-ends near the top of the search tree rather than deep inside.

### 2. Degree Heuristic — Tie-Breaker
- When multiple examinations are tied for the minimum domain size, the Degree Heuristic selects the examination that shares student groups with the **largest number of unassigned examinations**:
  $$\arg\max_{E} \text{degree}(E)$$
- **Rationale:** Assigning the most constraining variable first imposes maximum constraints on remaining variables, rapidly shrinking their domain sizes.

### 3. Least Constraining Value (LCV) — Fail-Last Principle
- When ordering candidate values $(d, s, r)$ for the selected examination, the algorithm computes how many options that assignment would rule out from the domains of neighboring unassigned examinations:
  $$\text{eliminated\_count}(v) = \sum_{E' \in \text{neighbors}} |\{v' \in D(E') \mid \text{inconsistent}(v, v')\}|$$
- Values with the lowest `eliminated_count` are tried first. Right-sized rooms are preferred as a secondary tie-breaker.

### 4. Forward Checking & Domain Restoration
- Immediately upon assigning $E_i \leftarrow (d, s, r)$:
  - All $(d, s, r)$ options are removed from other examinations.
  - All $(d, s, *)$ options are pruned from any examination sharing student cohorts with $E_i$.
- **Early Dead-End Detection:** If any unassigned examination's domain is reduced to zero ($|D(E')| = 0$), Forward Checking triggers an **immediate backtrack**, restoring all pruned values without exploring an impossible branch.

### 5. Search Budget & Termination Bounds
- Search timeout (`max_search_seconds`, default: 15.0s) and backtrack limit (`max_backtracks`, default: 10,000) prevent infinite loops.
- If the search space is exhaustively explored without finding a solution, the engine returns **`INFEASIBLE`** (mathematically proven impossible). If budget expires, it returns **`TIMEOUT`**.

---

## 4. Hard and Soft Constraints

### Hard Constraints (Strict Feasibility):
1. **Student Group Concurrency:** Examinations sharing a student group (or explicit conflict relation) cannot overlap at the same `(date, slot)`.
2. **Room Double-Booking:** No room can host two examinations simultaneously.
3. **Room Seating Capacity:** $\text{capacity}(\text{room}) \ge \text{student\_count}(\text{exam})$.
4. **Room Type & Facilities:** Practical exams requiring Computer Labs or specialized facilities (e.g., Projectors) are only placed in matching venues.
5. **Availability Blackouts:** Rooms or examinations restricted from specific dates/slots are never scheduled during those times.
6. **Locked Assignments:** Manually locked assignments are preserved as constants during generation and AI repair.

### Soft Constraints (Optimization Quality Function):
$$\text{Total Penalty} = (w_{\text{gap}} \times P_{\text{gap}}) + (w_{\text{dist}} \times P_{\text{dist}}) + (w_{\text{util}} \times P_{\text{util}})$$
- **$P_{\text{gap}}$ (Exam Gap Penalty):** +15 for 2 exams on the same day for a cohort; +5 for exams on consecutive days with 0 gap days.
- **$P_{\text{dist}}$ (Daily Distribution Variance):** Variance in examinations scheduled per day.
- **$P_{\text{util}}$ (Room Seat Waste):** Penalty proportional to unused seats in oversized halls.
- **Lower score = Higher quality timetable.**

---

## 5. Technology Stack

### Frontend
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Vanilla CSS + Tailwind CSS v4 (Glassmorphic dark UI, Indigo/Cyan accents)
- **Icons:** Lucide React
- **Visualizations:** Recharts (Daily distribution bar charts, Venue load charts, Soft penalty breakdown)

### Backend
- **Framework:** Python 3.9+ with FastAPI
- **Data Validation:** Pydantic v2
- **ORM & Database:** SQLAlchemy 2.0 with SQLite (`exam_scheduler.db`)
- **Testing:** Pytest & HTTPX TestClient

---

## 6. Architecture & Project Structure

```text
AI mini project/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application with CORS and lifespan auto-seed
│   │   ├── database.py              # SQLite engine & SessionLocal
│   │   ├── models/                  # SQLAlchemy ORM Models
│   │   │   ├── exam.py
│   │   │   ├── room.py
│   │   │   ├── student_group.py
│   │   │   ├── time_slot.py
│   │   │   ├── scheduling_config.py
│   │   │   └── timetable.py         # Timetable & Assignment models
│   │   ├── schemas/                 # Pydantic v2 validation schemas
│   │   ├── ai/                      # Real AI CSP Engine
│   │   │   ├── csp_solver.py        # Recursive Backtracking CSP Solver
│   │   │   ├── constraints.py       # Hard & Soft constraint functions + Independent validator
│   │   │   ├── heuristics.py        # MRV, Degree Heuristic, LCV, Forward Checking
│   │   │   ├── explanations.py      # AI Decision explanation generator
│   │   │   └── repair.py            # AI Schedule repair preserving locked slots
│   │   ├── services/
│   │   │   ├── timetable_service.py # Timetable lifecycle & CSV export
│   │   │   ├── demo_data.py         # Realistic academic dataset seeder
│   │   │   └── import_export.py     # CSV import parser with row error checks
│   │   └── api/
│   │       ├── api_router.py
│   │       └── endpoints/           # REST endpoints (timetables, exams, rooms, groups, etc.)
│   ├── tests/                       # Comprehensive automated test suite
│   │   ├── conftest.py              # Shared fixtures with StaticPool SQLite in-memory DB
│   │   ├── test_csp_solver.py       # Scenarios 1 to 8 (CSP search & heuristics)
│   │   ├── test_constraints_and_validation.py # Scenarios 9 to 11 (Validation, Repair, Soft penalty)
│   │   └── test_api_and_db.py       # Scenarios 12 to 13 (API validation & Demo seeder)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── types/index.ts           # TypeScript interfaces
│   │   ├── services/api.ts          # Unified REST API client
│   │   ├── components/
│   │   │   ├── Layout/              # Sidebar & TopNav
│   │   │   ├── Common/              # StatCard, Badge, Modal, Toast
│   │   │   └── Timetable/           # MasterGrid, RoomWise, GroupWise, TableView, PrintReport, ManualEdit
│   │   ├── pages/                   # Dashboard, Generator, Viewer, Conflicts, Analytics, Exams, Rooms, etc.
│   │   ├── App.tsx
│   │   └── index.css
│   └── package.json
└── README.md
```

---

## 7. Installation & Setup Guide

### Prerequisites
- Python 3.9 or higher
- Node.js 18+ and npm

### 1. Backend Setup
From the project root:
```bash
# Create virtual environment
python3 -m venv backend/venv

# Activate virtual environment
source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 2. Frontend Setup
From the project root:
```bash
cd frontend
npm install
```

---

## 8. Running the Application

### Option A: Run Backend & Frontend in separate terminals

**Terminal 1 (Backend):**
```bash
export PYTHONPATH="."
backend/venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend runs on `http://127.0.0.1:8000` (Swagger UI: `http://127.0.0.1:8000/docs`).*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://127.0.0.1:5173`.*

---

## 9. How to Use the Application

1. **Dashboard:** Displays KPI stats (Exams, Rooms, Scheduled %, Hard Violations, Utilization) and distribution charts.
2. **1-Click Demo Data:** Click **"Load Demo Data"** in the top navigation bar. It automatically populates CS, IT, and ECE departments, multiple halls, computer labs, shared electives, and triggers the AI scheduler.
3. **Generate Timetable:** Navigate to **Generate Timetable**, set schedule parameters, and click **"Run AI Timetable Scheduler"**. Watch the CSP engine compute the schedule in milliseconds.
4. **Timetable Viewer:**
   - **Master Grid View:** Date $\times$ Slot matrix of all examinations.
   - **Room-wise View:** Venue occupancy matrix.
   - **Student Group View:** Personalized student batch exam timeline with preparation gap badges.
   - **Table View:** Searchable, sortable list.
   - **Print Report:** Click **"Print Report"** for an official, print-formatted college timetable.
   - **CSV Export:** Download schedule directly as `.csv`.
5. **Manual Editing & AI Repair:** Click any exam in the timetable to edit its date, slot, or room.
   - If a manual change introduces a clash, the system immediately flags the conflict.
   - Toggle **"Lock this assignment"** and click **"Repair with AI"**; the AI scheduler freezes your locked exam and reorganizes the remaining schedule to eliminate conflicts.
6. **AI Analytics & Decisions:** Inspect the chronological CSP decision trace, explaining which variable was picked via MRV, why a slot was chosen via LCV, and where Forward Checking pruned dead-ends.

---

## 10. Automated Testing Suite (13 Scenarios)

The test suite covers all 13 required scenarios:

```bash
export PYTHONPATH="."
backend/venv/bin/pytest backend/tests -v
```

### Test Coverage Summary:
| # | Test Scenario | Verified Behavior |
|---|---|---|
| **1** | `test_1_successful_timetable_generation` | Satisfies 100% of hard constraints across all examinations. |
| **2** | `test_2_no_simultaneous_exams_for_same_student_group` | Proves cohorts and shared conflict batches never overlap. |
| **3** | `test_3_no_simultaneous_use_of_same_room` | Proves no two examinations are placed in the same room at the same time. |
| **4** | `test_4_insufficient_room_capacity_rejection` | Proves undersized venues are rejected; oversize cohorts report infeasibility. |
| **5** | `test_5_room_availability_restrictions` | Proves room blackout dates and restricted slots are respected. |
| **6** | `test_6_mrv_and_backtracking_behavior` | Verifies MRV picks the most constrained variable first and logs steps. |
| **7** | `test_7_impossible_scheduling_scenarios` | Proves infeasible problems report `INFEASIBLE` with mathematical proof. |
| **8** | `test_8_every_required_exam_scheduled_exactly_once` | Confirms all registered exams appear exactly once without omission. |
| **9** | `test_9_independent_validation_detects_deliberate_conflicts` | Injected student clashes, collisions, and capacity deficits are caught. |
| **10** | `test_10_manual_changes_trigger_revalidation_and_repair` | Manual edit triggers conflict flags; AI Repair resolves them respecting locks. |
| **11** | `test_11_correct_soft_constraint_scoring` | Verifies gap penalty, distribution variance, and seat waste formulas. |
| **12** | `test_12_api_input_validation` | Validates Pydantic schemas, rejects capacity $\le 0$ and duplicate codes. |
| **13** | `test_13_sample_database_initialization` | Verifies demo seeder, `/api/demo/load`, and `/api/demo/reset`. |

---

## 11. API Documentation

Interactive Swagger documentation is available at `http://127.0.0.1:8000/docs`.

### Key Endpoints:
- `GET /api/health`: Health status and AI algorithm declaration.
- `GET /api/dashboard`: Summary stats, charts data, and recent timetables.
- `POST /api/timetables/generate`: Invokes CSP Backtracking scheduler.
- `GET /api/timetables/{id}`: Detailed timetable with assignments, conflicts, and AI decision trace.
- `POST /api/timetables/{id}/validate`: Independent constraint verification.
- `PATCH /api/timetables/{id}/assignments/{assignment_id}`: Manual assignment update.
- `POST /api/timetables/{id}/repair`: AI conflict resolution with locked assignment preservation.
- `GET /api/timetables/{id}/export/csv`: Download timetable as CSV.
- `POST /api/demo/load`: Seed demo college scenario.
- `POST /api/demo/reset`: Clear all database records.
- `POST /api/import/csv`: Upload CSV with row-level validation.

---

## 12. Viva / Presentation Defense Guide

### Frequently Asked Questions in AI Lab Vivas:

**Q1: How did you formulate the timetable problem as a CSP?**
> *"Each examination is modeled as a variable $X_i$. The domain $D_i$ is the set of all valid triples $(\text{Date}, \text{Slot}, \text{Room})$. Constraints include unary constraints (room capacity $\ge$ students, room type/facilities match) and binary constraints (no student group overlap at the same time, no room double-booking)."*

**Q2: What is the fail-first principle and where is it implemented?**
> *"The fail-first principle is implemented via the **Minimum Remaining Values (MRV)** heuristic in `heuristics.py`. By selecting the examination with the fewest legal values remaining, we encounter dead ends as early as possible near the root of the search tree, drastically reducing search space."*

**Q3: How does Least Constraining Value (LCV) complement MRV?**
> *"While MRV chooses **which variable** to assign next (fail-first), LCV chooses **which value** to try first (fail-last). It selects the $(\text{Date}, \text{Slot}, \text{Room})$ triple that eliminates the minimum number of candidate assignments from neighboring unassigned examinations."*

**Q4: How does Forward Checking prevent thrashing?**
> *"After each variable assignment, Forward Checking immediately removes incompatible values from all unassigned neighbors. If any neighbor's domain becomes empty ($|D| = 0$), Forward Checking detects failure immediately and triggers a backtrack without wasting time exploring that branch."*

---

## 13. Known Limitations & Future Scope

- **Continuous Time:** The current version uses discrete session slots (Morning/Afternoon). Future enhancements could support arbitrary, variable-minute examination windows.
- **Invigilator / Faculty Allocation:** Can be extended as a secondary CSP stage to assign faculty proctors to rooms based on department workload limits.
- **Multi-Objective Genetic Algorithms:** Hybridizing CSP with NSGA-II for Pareto-optimal soft constraint frontier exploration.

---

## License
Developed as an academic demonstration for **Project-Based Learning - I (PBL-I)**. Open-source under the MIT License.
