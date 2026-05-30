# Phase 2: GCT‑Inspired College Domain Inventory

> This document converts the EduFlow repository into a **college‑centric ERP model** using the Government College of Technology, Coimbatore (GCT) as the reference academic structure. It lists the required entities, their corresponding database tables, current status, and the role‑based access model.

---

## 1. Reference Model – GCT Overview

| Aspect | Details |
|--------|---------|
| **Institute Type** | Government / Autonomous Engineering College |
| **Location** | Coimbatore, Tamil Nadu, India |
| **Affiliation** | Anna University, Chennai |
| **Academic Breadth** | Undergraduate (UG), Post‑Graduate (PG), Doctoral programmes |
| **Programme Groups** | UG Full‑Time, UG Part‑Time, PG Full‑Time, Doctoral (see Section 2) |

The GCT hierarchy drives the ERP domain layers below.

---

## 2. Academic Programme Structure (GCT)

| Programme Level | Example Departments / Branches |
|-----------------|--------------------------------|
| **UG Full‑Time** | Civil, Mechanical, Electrical & Electronics, Electronics & Communication, Production, Electronics & Instrumentation, Computer Science & Engineering, Information Technology, Industrial Biotechnology |
| **UG Part‑Time** | Civil, Mechanical, Electrical & Electronics, Electronics & Communication |
| **PG Full‑Time** | Structural, Environmental, Geotechnical, Engineering Design, Manufacturing, Thermal, Power Systems, Power Electronics & Drives, Applied Electronics, VLSI Design, Computer Science & Engineering |
| **Doctoral** | Civil, Mechanical, Electrical & Electronics, Electronics & Communication, Computer Science & Engineering, Production, Electronics & Instrumentation, Information Technology, Industrial Biotechnology |

These groups map to **Departments → Programmes → Courses → Semesters → Batches → Sections** in the ERP.

---

## 3. Domain Layers & Inventory Table

| Domain | Entity | GCT Reference | ERP Table (Postgres) | Status |
|--------|--------|---------------|----------------------|--------|
| **Institution** | Institution | Institute profile page | `institutions` | **To create** |
| **Institution** | Campus / Location | Campus map & address | `campuses` | **To create** |
| **Academic** | Department | GCT department list | `departments` | **To create** |
| **Academic** | Programme | UG/PG/Doctoral programmes | `programmes` | **To create** |
| **Academic** | Curriculum | Programme‑specific curriculum | `curricula` | **To create** |
| **Academic** | Course | Branch / specialization courses | `courses` | **To create** |
| **Academic** | Semester | Academic cycle (odd/even) | `semesters` | **To create** |
| **Academic** | Batch | Admission cohort (e.g., 2023‑2027) | `batches` | **To create** |
| **Academic** | Section | Class grouping within a batch/semester | `sections` | **To create** |
| **People** | User (Auth) | Supabase auth users | `users` | **Existing** (map to ERP) |
| **People** | Student | Admissions & enrolment data | `students` | **To create** |
| **People** | Faculty | Department staff & lecturers | `faculty` | **To create** |
| **People** | Staff (Non‑teaching) | Admin, library, hostel, transport | `staff` | **To create** |
| **People** | Role / Permission | Laratrust roles + Supabase claims | `roles`, `permissions`, `role_user` | **Existing** (refactor) |
| **Operations** | Attendance | Daily roll‑call, biometric sync | `attendance` | **To create** |
| **Operations** | Internal Assessment (CIA) | Continuous Internal Assessment marks | `internal_assessments` | **To create** |
| **Operations** | Exams & Results | Semester exams, result publishing | `exams`, `exam_results` | **To create** |
| **Operations** | Fees & Scholarships | Tuition, hostel, transport fees, scholarship awards | `fees`, `fee_invoices`, `scholarships` | **To create** |
| **Operations** | Hostel | Room inventory, allocation, mess | `hostels`, `rooms`, `hostel_assignments` | **To create** |
| **Operations** | Transport | Bus routes, vehicle fleet, student passes | `transport_routes`, `vehicles`, `transport_assignments` | **To create** |
| **Operations** | Placements | Recruiter drives, offers, internships | `placements`, `companies`, `placement_offers` | **To create** |
| **Operations** | Clubs & Events | Student societies, cultural/sports events | `clubs`, `events`, `event_registrations` | **To create** |
| **Monitoring** | Score Engine | 1‑10 KPI scoring for students & departments | `student_scores` | **Planned** |
| **Monitoring** | Dashboard Views | Department & college‑level analytics | `monitor_dashboard` (materialised view) | **Planned** |
| **Compliance** | Audit Log | Append‑only activity trail | `audit_log` | **Existing** (extend) |
| **Compliance** | NAAC/NBA Metrics | Accreditation data capture | `accreditation_metrics` | **Planned** |

