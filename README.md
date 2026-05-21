# SMS to Eduflow-Universe Single-Version Migration Blueprint

## Smart Start Overview
This document defines a **single-version migration** plan from the legacy `SMS-2.html` monolith into the new `eduflow-universe` codebase, with the goal of feature-parity-first migration, then hardening, then premium UI refinement. The attached legacy codebase already contains a very large ERP-style surface area including module registries, dashboards, scholarship workflows, certificate generation, communication, chat, academic operations, finance, admissions, library, hostel, transport, placement, media, reports, settings, and automation hooks.[file:1]

The migration should be treated as a controlled product re-platform, not a redesign-only exercise. A realistic objective is **traceable and testable functional parity**, not an unverifiable promise of "100% complete migration" on day one; the correct engineering standard is a signed parity checklist, patch log, regression suite, and acceptance evidence for every migrated feature.[file:1][web:13]

## Current Legacy Footprint
The legacy HTML includes explicit ERP module definitions for institute information, courses, user management, fees, people, academics, timetable, homework, assignments, attendance, exams, communication, chat, reception, administration, payroll, inventory, scholarships, certificates, hostel, transport, library, admissions, tasks, placement, analytics, events, alumni, video rooms, quiz, media, system integrations, settings backup, grievance, procurement, health, security compliance, and DMS-style document management.[file:1]

The legacy file also already contains certificate issuance, verification, preview, revocation, scholarship application and approval pipelines, dashboard filtering and analytical views, and a broad module-normalization pattern that can be used as the migration source of truth.[file:1]

Detected implementation hints from the attached file:
- WebSocket or realtime-related keywords present: **True**.[file:1]
- MFA or 2FA-related keywords present: **True**.[file:1]
- Permission or access-control-related keywords present: **True**.[file:1]
- Certificate features present: **True**.[file:1]
- Scholarship features present: **True**.[file:1]
- Chat or messaging features present: **True**.[file:1]

## Migration Principle
Use a **strangler migration** with one production version target:
1. Freeze the target architecture in `eduflow-universe` as the only forward-moving codebase.
2. Extract feature contracts from `SMS-2.html` module by module.[file:1]
3. Rebuild each capability in Next.js 14 App Router with typed API boundaries and PostgreSQL persistence.
4. Maintain a migration ledger with status fields: `not-started`, `schema-ready`, `api-ready`, `ui-ready`, `qa-ready`, `parity-signed-off`.
5. Do not delete legacy logic until replacement passes parity checks.

## Target Local-First Architecture
The new system should run locally with free/open components:
- **Frontend:** Next.js 14 App Router, React, Tailwind CSS, Lucide icons.
- **Backend:** Next.js route handlers or a local Node service for long-running jobs.
- **Database:** PostgreSQL, ideally via local Docker or Supabase-compatible schema design.
- **Auth:** Supabase Auth or local auth service with MFA.
- **Realtime:** PostgreSQL changes streamed through Supabase Realtime or a Node WebSocket gateway.
- **Files:** Local object storage abstraction first, S3-compatible later.
- **Certificates:** HTML-to-PDF generation pipeline with QR verification metadata.
- **Auditing:** append-only audit log for every sensitive operation.

The live-update requirement maps cleanly to WebSocket or realtime channels because dashboards, chat, approvals, attendance, certificate queues, and scholarship flows all benefit from immediate state propagation instead of manual refresh.[file:1][web:13]

## Source Module Inventory
Primary module keys parsed from the legacy code include:

`` ...[file:1]

This confirms that the legacy file is not a narrow dashboard but a broad school ERP surface that needs structured migration waves, not ad hoc copying.[file:1]

## Recommended Repository Layout
```text
apps/
  web/                      # Next.js 14 App Router
packages/
  ui/                       # shared styled components
  db/                       # schema, migrations, seeds
  auth/                     # MFA, session, role helpers
  realtime/                 # ws channels, event contracts
  certificates/             # template engine, QR, PDF render
  permissions/              # RBAC/ABAC rules and matrix helpers
  analytics/                # dashboard transforms
  shared/                   # zod schemas, types, utils
infra/
  docker/                   # postgres, pgadmin, mailpit, redis(optional)
docs/
  migration/                # parity checklist, patch log, acceptance notes
```

## Migration Waves
### Wave 0 - Baseline capture
- Export every module, form field, action, table, modal, filter, dashboard, and local data model from `SMS-2.html` into a migration spreadsheet or JSON manifest.[file:1]
- Record screenshots and interaction notes for each screen.
- Tag each item as `business-critical`, `high`, `medium`, or `nice-to-have`.

### Wave 1 - Foundations
- Auth, users, roles, institutions, campuses, academic years.
- Shared shell: sidebar, topbar, command search, notification tray, theme system.
- Audit log, activity feed, attachment model, settings store.

### Wave 2 - Core ERP
- People, admissions, academics, timetable, attendance, homework, assignments, exams.
- Communication hub, chat, events, video rooms, media.

Current implementation note:
- The Students register now reads from `public.student_register`, created by `supabase/migrations/20260520164000_wave2_people_academics.sql`.
- If the app shows `PGRST205` for `student_register`, the deployed Supabase project has not received the Wave 2 migration yet. Apply that SQL migration to the configured project (`edxwnieiaznwwokahhve`) and refresh the app.

### Wave 3 - Operations and finance
- Fees, payroll, inventory, procurement, reception, hostel, transport, library, tasks.

### Wave 4 - Student success and compliance
- Scholarships, certificates, grievance, health, security compliance, document management.

### Wave 5 - Insights and automation
- Reports, analytics, alerts, automations, exports, admin tools, backup settings.

