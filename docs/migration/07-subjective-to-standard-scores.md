# Patch 07 – Subjective → Standardized Score Engine (Behavior → 1–10 Index)

## Data Model

| Table | Purpose | Status |
|---|---|---|
| `subjective_rubrics` | Rubric definitions with JSON config (dimensions, weights, anchors) | ✅ Added |
| `subjective_observations` | Raw teacher observations per student/date | ✅ Added |
| `subjective_scores` | Computed 1–10 dimension scores + composite index | ✅ Added |

### `subjective_rubrics` Config JSON Structure

```json
{
  "dimensions": [
    { "key": "behavior", "label": "Classroom Behavior", "weight": 0.25,
      "anchors": [{ "score": 2, "keywords": ["disruptive"] }, ...] },
    ...
  ]
}
```

## Scoring Engine

| Function | Location | Description |
|---|---|---|
| `subjectiveToStandardized` | `src/core/scoring/subjectiveToStandard.ts` | Pure function: maps comment keywords + payload flags to 1–10 dimension scores via rubric anchors, computes weighted composite |
| `clampScore` | Internal helper | Clamps to 1–10 range |

Logic: iterates rubric anchors, matches against comment keywords or boolean flags (`is_disruptive`, etc.), picks lowest matched score per dimension (conservative). Default 5 if no match.

## Service Layer

| Function | Location | Description |
|---|---|---|
| `recordObservation` | `src/core/scoring/service.ts` | Inserts observation, loads rubric config, computes scores via engine, upserts `subjective_scores` |
| `getScoresForStudent` | `src/core/scoring/service.ts` | Returns scores for a student/date |

## Legacy Adapter

`src/legacy/compat/subjectiveAdapter.ts`:
- `legacyRecordObservation(payload)` converts boolean flags (`Y`/`N`, `yes`/`no`), dd-mm-yyyy dates, delegates to `recordObservation`

## API Routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/subjective/observations` | Record observation (guarded by `useNewAssessmentEngine`) |
| `GET` | `/api/subjective/scores?tenantId=&studentId=&date=` | Get scores for a student on a date |

## Feature Toggle

Reuses `useNewScoring` / `useNewAssessmentEngine` (already exists, defaults `true`).

## SQL Migration

`supabase/migrations/20260524190005_subjective_scoring.sql`:
- Creates `subjective_rubrics` with unique index on `(institution_id, code)`
- Creates `subjective_observations` with index on `(institution_id, student_id, observed_on)`
- Creates `subjective_scores` with index on `(institution_id, student_id, period_start, period_end)`
- All tables have RLS policies and `updated_at` triggers

## Key Files

- `src/core/scoring/subjectiveToStandard.ts` — Pure scoring engine
- `src/core/scoring/service.ts` — Orchestrates observations, scoring, and persistence
- `src/legacy/compat/subjectiveAdapter.ts` — Legacy adapter
- `app/api/subjective/observations/route.ts` — Observation API
- `app/api/subjective/scores/route.ts` — Scores API
- `supabase/migrations/20260524190005_subjective_scoring.sql` — DB changes
