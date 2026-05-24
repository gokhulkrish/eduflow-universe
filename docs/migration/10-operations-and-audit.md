# Patch 10 – Operations, Audit, and Safety Nets

## Audit Logs

Extended existing `public.audit_log` table with:
- `institution_id` — tenant-scoped queries
- `actor_role` — role at time of action
- `source` — `'legacy-adapter'`, `'api'`, `'job'`, `'system'`
- `before_state`, `after_state` — dedicated jsonb columns for change tracking

| Function | Location | Description |
|---|---|---|
| `logAudit` | `src/core/audit/log.ts` | Writes audit entry (pool-based, redacts sensitive fields) |
| `writeAuditEntry` | `core/audit/service.ts` | Existing supabase-based audit writer (unchanged) |

## Export Endpoints

| Endpoint | Description | CSV Columns |
|---|---|---|
| `GET /api/exports/students?tenantId=` | Student roster | AdmissionNo, Name, Class, Section |
| `GET /api/exports/attendance?tenantId=&date=` | Daily attendance | StudentID, AdmissionNo, Name, Date, Period, Status |
| `GET /api/exports/fees?tenantId=&studentId=` | Fee ledgers | LedgerID, StudentID, AdmissionNo, Name, DueAmount, PaidAmount, Concession, Adjustment, DueDate, Status, RiskState |
| `GET /api/exports/marks?tenantId=&termId=` | Exam marks | MarkID, StudentID, AdmissionNo, Name, TermID, SubjectID, ComponentID, RawMarks, MaxMarks |
| `GET /api/exports/scores?tenantId=&studentId=&date=` | Subjective scores | ScoreID, StudentID, AdmissionNo, Name, RubricCode, PeriodStart, PeriodEnd, Scores, Composite |

All return `Content-Type: text/csv` with `Content-Disposition: attachment`.

## Scheduled Jobs

| Job | File | Purpose | Schedule | Retention | Failure |
|---|---|---|---|---|---|
| `checkDataIntegrity` | `src/jobs/checkDataIntegrity.ts` | Detect orphan ledgers, attendance, marks, queue rows | Daily | N/A | Logs audit entry with severity |
| `expireStaleBatches` | `src/jobs/expireStaleBatches.ts` | Mark stale import batches as 'expired' | Daily | 30 days | Silently skips |

### checkDataIntegrity Scans

- `fee_ledgers` with no matching `students.id`
- `attendance` with no matching `students.id`
- `exam_marks` with no matching `students.id`
- `message_queue` with no matching `message_templates.id`

All violations logged via `logAudit` with severity metadata.

## Migration Details

- **Additive only**: `alter table ... add column if not exists`
- **Existing `audit_log` table preserved**: new columns added alongside existing ones
- **Existing `core/audit/service.ts` preserved**: `writeAuditEntry` and `queryAuditLog` continue to work unchanged

## Key Files

- `supabase/migrations/20260524190009_operations_audit_and_safety.sql` — Schema extensions
- `src/core/audit/log.ts` — New audit helper (redaction, pool-based)
- `app/api/exports/students/route.ts` — Student CSV export
- `app/api/exports/attendance/route.ts` — Attendance CSV export
- `app/api/exports/fees/route.ts` — Fee ledger CSV export
- `app/api/exports/marks/route.ts` — Marks CSV export
- `app/api/exports/scores/route.ts` — Subjective scores CSV export
- `src/jobs/checkDataIntegrity.ts` — Integrity check job
- `src/jobs/expireStaleBatches.ts` — Stale batch cleanup job
