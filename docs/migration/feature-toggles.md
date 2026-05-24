# Feature Toggle Usage Contract

## Design Principles

1. **No UI component may directly branch on toggles.**
   Only service and adapter layers may read feature flags. UI components receive already-routed data.

2. **When a flag is turned on, legacy code paths must remain callable**
   until parity is validated via parallel-run comparison.

3. **Toggles default to `false` during development** and flip to `true` as each domain is validated.

## Toggle Surface

Defined in two places:

| File | Purpose |
|------|---------|
| `src/config/featureToggles.ts` | Expanded-spec config surface with `FeatureToggles` interface |
| `src/lib/featureToggles.ts` | Runtime implementation with localStorage persistence |

## Current Toggles

| Key | Default | Domain | Description |
|-----|---------|--------|-------------|
| `useNewStudentWrites` | `true` | Students | Routes student CRUD through `core/students/service.ts` |
| `useNewAttendanceEngine` | `true` | Attendance | Routes attendance through `core/attendance/service.ts` |
| `useNewAssessmentEngine` | `true` | Assessment | Routes scoring/grading through `core/scoring/` |
| `useNewImportEngine` | `true` | Operations | Routes batch imports through `import-engine/` |
| `useNewFeesEngine` | `true` | Fees | Routes fees through `src/lib/fees.ts` |
| `useNewCommunicationsEngine` | `false` | Comms | Routes messaging through `core/comms/service.ts` |
| `useDualWrite` | `true` | All | Enables parallel writes to legacy localStorage during transition |

## Enforcement

- All toggle checks go through `isFeatureEnabled()` in the appropriate domain service layer.
- UI components import domain data via React Query hooks, which internally route through services.
- No `if (isFeatureEnabled(...))` inside `.tsx` files — only in `.ts` service modules.

## Rollback

Each toggle can be overridden at runtime via localStorage:
- Set: `localStorage.setItem("sms.feature-toggles.v1", JSON.stringify({ useNewStudentWrites: false }))`
- Reset: `localStorage.removeItem("sms.feature-toggles.v1")`
- Environment: `VITE_FEATURE_TOGGLES={"useNewStudentWrites":false}` (future)
