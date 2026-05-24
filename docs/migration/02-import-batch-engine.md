# Patch 02 – Unified Import Batch Engine (Legacy + Latest Version Compatible)

## Behavioral Parity with Legacy Wizard

The new engine at `src/core/imports/` reproduces all legacy wizard behaviors from `SMS-2.html`:

| Legacy Step | Engine Function | API Endpoint | Status |
|---|---|---|---|
| Create batch (name, entity type, match rules) | `createImportBatch()` | `POST /api/imports/batches` | ✅ Live |
| Choose file (.xlsx, .xls, .csv) | `parseAndStageRows()` | `POST /api/imports/batches/:batchId/files` | ✅ Live |
| Recover saved batch (by status) | `listBatches()` / `getImportBatchById()` | `GET /api/imports/batches` / `GET /api/imports/batches/:batchId` | ✅ Live |
| Validate rows | `validateBatch()` | `POST /api/imports/batches/:batchId/validate` | ✅ Live |
| Explicit Apply step | `applyBatch()` | `POST /api/imports/batches/:batchId/apply` | ✅ Live |

## Version-Aware Engine Architecture

### Files

| File | Purpose |
|---|---|
| `src/core/imports/types.ts` | `ImportContext`, `ImportEntityConfig<T>`, `ImportEntityType`, `ImportBatchStatus` |
| `src/core/imports/engine.ts` | Orchestration: create → attach → parse → validate → apply lifecycle |
| `src/core/imports/fileParser.ts` | Parses `.xlsx`/`.xls`/`.csv` into `Record<string, unknown>[]` |
| `src/core/imports/config/studentsImportConfig.ts` | Student import config (legacy UMIS + latest Superior templates) |
| `src/core/imports/config/attendanceImportConfig.ts` | Attendance import config (legacy + latest) |
| `src/core/imports/config/feesImportConfig.ts` | Fees import config (legacy + latest) |
| `src/core/imports/config/assessmentImportConfig.ts` | Assessment marks import config (legacy + latest) |
| `src/core/imports/index.ts` | Barrel export |

### Version Metadata in DB

`supabase/migrations/20260524190002_import_batch_versions.sql` adds:
- `import_batches.template_version` (text, default `'v1'`) — identifies file/template layout
- `import_batches.schema_version` (text, default `'v1'`) — identifies target backend schema

### How Version Awareness Works

Each `ImportEntityConfig<TNormalized>` has a `normalizeRow(raw, ctx)` that branches on `ctx.templateVersion`:

- `umis-legacy-v1` → maps UMIS column names (`AdmissionNo`, `UMIS_ID`, `FirstName`, etc.)
- `superior-v1` (default) → maps latest Superior column names (`AdmissionNo`, `LegacyUMIS`, `ClassCode`, etc.)

Validation can also branch on `ctx.schemaVersion`:
- `core-v1` → basic required-field checks
- `core-v2` → additional validation (phone format, email format, etc.)

## API Endpoints

All endpoints check `useNewImportEngine` toggle and return 400 if disabled.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/imports/batches` | Create a new batch |
| `GET` | `/api/imports/batches` | List batches (optional `?tenantId=`) |
| `GET` | `/api/imports/batches/:batchId` | Get single batch (Recover Saved Batch) |
| `POST` | `/api/imports/batches/:batchId/files` | Attach and parse a file |
| `POST` | `/api/imports/batches/:batchId/validate` | Run validation |
| `POST` | `/api/imports/batches/:batchId/apply` | Apply (commit) validated rows |

## Entity Configs – Legacy + Latest Templates

### Students

| Feature ID | Legacy Template(s) | Latest Template(s) | Config | Rollout Status |
|---|---|---|---|---|
| ADM-IMPORT-1 | `umis-legacy-v1` | `superior-students-v1` | `studentsImportConfig` | ✅ Implemented |

**Legacy columns:** AdmissionNo, UMIS_ID, FirstName, LastName, Class, Section, DOB
**Latest columns:** AdmissionNo, LegacyUMIS, FirstName, LastName, ClassCode, SectionCode, DateOfBirth, GuardianPhone, Email

### Attendance

| Feature ID | Legacy Template(s) | Latest Template(s) | Config | Rollout Status |
|---|---|---|---|---|
| ATT-IMPORT-1 | `umis-legacy-v1` | `superior-attendance-v1` | `attendanceImportConfig` | ✅ Implemented |

**Legacy columns:** AdmissionNo, Date, Status, Period, Remarks
**Latest columns:** AdmissionNo, date, attendance_status, period, remarks

### Fees

| Feature ID | Legacy Template(s) | Latest Template(s) | Config | Rollout Status |
|---|---|---|---|---|
| FEE-IMPORT-1 | `umis-legacy-v1` | `superior-fees-v1` | `feesImportConfig` | ✅ Implemented |

**Legacy columns:** AdmissionNo, Amount, Date, Method, RefNo, Category
**Latest columns:** AdmissionNo, amount_paid, payment_date, payment_method, transaction_reference, fee_category

### Assessment

| Feature ID | Legacy Template(s) | Latest Template(s) | Config | Rollout Status |
|---|---|---|---|---|
| ASM-IMPORT-1 | `umis-legacy-v1` | `superior-assessment-v1` | `assessmentImportConfig` | ✅ Implemented |

**Legacy columns:** AdmissionNo, Subject, Marks, MaxMarks, Date, ExamName, Grade
**Latest columns:** AdmissionNo, subject_code, marks_obtained, max_marks, exam_date, exam_name

## Feature Toggle Strategy

| Environment | `useNewImportEngine` | Notes |
|---|---|---|
| Development | `true` | Test both legacy UMIS files and new templates |
| Staging | `true` | Per-module validation |
| Production | `true` (default) | Legacy engine remains callable via toggle override |

Toggle key is `useNewImport` in runtime (`src/lib/featureToggles.ts`) mapped to `useNewImportEngine` in config surface (`src/config/featureToggles.ts`).

## Key Files

- `src/core/imports/types.ts` — Version-aware type definitions
- `src/core/imports/engine.ts` — Engine orchestrator (create → validate → apply)
- `src/core/imports/fileParser.ts` — File parsing (.xlsx/.xls/.csv)
- `src/core/imports/config/*.ts` — Per-entity import configs
- `app/api/imports/batches/**/route.ts` — API endpoints
- `supabase/migrations/20260524190002_import_batch_versions.sql` — Version columns
- `src/lib/featureToggles.ts` — `useNewImport` runtime toggle
- `src/lib/import-engine/` — Existing client-side engine (legacy adapter layer)
