# Patch 05 – Attendance Model & Synchronized Updates

## Data Model

| Concept | Table | Status |
|---|---|---|
| Daily attendance | `attendance` (with `period` column for optional period-level) | ✅ Live |
| Period-level attendance | `attendance_periods` (new) | ✅ Added |
| Attendance status enum | `public.attendance_status` | ✅ Added |
| Lock/override metadata | `attendance.locked_until`, `locked_by`, `overridden_by`, `overridden_at` | ✅ Added |

### `attendance_status` Enum Values

`present`, `absent`, `late`, `half_day`, `od`

### Lock Semantics

- `locked_until`: after this date, non-admin users cannot modify the record.
- `locked_by`: who locked the record.
- `overridden_by` / `overridden_at`: track manual overrides after initial import.

## Service Layer

| Function | Location | Description |
|---|---|---|
| `markDailyAttendance` | `src/core/attendance/service.ts` | Mark single student attendance with lock check, real-time broadcast |
| `bulkMarkDailyAttendance` | `src/core/attendance/service.ts` | Bulk mark from import or batch operations |
| `getDailyAttendance` | `src/core/attendance/service.ts` | Query attendance by date with optional grade/section filter |

All functions check `isLocked()` before mutation and broadcast `attendance:updated` events via Supabase channel after write.

## Import Integration

`src/core/imports/config/attendanceImportConfig.ts` updated to:
- Call `markDailyAttendance` from `applyRow` (resolving student ID via admission_no)
- Support legacy UMIS template (`umis-legacy-v1`) with status mapping (`A`→`absent`, `P`→`present`, `L`→`late`, `H`→`half_day`, `OD`→`od`)
- Support latest Superior template with direct status values

## Legacy Adapter

`src/legacy/compat/attendanceWriteAdapter.ts`:
- `legacyMarkAttendance(payload)` converts legacy short codes, dd-mm-yyyy dates to ISO, and delegates to `markDailyAttendance`

## API Routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/attendance/daily` | Mark single or bulk attendance |
| `GET` | `/api/attendance/daily?date=&grade=&section=` | Query attendance records |

## Real-Time Sync

- `broadcastAttendanceUpdate()` sends `attendance:updated` event on the `attendance-daily` Supabase channel after each write
- Frontend dashboards subscribe to this channel to update indicators without manual refresh

## SQL Migration

`supabase/migrations/20260524190003_attendance_model_refinement.sql`:
- Creates `public.attendance_status` enum
- Adds `locked_until`, `locked_by`, `overridden_by`, `overridden_at` columns to `public.attendance`
- Creates `public.attendance_periods` table with unique index on `(student_id, date, period_no)`

## Key Files

- `src/core/attendance/service.ts` — Core attendance service
- `src/core/imports/config/attendanceImportConfig.ts` — Import engine config
- `src/legacy/compat/attendanceWriteAdapter.ts` — Legacy adapter
- `app/api/attendance/daily/route.ts` — API endpoints
- `supabase/migrations/20260524190003_attendance_model_refinement.sql` — DB changes
- `core/attendance/service.ts` — Existing service (delegated to)