## WebSocket Live Updates
Implement realtime by domain, not as one generic stream:
- `presence:*` for user presence and active viewers.
- `chat:thread:<built-in function id>` for private/group messaging.
- `dashboard:institution:<built-in function id>` for KPI refresh cards.
- `approval:scholarship:<built-in function id>` for scholarship stage movement.
- `attendance:class:<built-in function id>` for attendance capture status.
- `certificate:queue` for generation and verification events.
- `notification:user:<built-in function id>` for alert tray and approval nudges.

Minimal local-first approach:
- PostgreSQL remains source of truth.
- API writes persist transactionally.
- After commit, publish an event to a WebSocket broker or realtime channel.
- UI subscribes per workspace and invalidates React query caches.

## MFA Login Flow
Add MFA as step-up security for Admin, Finance, Scholarship Desk, Certificate Issuer, and HOD roles.

Proposed login flow:
1. User enters email or username plus password.
2. Server validates first factor.
3. If MFA enrolled, challenge with TOTP or OTP app code.
4. For first login or recovery, offer backup codes.
5. Bind sessions to audit logs and device metadata.
6. Require recent re-auth for high-risk actions such as certificate revocation, scholarship sanction, role changes, and bulk exports.

Suggested screens:
- Sign in
- Enroll MFA
- Verify MFA
- Recovery code entry
- Trusted device review
- Security activity log

## Permission Matrix UI
The legacy file references role-based controls and ABAC-style settings, but this should become a first-class permission console in the new app.[file:1]

Build a matrix UI with these axes:
- Rows: modules and submodules.
- Columns: roles such as Super Admin, Admin, Principal, HOD, Faculty, Finance, Scholarship Desk, Certificate Desk, Librarian, Hostel Warden, Student, Parent.
- Cells: `none`, `view`, `create`, `edit`, `approve`, `delete`, `export`, `manage`.

UI requirements:
- Sticky row and column headers.
- Search by module or permission.
- Bulk apply by role or module.
- Policy diff drawer showing changed permissions before publish.
- Environment-safe publish flow with versioned policy snapshots.
- Effective access preview for a selected user.

## Certificate Generation
The legacy file already supports certificate generation, verification, preview, revocation, and template editing for Bonafide, Transfer, Conduct, Study, Character, and Leaving certificates.[file:1]

Upgrade this into a document engine:
- Template registry with variables like student profile, class, program, issue date, institution signature, registrar seal.
- Output types: HTML preview, print-ready PDF, verification page.
- Verification: QR code plus certificate number lookup.
- Approval routing for sensitive certificate classes.
- Version templates with draft and published states.
- Add scholarship-related certificates and custom institutional letters.

Certificate families to support in v1:
- Bonafide
- Scholarship Certificate
- Conduct
- Transfer
- Study
- Character
- Course Completion
- Fee Paid / No Due
- Hostel Residency

## Database Blueprint
Core tables:
- `institutions`, `campuses`, `academic_years`, `departments`, `programs`, `sections`
- `users`, `profiles`, `roles`, `permissions`, `role_permissions`, `user_role_scopes`
- `students`, `guardians`, `staff`, `faculty`, `enrollments`
- `attendance_records`, `assignments`, `submissions`, `homework`, `exam_schedules`, `marks`
- `messages`, `threads`, `thread_participants`, `notifications`
- `scholarship_applications`, `scholarship_verifications`, `scholarship_approvals`, `scholarship_disbursements`
- `certificate_templates`, `certificate_requests`, `certificates`, `certificate_verifications`
- `documents`, `document_tags`, `audit_logs`, `automation_rules`, `jobs`

Cross-cutting columns:
- `id`, `institution_id`, `campus_id`, `created_at`, `updated_at`, `created_by`, `updated_by`, `status`, `meta jsonb`

## Patch-by-Patch Migration Method
For each module:
1. Extract legacy behavior and data fields.[file:1]
2. Map old field names to normalized DB columns.
3. Define Zod schema and TS types.
4. Build repository and route handlers.
5. Build server actions or mutation hooks.
6. Build UI pages, tables, filters, forms, drawers, and modals.
7. Add audit events and realtime events.
8. Run parity QA against legacy behavior.
9. Mark `parity-signed-off` only after evidence.

Use a migration ledger row like this:

| Module | Legacy present | Schema | API | UI | Realtime | QA | Sign-off |
|---|---|---|---|---|---|---|---|
| Scholarships | Yes[file:1] | Pending | Pending | Pending | Pending | Pending | Pending |
| Certificates | Yes[file:1] | Pending | Pending | Pending | Pending | Pending | Pending |
| Chat | Yes[file:1] | Pending | Pending | Pending | Pending | Pending | Pending |

## Risks and Control Notes
- A single 3M+ character HTML file usually mixes view logic, state, storage, and business rules, so hidden edge cases are likely.[file:1]
- Some features may be implied by UI scaffolding but not fully implemented, which means parity must be measured against behavior, not labels alone.[file:1]
- Realtime, MFA, and permissioning should be added as platform capabilities early, otherwise later migrations will duplicate security logic.

## Definition of Complete Migration
Treat migration as complete only when all of the following are true:
- Every legacy module and action is cataloged.[file:1]
- Every cataloged item has a matching target feature, replacement decision, or retirement decision.
- Data contracts are normalized and documented.
- Regression tests cover critical flows.
- Stakeholder UAT signs off each wave.
- The legacy screen can be turned off without loss of required capability.

## Delivery Recommendation
Proceed in **CODE MODE** with a migration ledger, schema pack, API contract pack, and premium dashboard shell first. That creates the local-server-ready foundation for the Non-Stop Solution vision while keeping the path open for complete parity-based migration into the superior `eduflow-universe` platform.[file:1]
