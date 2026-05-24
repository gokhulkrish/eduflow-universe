# Patch 13 – Import Engine Deep Parity

> **Objective:** Migrate the full legacy import workflow — batch creation, keying, duplicate review, validation, preview, transfer, and recovery — without replacing the existing new-system engine or redesigning the UI.

## Canonical Workflow States

Strict batch state machine enforced via CHECK constraint on `import_batches.status`:

| State | Meaning |
|---|---|
| `draft` | Batch created, no file yet |
| `uploaded` | Source file attached and parsed |
| `keying` | Separator / composite key configuration in progress |
| `duplicates` | Duplicate detection and resolution active |
| `validating` | Row-level validation running |
| `preview` | Read-only preview of ready-to-transfer rows |
| `ready_to_transfer` | All checks passed, transfer can execute |
| `transferring` | Transfer in progress (locked) |
| `completed` | All rows processed |
| `failed` | Transfer failed (recoverable) |
| `expired` | Stale batch cleaned up by retention policy |

## Database Extensions

Migration: `supabase/migrations/20260524190011_import_engine_deep_parity.sql`

### `import_batches` – Extended Columns

| Column | Type | Purpose |
|---|---|---|
| `institution_id` | `uuid` | Tenant scoping (was missing) |
| `import_type` | `text` | `'new'`, `'update'`, `'both'` |
| `source_type` | `text` | `'excel'`, `'csv'` |
| `file_name` | `text` | Original uploaded filename |
| `file_path` | `text` | Storage path |
| `separator` | `text` | Separator for keying |
| `duplicate_rows` | `int` | Count of duplicate rows detected |
| `recoverable` | `bool` | Whether batch can be recovered (default true) |

### `import_batch_rows` – New Row-Level Parity Table

Mirrors legacy row-level tracking alongside the existing `import_rows` table.

| Column | Type | Purpose |
|---|---|---|
| `institution_id` | `uuid` | Tenant scoping |
| `batch_id` | `uuid` | FK to `import_batches(id)` ON DELETE CASCADE |
| `row_number` | `int` | Index within batch |
| `source_payload` | `jsonb` | Raw source data |
| `normalized_payload` | `jsonb` | Normalized target data |
| `match_status` | `text` | `pending`, `matched`, `duplicate`, `invalid`, `ready` |
| `decision` | `text` | `keep_existing`, `update_existing`, `create_new`, `merge_manual`, `skip` |
| `error_messages` | `jsonb` | Row-level validation errors |

### `import_batch_recoveries` – Recovery Audit Table

| Column | Type | Purpose |
|---|---|---|
| `institution_id` | `uuid` | Tenant scoping |
| `batch_id` | `uuid` | FK to `import_batches(id)` ON DELETE CASCADE |
| `recovered_by` | `uuid` | User who recovered |
| `recovered_at` | `timestamptz` | When recovered |
| `reason` | `text` | Why recovered |
| `meta` | `jsonb` | Extra context |

## Keying Rules

### Separator-Driven Composite Key Builder

```ts
buildImportKey(values: Array<string | null | undefined>, separator = '-'): string
buildRowKey(row: Record<string, unknown>, config: KeyingConfig): string
```

Supports exact-match, fuzzy name, DOB-assisted, admission number, and composite fallback modes.

## Duplicate Review

Preserves legacy decisions:

| Decision | Behavior |
|---|---|
| `keep_existing` | Skip row, keep existing record |
| `update_existing` | Update matched record |
| `create_new` | Insert new record |
| `merge_manual` | Flag for manual resolution |
| `skip` | Skip row entirely |

`classifyDuplicate(row, matches)` returns `new`, `matched`, or `duplicate` status with appropriate decision.

## Transfer Execution

`transferImportBatch(batchId, institutionId, entityConfig)`:

1. Locks batch row (`FOR UPDATE`)
2. Validates state is `ready_to_transfer`
3. Sets state to `transferring`
4. Iterates ready rows calling `entityConfig.applyRow()`
5. Commits counts to batch
6. Writes audit logs (start + complete/failed)
7. On failure: rollback, set `failed`, log error

### Safety Constraints

- Row-level lock prevents concurrent transfers
- Transactional at batch level (all-or-nothing within row group)
- Idempotent via row keys and decisions
- Source rows preserved (no hard delete)
- Audit trail via `src/core/audit/log.ts`

## Recover Saved Batch

`POST /api/imports/batches/:batchId/recover`

Resets state to `draft` for batches in `uploaded`, `keying`, `duplicates`, `validating`, `preview`, or `failed` states. Logs recovery to `import_batch_recoveries`.

## Real-Time Progress

Batch progress observable through state transitions:

```
draft → uploaded → keying → duplicates → validating → preview → ready_to_transfer → transferring → completed
                                                                    ↓                  ↓
                                                                  failed             failed
```

States published on transition; existing UI can react without redesign.

## Files Created

| File | Purpose |
|---|---|
| `src/core/imports/types.ts` | Extended with `ImportBatchState`, `KeyingConfig`, `DuplicateDecision`, `ImportPreviewSummary` |
| `src/core/imports/keyBuilder.ts` | Separator-driven composite key builder |
| `src/core/imports/duplicateDetection.ts` | Duplicate decision classifier |
| `src/core/imports/transferService.ts` | Transactional transfer executor with audit |
| `app/api/imports/batches/[batchId]/recover/route.ts` | Recovery endpoint |
| `supabase/migrations/20260524190011_import_engine_deep_parity.sql` | Schema extensions |
| `docs/migration/13-import-engine-deep-parity.md` | This document |

## Done Criteria

- [x] Batch creation stores all legacy metadata (via `institution_id`, `import_type`, `source_type`, `separator`)
- [x] Keying supports separator/composite logic (`keyBuilder.ts`)
- [x] Duplicate review preserves legacy decisions (`duplicateDetection.ts`)
- [x] Validation blocks unsafe transfer (CHECK constraint enforces state machine)
- [x] Preview is read-only (state `preview` before `ready_to_transfer`)
- [x] Transfer is auditable and idempotent (`transferService.ts` + `logAudit`)
- [x] Saved batches can be recovered (`/recover` endpoint)
- [x] No UI migration introduced in this patch
