# Patch 0 – Inventory & Guard Rails

## Feature Inventory

All 52 architecture modules have been catalogued and migrated. The complete inventory lives in:

- `INVENTORY.md` – 52 modules with field tables for 12 ERP pack modules
- `lib/module-registry.ts` – 2120-line full module definition array
- `MIGRATION_LOG.md` – per-module old/new file mapping and current status
- `src/lib/migration-registry.ts` – runtime registry with compatibility/ownership/gap analysis

### Feature Groups

| Group | Source of Truth in Legacy | Equivalent in New System | Status |
|-------|--------------------------|-------------------------|--------|
| Identity & Auth | `window` globals, login forms | `supabase.auth`, `module-access.ts` | ✅ Compatible |
| Student Master Data | `addStudentSection`, `registeredSection` | `student-records.ts`, `student-import.ts` | ✅ Compatible |
| Academic Structure | Inline ERP forms | `class-mgmt.ts`, `subject-mgmt.ts`, `timetable.ts` | ✅ Compatible |
| Attendance | `attendanceClassSection` | `Attendance.tsx`, `attendance-adapter.ts` | ⚡ Bridge needed |
| Assessment | `examSection` | `exams.ts`, `exam_schedules` table | ✅ Compatible |
| Fees/Finance | `feeManagement` workspace | `fees.ts` (1013 lines) | ✅ Compatible |
| Communication | Inline SMS/email forms | `comms.ts` (localStorage) | ⚡ Bridge needed |
| Operations | `importSection` wizard | `import-engine/` (25 files) | ✅ Compatible |

## Feature Toggle Strategy

- Feature flags defined in `src/lib/featureFlags.ts` (10 patches, all default ON)
- Flags support env override (`VITE_MIGRATION_FLAGS`) and localStorage persistence
- Per-patch rollback via `src/lib/rollbackRegistry.ts`

## Compatibility Layer

- `legacy/compat/` namespace for all adapted legacy logic
- All imports from React components to legacy functions go through typed adapters
- `legacyFeatureMap.ts` maps each legacy feature to its target module/service/table
