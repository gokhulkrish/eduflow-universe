# Patch 06 – Assessment & Scoring Engine Alignment

## Data Model

| Table | Purpose | Status |
|---|---|---|
| `exam_terms` | Exam terms (created in Patch 01) | ✅ Live |
| `exam_components` | Exam components per term/subject (Patch 01) | ✅ Live |
| `exam_marks` | Raw + weighted marks per student/subject/component | ✅ Added |
| `grade_rules` | Grading schemes with percentage ranges per grade | ✅ Added |

### `exam_marks` Columns

`institution_id`, `term_id`, `component_id`, `subject_id`, `student_id`, `raw_marks`, `max_marks`, `weighted_marks`, `remarks`, `source_system`, `legacy_batch_id`, `created_by`, timestamps.

Unique constraint: `(institution_id, term_id, component_id, subject_id, student_id)`.

### `grade_rules` Columns

`institution_id`, `name`, `code`, `min_percentage`, `max_percentage`, `grade`, `grade_point`, `deleted_at`.

Index: `(institution_id, code)`.

## Scoring Engine

| Function | Location | Description |
|---|---|---|
| `calculateTermScore` | `src/core/assessment/scoringEngine.ts` | Computes weighted marks, percentage, grade + gradePoint from components |
| `getGradeForPercentage` | `src/core/assessment/scoringEngine.ts` | Looks up grade from `grade_rules` table by percentage range |
| `legacyRound` | `src/core/assessment/scoringEngine.ts` | Deterministic rounding (2 decimals) matching legacy output |

Fallback to `src/lib/exams.calculateGrade()` + built-in 9-point scale when `grade_rules` query fails.

## Marks Entry Service

| Function | Location | Description |
|---|---|---|
| `upsertMark` | `src/core/assessment/service.ts` | Upserts a single mark row with conflict handling |
| `getMarksForTerm` | `src/core/assessment/service.ts` | Returns all marks for a student/term |

## Import Integration

`src/core/imports/config/assessmentImportConfig.ts` rewritten to:
- Normalize both legacy (`umis-legacy-v1`) and latest templates with `termCode`, `subjectCode`, `componentCode`
- Resolve `student`, `term`, `subject`, `component` IDs in `applyRow`
- Call `upsertMark` for persistence (replaces old stub that inserted into `exam_marks` with hardcoded schedule ID)

## Legacy Adapter

`src/legacy/compat/marksWriteAdapter.ts`:
- `legacyUpsertMark(payload)` converts snake_case payload and delegates to `upsertMark`

## API Routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/assessment/marks` | Upsert a mark (guarded by `useNewAssessmentEngine`) |
| `GET` | `/api/assessment/marks?tenantId=&termId=&studentId=` | Get marks + computed term score |

## Feature Toggle

- Runtime key: `useNewScoring` (default `true`)
- Config surface: `useNewAssessmentEngine` mapped via `src/config/featureToggles.ts`
- API routes return 400 when disabled

## SQL Migration

`supabase/migrations/20260524190004_assessment_marks_and_grade_rules.sql`:
- Creates `public.exam_marks` table with unique constraint and RLS policies
- Creates `public.grade_rules` table with index and RLS policies
- Both tables get `updated_at` triggers

## Key Files

- `src/core/assessment/scoringEngine.ts` — Deterministic scoring engine
- `src/core/assessment/service.ts` — Marks CRUD
- `src/core/imports/config/assessmentImportConfig.ts` — Import engine config
- `src/legacy/compat/marksWriteAdapter.ts` — Legacy adapter
- `app/api/assessment/marks/route.ts` — API endpoints
- `supabase/migrations/20260524190004_assessment_marks_and_grade_rules.sql` — DB changes
- `src/lib/exams.ts` — Existing exam functions (delegated to)
