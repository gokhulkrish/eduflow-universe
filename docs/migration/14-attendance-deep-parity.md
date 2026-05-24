# Patch 14 – Attendance Deep Parity

> **Objective:** Migrate the complete legacy attendance behavior — daily marking, bulk marking, correction flows, summaries, absence categories — without replacing the existing new-system attendance code unless legacy parity is missing.

## Canonical Attendance States

Extended from 5 to 9 states:

| Status | Legacy Equivalent |
|---|---|
| `present` | Present |
| `absent` | Absent |
| `late` | Late |
| `half_day` | Half Day |
| `od` | Official Duty |
| `excused` | Excused Absence |
| `holiday` | Holiday |
| `leave` | Leave |
| `unknown` | Unmarked / Unknown |

Existing `public.attendance_status` enum extended via `ALTER TYPE ... ADD VALUE IF NOT EXISTS`.

## Database Extensions

Migration: `supabase/migrations/20260524190012_attendance_deep_parity.sql`

### `attendance_sessions` – Class/Section/Date Grouping

Groups attendance records under a session for efficient class-level marking.

| Column | Type | Purpose |
|---|---|---|
| `institution_id` | `uuid` | Tenant scoping |
| `academic_year_id` | `uuid` | Academic year |
| `class_id` | `uuid` | Class |
| `section_id` | `uuid` | Section |
| `attendance_date` | `date` | Session date |
| `session_type` | `text` | `daily` (default) |
| `status` | `text` | `open`, `closed`, `locked` |
| `marked_by` | `uuid` | Who created the session |
| `remarks` | `text` | Teacher remarks |
| `meta` | `jsonb` | Extra context |

Unique constraint: `(institution_id, class_id, section_id, attendance_date, session_type)`

### `attendance` – Extended Columns

| Column | Added | Purpose |
|---|---|---|
| `session_id` | `uuid` FK → `attendance_sessions` | Links record to session |
| `original_status` | `text` | First-recorded status (preserved on correction) |
| `corrected_by` | `uuid` | Who last corrected |
| `corrected_at` | `timestamptz` | When corrected |
| `correction_reason` | `text` | Why corrected |

`updated_at` trigger added if missing.

### `attendance_adjustments` – Correction Audit Trail

| Column | Type | Purpose |
|---|---|---|
| `institution_id` | `uuid` | Tenant scoping |
| `record_id` | `uuid` FK → `attendance(id)` ON DELETE CASCADE |
| `changed_by` | `uuid` | Who made the change |
| `changed_at` | `timestamptz` | When |
| `from_status` | `text` | Previous status |
| `to_status` | `text` | New status |
| `note` | `text` | Reason for change |
| `meta` | `jsonb` | Extra context |

## Marking Services

### Daily marking – `markDailyAttendance(input)`
Idempotent for same student/date. Checks lock before writing. Broadcasts real-time event.

### Bulk marking – `bulkMarkDailyAttendance(input)`
Iterates rows calling `markDailyAttendance` for each.

### Mark all present – `markAllPresent(input)`
Bulk uploads all students as present for a date.

### Mark all absent – `markAllAbsent(input)`
Bulk uploads all students as absent for a date.

## Correction Flow – `correctAttendance(input)`

1. Acquires row lock (`FOR UPDATE`)
2. Reads current and original status
3. Writes adjustment record to `attendance_adjustments`
4. Updates attendance: preserves `original_status`, sets new `status`, records `corrected_by`, `corrected_at`, `correction_reason`
5. Commits transaction
6. Broadcasts `attendance:corrected` event

### Safety

- Transactional: all-or-nothing within a correction
- Row lock prevents concurrent corrections
- Original status preserved on first correction
- Full audit trail via `attendance_adjustments`

## Summary Views

### `attendance_student_summary`

Per-student aggregation across all dates:
- `present_count`, `absent_count`, `late_count`, `half_day_count`, `excused_count`
- `total_marked`
- `attendance_percentage` (present / total * 100)

### `attendance_class_daily_summary`

Per-class/section/date aggregation:
- `present_count`, `absent_count`, `late_count`, `half_day_count`
- `total_marked`

## API Routes

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/attendance/daily` | Mark attendance (single or bulk rows) |
| `GET` | `/api/attendance/daily?date=...` | Get daily attendance |
| `POST` | `/api/attendance/adjustments` | Correct an attendance record |

## Files Created

| File | Purpose |
|---|---|
| `supabase/migrations/20260524190012_attendance_deep_parity.sql` | Schema: enum extension, sessions, adjustments, views |
| `src/core/attendance/service.ts` | Extended with correctAttendance, markAllPresent, markAllAbsent, new fields in getDailyAttendance |
| `app/api/attendance/adjustments/route.ts` | Correction endpoint |
| `docs/migration/14-attendance-deep-parity.md` | This document |

## Done Criteria

- [x] Daily marking works for single and bulk modes
- [x] Corrections preserve history (original_status, attendance_adjustments)
- [x] Summary projections match legacy output shape (student_summary, class_daily_summary)
- [x] Session locking and reopening rules respected (attendance_sessions.status)
- [x] API is idempotent for the same session/student pair (ON CONFLICT)
- [x] No attendance UI redesign introduced
