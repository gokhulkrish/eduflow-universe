# Patch 0: Smart Start for College Enterprise ERP

> Phase‑0 / Patch‑0 overview of your **cost‑free, local‑first College Enterprise ERP** (EduFlow core based on GegoK12 stack), rewritten strictly for colleges/universities, not schools.

---

## 1. Current Core Stack (Reinterpreted for College ERP)

- **Backend Framework**: Laravel `^12.0` on **PHP 8.4+**, giving you modern type safety, queues, events, and an HTTP layer suitable for large campuses.
- **Database**: MySQL 8.4 (`college_erp` schema, representing campus data), easily extendable to PostgreSQL later.
- **Runtime Architecture**: Multi‑service Docker deployment: `eduflow_app` (runs Laravel), `postgres` (database), `supabase-local`, and `node_app` for asset builds.
- **Frontend Build System**: Laravel Mix 6 + Vue 3 + Tailwind 3 + Bootstrap 4, with a rich ecosystem of Vue components (tables, uploads, charts, calendars) ready for college dashboards.
- **Installation Experience**: Visual installer at `/public/installer` and CLI/Docker flows, rebranded with "College ERP" terminology.

**Hard rule for all future work**: this ERP is strictly for **college / university level**, not for school ERP.

---

## 2. College‑Centric Domain Reframing

Using the same core packages, we reinterpret the domain from K‑12 to **college enterprise**:

### Academic Structure
- University → College → Departments → Programs → Courses → Batches → Semesters → Sections.
- Timetables, academic calendar, exam cycles, arrears/re‑appear handling.

### People & Roles
- Management, Principals/Directors, Deans, HoDs, Faculty, Non‑teaching staff, Students, Parents/Guardians (optional), Placement Officers, Exam Cell.
- Implemented via Laratrust roles/permissions + Impersonate for support and audits.

### Quality & Compliance
- NAAC/NBA and AICTE reporting structures (attendance %, pass %, publications, activities).
- Data captured via modules and surfaced through a **Global College Monitor Dashboard**.

### Operations & Services
- Admissions (online applications, merit lists, counselling rounds).
- Fees & Scholarships, Hostel, Transport, Library integration hooks, Placement & Training, Clubs/Events.

---

## 3. Local‑First College Server Architecture

The `docker-compose.yml` matches a typical **on‑prem college data center** setup:

- **App Container**: Laravel app running all ERP modules with cron/queue workers for heavy workloads (exam result processing, NAAC snapshots).
- **DB Container**: PostgreSQL as the transactional store (migrated from MySQL for better JSON support and analytical queries).
- **Supabase Local**: For authentication and real-time features.
- **Node Build Container**: Node 20 running Mix/Tailwind builds; can be triggered from CI or local admin scripts.

This ensures your ERP can run **offline / LAN‑only** inside a college campus while remaining cloud‑migratable later.

---

## 4. Feature Families (College Interpretation)

From `composer.json` and `package.json`, we remap features for a college context:

### Realtime & Alerts
- Pusher + Echo + FCM → instant alerts for timetable changes, exam seating, result publication, placement drives.

### Analytics & Dashboards
- Highcharts + Chart.js + FullCalendar → attendance heatmaps per department, pass percentage trends, placement statistics, workload analytics for faculty.

### Documents & Compliance
- Spatie Medialibrary + DomPDF + Excel → store evidence for NAAC/NBA metrics and generate consolidated reports per criterion from in‑app data.

### Search & Insight
- Scout + Algolia + search‑relations → search across departments, students, faculty, research publications, events, and activity logs.

### Security & Governance
- Sanctum for token‑secured APIs (integration with LMS or HRMS), Spatie Activitylog for auditing sensitive actions (result edits, attendance bulk updates).

---

## 5. Patch‑0 Implementation Checklist

- [x] Freeze architecture snapshot and reinterpret components for the college domain.
- [x] Update naming conventions (`eduflow_app`, `postgres`, etc.) and refactor vocabulary away from "school".
- [x] Update database name to `college_erp`.
- [x] Update app name to "Eduflow College ERP".
- [x] Commit this as `docs/patch-0-smart-start-college.md`.

---

## 6. Next Steps

For Phase 1:

1. Share or attach `app/`, `routes/`, and `database/migrations` from your EduFlow repo so I can generate the **Phase 1 Domain Inventory** specifically for college entities.  
2. We will then prioritise modules that directly power the **Global College Monitor Dashboard** and the **Objective 1–10 scoring engine** for departments and programs.
