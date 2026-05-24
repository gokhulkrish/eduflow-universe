# Patch 04 – Student Create/Update with Dual-Write (Legacy + Latest Compatible)

## Service Layer

`src/core/students/service.ts` implements write operations with feature toggle gating:

| Function | Input Type | Description |
|---|---|---|
| `createStudent` | `CreateStudentInput` | Validates firstName required, delegates to existing `core/students/service.ts`, syncs legacy, writes audit |
| `updateStudent` | `UpdateStudentInput` | Captures `before` snapshot, updates via existing service, syncs legacy, writes audit |
| `deactivateStudent` | `DeactivateStudentInput` | Deactivates via existing service, syncs legacy, writes audit |

### Input Types

- **CreateStudentInput**: `tenantId`, `admissionNo?`, `legacyUmisId?`, `firstName`, `middleName?`, `lastName?`, `gender?`, `dateOfBirth?`, `classId?`, `sectionId?`, `joinedOn?`
- **UpdateStudentInput**: extends Create with `id` (UUID), nullable overrides, optional `status`/`leftOn`
- **DeactivateStudentInput**: `tenantId`, `id`, `leftOn?`

## Legacy Write Adapter

`src/legacy/compat/studentsWriteAdapter.ts` converts legacy form payloads to service inputs:

| Legacy Payload Field | Maps To | Transformation |
|---|---|---|
| `adm_no` | `admissionNo` | Pass-through |
| `umis_id` | `legacyUmisId` | Pass-through |
| `student_first_name` | `firstName` | Pass-through |
| `student_last_name` | `lastName` | Pass-through |
| `dob` (dd-mm-yyyy) | `dateOfBirth` | ISO conversion |
| `gender` (M/F) | `gender` (male/female) | Normalization |
| `class_id` / `section_id` | `classId` / `sectionId` | Pass-through |
| `joined_on` | `joinedOn` | ISO conversion |

## Dual-Write & Audit

- `syncLegacyAfterWrite()` — placeholder hook for future legacy sync; no-op when `useNewStudentWrites` is disabled
- `logStudentWrite()` — persists audit via `writeAuditEntry()` with action, before/after snapshots, and actor ID

## API Routes

| Method | Path | Guard | Description |
|---|---|---|---|
| `GET` | `/api/students` | — | List students (Patch 03) |
| `POST` | `/api/students` | `useNewStudentWrites` | Create student |
| `GET` | `/api/students/:id` | — | Get student detail (Patch 03) |
| `PUT` | `/api/students/:id` | `useNewStudentWrites` | Update student |
| `DELETE` | `/api/students/:id` | `useNewStudentWrites` | Deactivate student |

All write endpoints return 400 if `useNewStudentWrites` is disabled.

## Rollout Strategy

| Scenario | Legacy Path | New Service | Dual-Write | Env |
|---|---|---|---|---|
| Dev (shadow) | yes | yes | yes | dev |
| Staging (cutover) | no | yes | no | staging |
| Production | no | yes | no | prod |

Toggle: `useNewStudentWrites` in `src/config/featureToggles.ts` (maps to runtime `useNewStudentWrites` in `src/lib/featureToggles.ts`). Default: `true`.

## Key Files

- `src/core/students/service.ts` — Typed write operations with audit
- `src/legacy/compat/studentsWriteAdapter.ts` — Legacy payload adapter
- `app/api/students/route.ts` — `POST` + `GET`
- `app/api/students/[id]/route.ts` — `GET` + `PUT` + `DELETE`
- `core/students/service.ts` — Existing implementation (delegated to)
- `core/audit/service.ts` — `writeAuditEntry`
