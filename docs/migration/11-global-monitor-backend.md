# Patch 11 – Global Monitor Backend Wiring (Corrected, Strict Upgrade-Only)

## Views

| View | Purpose | Source Tables |
|---|---|---|
| `fee_student_summary` | Per-student fee totals + rank-based risk | `fee_ledgers` |
| `assessment_student_summary` | Per-term assessment percentage | `exam_marks` |
| `attendance_daily` | Daily status aggregation (worst status per day) | `attendance` |
| `monitoring_daily` | Unified daily monitor projection | students, enrollments, class_levels, sections, attendance_daily, fee_student_summary, subjective_scores, assessment_student_summary |

### fee_student_summary Columns

`institution_id`, `student_id`, `net_due`, `paid_amount`, `outstanding_amount`, `fee_risk_rank`

Risk rank: `normal=1, warning=2, critical=3` — numeric, not text-order.

### assessment_student_summary Columns

`institution_id`, `student_id`, `term_id`, `term_percentage`

Computed as `avg((raw_marks / max_marks) * 100)` from `exam_marks`.

### attendance_daily Columns

`student_id`, `date`, `status`

Aggregates multiple periods per day — picks 'absent' > 'late' > 'half_day' > other.

### monitoring_daily Columns

`institution_id`, `student_id`, `full_name`, `admission_no`, `class_name`, `section_name`, `day`, `attendance_status`, `fee_net_due`, `fee_paid_amount`, `fee_outstanding_amount`, `fee_risk_rank`, `subjective_index`, `term_percentage`

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/monitoring/daily?tenantId=&date=&className=&sectionName=&minFeeRiskRank=` | Unified monitor feed |

Filters:
- `className` — filter by class_level.label
- `sectionName` — filter by sections.label
- `minFeeRiskRank` — filter by minimum fee risk severity (1=normal, 2=warning, 3=critical)

Guarded by `useMonitoringProjectionApi` feature toggle (default `false`).

## Feature Toggles

| Key | Runtime Key | Default | Stage 1 | Stage 2 | Stage 3 | Stage 4 |
|---|---|---|---|---|---|---|
| `useMonitoringProjectionApi` | `useMonitoringProjectionApi` | `false` | ✗ compare only | ✗ both feeds | ✓ primary | ✓ sole |

## Real-Time Refresh

When attendance, fees, assessment marks, or subjective scores change:
- Domain events are emitted with `tenantId`, `studentId`, and effective `date`
- The relevant monitor query cache is invalidated
- Affected rows are refetched

If using Supabase Realtime, subscribe to underlying domain tables and refresh filtered monitor data. No UI redesign in this patch.

## Key Files

- `supabase/migrations/20260524190010_global_monitor_backend.sql` — 4 views
- `app/api/monitoring/daily/route.ts` — Monitoring API (guarded by toggle)
- `src/lib/featureToggles.ts` — `useMonitoringProjectionApi` added
- `src/config/featureToggles.ts` — Config surface updated
