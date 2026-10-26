# Apex Institute of Technology & Science
### Department of Computer Science & Engineering
### Project-Based Learning — I (PBL-I) | Academic Year 2025–2026

---

# AI-Based Examination Timetable Management System
*An Intelligent Constraint Satisfaction System for the Office of the Controller of Examinations*

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Pytest-13%2F13%20Passing-emerald.svg)](https://docs.pytest.org/)

---

## 1. Executive Summary & College Context

Every semester, the **Office of the Controller of Examinations (Examination Cell)** at our institution faces the daunting task of scheduling end-semester examinations for over 15 departments, hundreds of courses, and several thousand students across limited lecture halls and specialized computing laboratories.

Manual scheduling in spreadsheets frequently leads to three major institutional problems:
1. **Student Clashes:** Shared elective courses (e.g., *CS304: Machine Learning* taken by both Computer Science and Information Technology cohorts) get scheduled at identical time slots, leaving students stranded.
2. **Venue Conflicts & Seating Overflows:** Two departments accidentally book the same examination hall, or a cohort of 75 students is assigned to a classroom with only 45 seats.
3. **Student Fatigue:** Back-to-back heavy theory papers scheduled on consecutive days with zero revision intervals.

This project implements an **automated, clash-free examination timetable generator** that models exam timetabling as a formal **Constraint Satisfaction Problem (CSP)** and solves it using **Recursive Backtracking Search** with **Minimum Remaining Values (MRV)**, the **Degree Heuristic**, **Least Constraining Value (LCV)**, and dynamic **Forward Checking**.

---

## 2. Administrator Access & Role-Based Workflows

The portal supports distinct role permissions mirroring real university operations:

### 🔐 Examination Administrator (Controller of Examinations)
The administrator holds full authority to configure, generate, lock, and audit semester timetables:
- **Login Portal:** Available directly on launch at `http://127.0.0.1:5173`.
- **Default Staff ID / Username:** `admin` (or `coe@college.edu`)
- **Default Password:** `admin123`
- **Authorized Profile:** Dr. Ramesh K. Sharma, Controller of Examinations
- **Administrative Capabilities:**
  - Set and run the AI Timetable Scheduler with customized date windows.
  - Manually reschedule exams with real-time conflict checking.
  - Pin/Lock confirmed assignments and trigger **AI Repair** to resolve conflicts.
  - Manage course curriculum, student batches, venues, seating capacities, and room facilities.
  - Upload batch data via CSV and export finalized schedules.

### 🎓 Student & Faculty Viewer (Public Mode)
Students and faculty do not need administrative credentials to view schedules:
- Click **"Open Student & Public Timetable Portal"** on the login screen.
- **Student Capabilities:**
  - View the published Master Timetable matrix (Date × Session).
  - Search personalized timelines by student batch (e.g., `CS-Y3`, `IT-Y3`, `EC-Y3`).
  - View preparation gap badges between papers.
  - Inspect room-wise seating matrices and facility allocations.
  - Export CSVs and print clean, official semester examination schedules.
  - *Modification controls (generator, manual editing, database resets) are protected and read-only in this mode.*

---

## 3. Formal AI Formulation (Constraint Satisfaction Problem)

Rather than treating scheduling as a black-box machine learning problem, the system models it as a mathematically rigorous **Constraint Satisfaction Problem (CSP)** defined by the triple:

$$\text{CSP} = \langle X, D, C \rangle$$

### 1. Variables ($X$)
Every registered examination paper is a variable:
$$X = \{ E_1, E_2, \dots, E_n \}$$
Each examination $E_i$ encapsulates:
- Unique Course Code (e.g., `CS301`) & Subject Title (e.g., *Operating Systems*)
- Enrolled Student Cohorts (e.g., `['CS-Y3']`)
- Total Registered Candidate Count (e.g., 65 students)
- Permitted Dates and Time Slots
- Venue Requirements (e.g., `requires_lab: True`, Projector)

### 2. Domains ($D$)
For each examination $E_i$, its legal domain $D_i$ is the set of valid assignments:
$$v = (\text{Date}, \text{Slot}, \text{Room})$$
Before search begins, domain consistency prunes impossible candidates upfront:
- $\text{Date} \in \text{permitted\_dates}(E_i) \cap \text{available\_dates}(\text{Room})$
- $\text{Slot} \in \text{permitted\_slots}(E_i) \setminus \text{blackout\_slots}(\text{Room})$
- $\text{Capacity}(\text{Room}) \ge \text{CandidateCount}(E_i)$
- $\text{Facilities}(E_i) \subseteq \text{Facilities}(\text{Room})$

### 3. Constraints ($C$)

#### A. Strict Hard Constraints (Zero-Violation Mandate)
A schedule is mathematically invalid if any hard constraint is breached:
1. **Student Group Concurrency:** Students in the same cohort cannot take two exams simultaneously.
2. **Venue Double-Booking:** A hall cannot host two different examinations during the same session.
3. **Room Seating Adequacy:** Venue capacity must accommodate 100% of registered examinees.
4. **Specialized Venue Matching:** Computer programming / lab exams are allocated strictly to certified computer labs.
5. **Blackout Dates & Maintenance:** Venues under repair or reserved dates are respected.
6. **Locked Assignments:** Administrator-locked assignments are immutable constants during search.

#### B. Soft Constraints (Quality Optimization Metric)
When multiple valid schedules exist, the engine minimizes an objective penalty function:
$$\text{Total Penalty} = (w_{\text{gap}} \cdot P_{\text{gap}}) + (w_{\text{dist}} \cdot P_{\text{dist}}) + (w_{\text{util}} \cdot P_{\text{util}})$$
- **$P_{\text{gap}}$ (Fatigue Penalty):** $+15$ for 2 exams on the same day for a batch; $+5$ for consecutive days with zero study gap.
- **$P_{\text{dist}}$ (Daily Spread Variance):** Penalizes days with excessive exam load, ensuring a balanced workload.
- **$P_{\text{util}}$ (Seat Wastage):** Penalizes placing a small 20-student cohort inside a 150-seat auditorium.
- **Target:** Lower score indicates a more student-friendly and cost-effective schedule.

---

## 4. AI Heuristics & Search Engine Design

The Python CSP solver (`backend/app/ai/csp_solver.py`) uses a recursive backtracking algorithm optimized with standard AI heuristics:

```text
               [ Start CSP Backtracking Search ]
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
       All Assigned?                   Select Variable
          (Yes)                         via MRV Heuristic
            │                                │
      Return SUCCESS                   Ties Broken by
                                      Degree Heuristic
                                             │
                                     Order Candidate Values
                                        via LCV Heuristic
                                             │
                                     Try Value Assignment
                                             │
                                      Forward Checking
                                     (Prune Incompatible)
                                             │
                                     Domain Wipeout?
                                      /           \
                                   (Yes)          (No)
                                     │              │
                               Backtrack      Recurse Next Var
```

### 1. Minimum Remaining Values (MRV) — Fail-First Principle
- At each decision step, the scheduler selects the unassigned exam with the **smallest remaining domain**:
  $$\arg\min_{E \in X_{\text{unassigned}}} |D(E)|$$
- **Engineering Rationale:** If an exam only has 1 or 2 valid rooms/slots available (e.g., a huge 120-student cohort needing the main auditorium), scheduling it first detects dead-ends near the root of the search tree rather than deep down thousands of branches.

### 2. Degree Heuristic — Tie-Breaker
- When multiple exams have identical domain sizes, the solver selects the paper that shares student groups with the **greatest number of unassigned exams**:
  $$\arg\max_{E} \text{Degree}(E)$$
- **Engineering Rationale:** Assigning the most constraining exam first imposes maximum restrictions on neighboring exams, rapidly shrinking remaining search branches.

### 3. Least Constraining Value (LCV) — Fail-Last Principle
- When ordering candidate triples $(\text{Date}, \text{Slot}, \text{Room})$ for the selected exam, the solver evaluates:
  $$\text{Impact}(v) = \sum_{E' \in \text{Neighbors}} |\{ v' \in D(E') \mid \text{conflicts}(v, v') \}|$$
- Values with the lowest `Impact` are tried first, leaving maximum flexibility for neighboring courses. Right-sized venues are favored as a secondary tie-breaker.

### 4. Dynamic Forward Checking & Rollback
- Immediately upon tentative assignment:
  - The $(\text{Date}, \text{Slot}, \text{Room})$ triple is removed from all other examinations.
  - All $(\text{Date}, \text{Slot}, *)$ options are pruned from any cohort sharing students.
- **Early Dead-End Detection:** If any unassigned course domain drops to 0 ($|D(E')| = 0$), the solver immediately triggers a backtrack, rolls back all pruned values, and tests the next value without wasting cycles.

### 5. AI Schedule Repair
- When human administrators manually reschedule an exam (e.g., due to an unforeseen guest lecture), the AI repair engine (`backend/app/ai/repair.py`):
  1. Freezes all locked examinations as constants.
  2. Unassigns only conflicting unlocked papers.
  3. Re-executes the CSP solver on the localized subproblem, restoring a clash-free schedule in milliseconds.

---

## 5. Technology Stack & Architecture

### Frontend (User Interface)
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Vanilla CSS + Tailwind CSS v4 (`@tailwindcss/vite`) with curated dark glassmorphic styling
- **Component Icons:** Lucide React
- **Data Visualizations:** Recharts (Daily Exam Spread, Hall Load Distribution, Soft Penalty Breakdown Pie Chart)
- **Printing:** Dedicated CSS `@media print` layout for university circulars and notice boards

### Backend (AI Core & API)
- **Language & Framework:** Python 3.9+ with FastAPI (Asynchronous REST API)
- **Data Modeling & Validation:** Pydantic v2 schemas
- **Database & Persistence:** SQLAlchemy 2.0 with SQLite (`exam_scheduler.db`)
- **Automated Testing:** Pytest and HTTPX `TestClient` with `StaticPool` SQLite in-memory isolation

### Project Directory Structure
```text
AI mini project/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entry point & CORS
│   │   ├── database.py                 # SQLAlchemy SQLite engine & session factory
│   │   ├── models/                     # Database Models (Exams, Rooms, Groups, Timetables)
│   │   ├── schemas/                    # Pydantic v2 validation contracts
│   │   ├── ai/                         # Genuine CSP Search Engine
│   │   │   ├── csp_solver.py           # Recursive Backtracking CSP Solver
│   │   │   ├── constraints.py          # Hard/Soft constraints & Independent validator
│   │   │   ├── heuristics.py           # MRV, Degree Heuristic, LCV, Forward Checking
│   │   │   ├── explanations.py         # Human-readable AI decision explanations
│   │   │   └── repair.py               # Localized schedule repair with locked pins
│   │   ├── services/
│   │   │   ├── timetable_service.py    # Timetable generation & CSV export orchestration
│   │   │   ├── demo_data.py            # Academic seeder (CSE, IT, ECE, Electives, Halls)
│   │   │   └── import_export.py        # CSV import parser with row-level error validation
│   │   └── api/
│   │       ├── api_router.py           # Top-level API router
│   │       └── endpoints/              # Auth, Dashboard, Timetables, Exams, Rooms, etc.
│   ├── tests/                          # 13 Comprehensive verification scenarios
│   │   ├── conftest.py                 # SQLite StaticPool in-memory fixtures
│   │   ├── test_csp_solver.py          # Scenarios 1 to 8 (Solver, MRV, LCV, Infeasibility)
│   │   ├── test_constraints_and_validation.py # Scenarios 9 to 11 (Validation, Repair, Soft)
│   │   └── test_api_and_db.py          # Scenarios 12 to 13 (API validation & Demo loader)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── types/index.ts              # TypeScript interfaces & UserProfile types
│   │   ├── services/api.ts             # Axios/Fetch API client
│   │   ├── components/
│   │   │   ├── Layout/                 # TopNav and Sidebar with institutional branding
│   │   │   ├── Common/                 # StatCard, Badge, Modal, Toast
│   │   │   └── Timetable/              # MasterGrid, RoomWise, GroupWise, Tabular, Print, Modal
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx           # Institutional CoE Admin Login & Student portal entrance
│   │   │   ├── DashboardPage.tsx       # Institutional KPI dashboard & Examination Directives
│   │   │   ├── GeneratorPage.tsx       # Semester Schedule Planner (Admin-restricted)
│   │   │   ├── TimetableViewerPage.tsx # Multi-view schedule browser with Read-Only student mode
│   │   │   ├── ConflictsPage.tsx       # Audit & Clash Diagnostics Center
│   │   │   ├── AIAnalyticsPage.tsx     # White-box CSP search trace & Soft Penalty pie chart
│   │   │   └── ExamsPage.tsx, etc.     # Curriculum, Batches, and Venues management
│   │   ├── App.tsx                     # Top-level application controller & Auth state
│   │   └── index.css                   # Tailwind v4 directives & Print styles
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 6. Installation & Execution Guide

### Prerequisites
- Python 3.9+ (Python 3.10, 3.11, or 3.12 recommended)
- Node.js 18+ and npm

### Step 1: Backend Setup
```bash
# Navigate to project directory
cd "/Users/apple/Downloads/AI mini project "

# Create Python virtual environment
python3 -m venv backend/venv

# Activate virtual environment
source backend/venv/bin/activate

# Install required Python packages
pip install -r backend/requirements.txt
```

### Step 2: Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### Step 3: Running the Application

**Terminal 1 — FastAPI Backend:**
```bash
cd "/Users/apple/Downloads/AI mini project "
export PYTHONPATH="."
backend/venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend runs on `http://127.0.0.1:8000`. Swagger API docs at `http://127.0.0.1:8000/docs`.*

**Terminal 2 — React Frontend:**
```bash
cd "/Users/apple/Downloads/AI mini project /frontend"
npm run dev
```
*Open your browser and navigate to `http://127.0.0.1:5173`.*

---

## 7. Operational Walkthrough

1. **Sign In as Administrator:**
   - On the login screen, enter `admin` and `admin123` (or click **"Auto-Fill Demo"**).
   - Click **"Sign In as Examination Administrator"**.
2. **Load College Scenario:**
   - Click **"Load Sample College Data"** in the top navigation bar.
   - This automatically populates Computer Science (`CS-Y3`), Information Technology (`IT-Y3`), and Electronics (`EC-Y3`) departments, shared electives (*Machine Learning*), multiple lecture halls, and computer laboratories.
3. **Plan Examination Schedule:**
   - Navigate to **"Set Exam Timetable"** in the sidebar.
   - Adjust session names or keep defaults, then click **"Run AI Timetable Scheduler"**.
   - The CSP solver executes in under 50 milliseconds, producing a guaranteed zero-clash schedule.
4. **Inspect Master Timetable:**
   - Switch between **Master Grid**, **Room Matrix**, **Student Group Timelines**, and **Tabular View**.
   - Notice the green **Preparation Gap Badges** indicating rest intervals between major papers.
5. **Simulate Clash & Trigger AI Repair:**
   - Click any examination card (e.g., `CS301`).
   - Move it to collide with another exam, or assign it to an undersized classroom.
   - The system immediately flags the hard violation and updates the **Clash & Audit Center**.
   - Check **"Lock this assignment"** and click **"Repair Schedule with AI"**; the AI solver resolves the clash while honoring your locked pin.
6. **Print & Export:**
   - Click **"Print Report"** to view a clean, university-formatted examination circular.
   - Click **"CSV Export"** to download the timetable for student distribution.
7. **Switch to Student Mode:**
   - Click your profile pill in the top right and select **"Sign Out"**.
   - Click **"Open Student & Public Timetable Portal"**.
   - Browse the schedule freely in read-only mode.

---

## 8. Automated Test Suite (13 Scenarios)

The test suite thoroughly verifies all requirements of the constraint satisfaction engine and web service:

```bash
cd "/Users/apple/Downloads/AI mini project "
export PYTHONPATH="."
backend/venv/bin/pytest backend/tests -v
```

### Verification Matrix:
| # | Test Scenario | Verified System Behavior |
|:---:|:---|:---|
| **1** | `test_1_successful_timetable_generation` | Satisfies 100% of hard constraints across all curriculum examinations. |
| **2** | `test_2_no_simultaneous_exams_for_same_student_group` | Proves cohorts and shared conflict batches never overlap at the same time. |
| **3** | `test_3_no_simultaneous_use_of_same_room` | Proves no two examinations are scheduled in the same hall simultaneously. |
| **4** | `test_4_insufficient_room_capacity_rejection` | Proves undersized venues are rejected; oversize cohorts report infeasibility. |
| **5** | `test_5_room_availability_restrictions` | Proves room blackout dates and restricted slots are strictly respected. |
| **6** | `test_6_mrv_and_backtracking_behavior` | Verifies MRV picks the most constrained variable first and logs search trace. |
| **7** | `test_7_impossible_scheduling_scenarios` | Proves infeasible problems report `INFEASIBLE` with mathematical proof. |
| **8** | `test_8_every_required_exam_scheduled_exactly_once` | Confirms all registered exams appear exactly once without omission or duplication. |
| **9** | `test_9_independent_validation_detects_deliberate_conflicts` | Injected student clashes, collisions, and capacity deficits are reliably detected. |
| **10** | `test_10_manual_changes_trigger_revalidation_and_repair` | Manual edit triggers conflict flags; AI Repair resolves them respecting locks. |
| **11** | `test_11_correct_soft_constraint_scoring` | Verifies gap penalty, distribution variance, and seat waste formulas. |
| **12** | `test_12_api_input_validation` | Validates Pydantic schemas, rejects capacity $\le 0$ and duplicate codes. |
| **13** | `test_13_sample_database_initialization` | Verifies demo seeder, `/api/demo/load`, and `/api/demo/reset`. |

---

## 9. Viva / Examination Defense Questions

Prepare for your project presentation and lab viva with these authoritative technical explanations:

**Q1: Why did your team choose CSP Backtracking rather than Genetic Algorithms or Deep Learning?**
> *"In university examination scheduling, hard constraints are non-negotiable: a single double-booked hall or student clash completely invalidates the schedule. Genetic algorithms and deep learning are stochastic and approximate; they offer no guarantee of zero hard violations and can output near-miss invalid timetables. A formal CSP with Backtracking Search and Forward Checking provides mathematical determinism, guarantees 100% hard feasibility when a solution exists, and proves infeasibility when physical room resources are inadequate."*

**Q2: What is the 'fail-first' principle and how does Minimum Remaining Values (MRV) implement it?**
> *"The fail-first principle states that when choosing which variable to assign next, we should pick the one most likely to fail soonest. In `heuristics.py`, MRV inspects all unassigned exams and selects the one with the smallest remaining domain ($|D_i|$). If an exam has very few legal options (for instance, a large batch requiring the college auditorium), assigning it first exposes dead-ends near the top of the search tree rather than after exploring thousands of fruitless branches."*

**Q3: How does Least Constraining Value (LCV) complement MRV?**
> *"While MRV chooses **which variable** to assign next (fail-first), LCV chooses **which value** to try first (fail-last). For the chosen exam, LCV calculates how many candidate choices each slot/room assignment eliminates from neighboring unassigned exams. By picking the value with the lowest conflict count, we leave the maximum possible flexibility for remaining courses."*

**Q4: How does Forward Checking prevent thrashing during search?**
> *"Without forward checking, a solver blindly makes assignments and only detects incompatibilities when constraints are evaluated much later. Forward checking actively looks ahead: immediately after placing exam $E_i$ at $(d, s, r)$, it prunes $(d, s, r)$ from all other exams and $(d, s, *)$ from conflicting batches. If any unassigned exam's domain shrinks to zero ($|D| = 0$), Forward Checking halts immediately and backtracks, pruning that entire dead-end subtree."*

**Q5: How does AI Schedule Repair work when an administrator locks a paper?**
> *"The administrator can pin specific exams to confirmed dates. In `repair.py`, locked exams are marked immutable and their assignments are pre-applied to the search state. Only the remaining unassigned or conflicting exams are passed to the CSP solver, guaranteeing that the administrator's manual changes are preserved while resolving all collateral conflicts."*

---

## 10. Authors & Acknowledgments

- **Project:** AI-Based Examination Timetable Generator — PBL-I
- **Institution:** Apex Institute of Technology & Science
- **Department:** Computer Science & Engineering
- **Curriculum:** Project-Based Learning - I (5th Semester)
- **Role Permissions:** Dr. Ramesh K. Sharma, Controller of Examinations

Developed as an academic project demonstrating Artificial Intelligence, Constraint Satisfaction Problems, and Modern Web Engineering.