> **Status Legend** – *Existing*: table/model already present in the repo. *To create*: needs new migration/model. *Planned*: will be added in later phases.

---

## 4. Role Model & Access Matrix

| Role | Description | Primary Modules (Read / Write) | Dashboard Scope |
|------|-------------|--------------------------------|-----------------|
| `super_admin` | System owner, full control | All modules (R/W) | Global college view |
| `college_admin` | College‑level manager | All academic & operations modules (R/W) | College‑wide KPIs |
| `principal` | Head of the college | Academic, fees, hostel, transport (R/W) | College‑wide, no system settings |
| `dean` | Head of a faculty (e.g., Engineering) | Departments under dean (R/W) | Faculty‑level dashboard |
| `hod` | Head of Department | Department modules (R/W) | Department‑level dashboard |
| `faculty` | Lecturer / professor | Courses, sections, attendance, internal assessments (R/W) | Own courses & sections |
| `exam_cell` | Exam administration | Exams, results, timetables (R/W) | Exam‑cell view |
| `placement_officer` | Placement & career services | Placements, companies, offers (R/W) | Placement analytics |
| `student` | Enrolled learner | Personal profile, attendance, results, fees (R/W limited) | Personal dashboard |
| `guardian` | Parent / guardian (optional) | Student view (read‑only) | Student‑related info |

**Implementation notes**

* Supabase auth stores the user’s UUID; the `users` table links to a `role_id` (or many‑to‑many via `role_user`).  
* Laravel’s Laratrust policies will be aligned to the above matrix; any legacy school‑specific policies must be refactored.  
* UI components (menus, sidebars) will hide/disable items based on the role’s allowed modules.

---

## 5. Mapping Existing Repo Items to the Inventory

| Existing Repo Path | Current Function | Mapped Entity | Action |
|--------------------|------------------|---------------|--------|
| `app/Models/User.php` | Auth user model | `users` | Keep, add role relationship |
| `app/Models/Student.php` (if present) | Student CRUD | `students` | Keep / rename if currently `StudentRecord` |
| `app/Models/Staff.php` | Staff directory | `staff` | Keep |
| `app/Models/Attendance.php` | Attendance records | `attendance` | Keep or create if missing |
| `app/Models/Exam.php` | Exam scheduling | `exams` | Keep / rename |
| `app/Models/Result.php` | Exam results | `exam_results` | Keep / rename |
| `app/Models/Fee.php` | Fee structures | `fees` | Keep / rename |
| `app/Models/Hostel.php` | Hostel data | `hostels` / `rooms` | Keep / split |
| `app/Models/Transport.php` | Transport routes | `transport_routes` | Keep / rename |
| `app/Models/Placement.php` | Placement data | `placements` | Keep / rename |
| `app/Models/Club.php` | Student clubs | `clubs` | Keep / rename |
| `app/Models/Event.php` | Event management | `events` | Keep / rename |
| `app/Models/AuditLog.php` | Activity logging | `audit_log` | Keep, extend for college actions |
| `routes/api.php` & `routes/web.php` | API endpoints for above | Various controllers | Review each prefix, map to modules in **Operations** column |

> **Next step** – Verify each of the above mappings against the actual codebase. Missing models/tables should be added in the upcoming **Phase 2 – Domain Model Conversion**.

---

## 6. Upgrade Priorities

| Priority | Tasks |
|----------|-------|
| **P1 – Core Academic Entities** | Create migrations & models for `institutions`, `departments`, `programmes`, `courses`, `semesters`, `batches`, `sections`. Populate seed data based on GCT’s programme list. |
| **P2 – People Layer** | Map existing `users` to `students`, `faculty`, `staff`. Add role‑assignment tables (`roles`, `permissions`, `role_user`). |
| **P3 – Operational Modules** | Implement attendance, internal assessments, exams, fees, hostel, transport, placements. Ensure each module uses the new academic hierarchy (programme → batch → section). |
| **P4 – Monitoring & KPI Engine** | Design `student_scores` table, scoring algorithms, and materialised view `monitor_dashboard`. |
| **P5 – UI Refactor** | Replace school‑centric copy (e.g., “Class”, “Grade”) with college terminology (“Section”, “Semester”, “Programme”). Update side‑bars, breadcrumbs, and help texts. |
| **P6 – Security Harden** | Align Laratrust policies with the role matrix above; sync Supabase claims. |
| **P7 – Documentation** | Update README, API docs, and onboarding guides to reflect college terminology and GCT‑inspired hierarchy. |

---

## 7. Deliverable for Patch 2

- **File added**: `docs/phase-2-domain-inventory-college.md` (this document).  
- **Commit message**:  

```bash
feat: add GCT-inspired college domain inventory
```

The inventory now serves as the contract for the next patch (Score Engine) and for all subsequent development work.

--- 

*End of Phase 2 – GCT‑Inspired College Domain Inventory*