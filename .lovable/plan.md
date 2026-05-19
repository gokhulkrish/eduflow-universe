# SMS_2.html → NextGen EduERP migration plan

The uploaded `SMS_2.html` is a single-file legacy Student Management System: **80,257 lines / 3 MB**, with inline CSS, inline JS, and ~13 major panels plus dozens of sub-workflows (activity trace, workspace FAB, AI assistant, import pipeline with mapping/duplicate detection, registered ribbon, ERP realtime command center, settings headers, savedPresets, etc.). It cannot be ported in a single turn — a faithful migration is realistically **5–7 focused phases**, each one a chat turn.

To honor "no multiple versions — combine into clean structure", every duplicate (e.g. two different pagination renderers, two registered-students surfaces, legacy + ERP overview) will be merged into one canonical React component per concern.

## Source inventory (from the file)

Panels detected:
`homeSection`, `dashboardSection`, `addStudentSection`, `instituteSection`, `importSection`, `importMappingSection`, `importDuplicateSection`, `registeredSection`, `erpOverviewSection`, `attendanceClassSection`, `settingsHeadersSection`, `savedPresetsSection`, `defaultKeySection`, plus global overlays: Activity Trace panel, Workspace Action FAB, AI Import Assistant, Registered Ribbon, Realtime ERP command center.

## Target mapping (single canonical version each)

| Legacy panel(s) | NextGen route | Notes |
|---|---|---|
| homeSection + dashboardSection + erpOverviewSection + realtime ERP panel | `/` Dashboard | merge 3 overlapping dashboards |
| addStudentSection | `/students/new` | new route |
| registeredSection + registeredRibbon | `/students` | merge into existing table |
| importSection + importMappingSection + importDuplicateSection + AI Import Assistant | `/import` (new module) | one wizard: Upload → Map → Dedupe → Commit |
| instituteSection + Institute Identity editor | `/settings/institute` | |
| settingsHeadersSection + savedPresetsSection + defaultKeySection | `/settings/headers` | merge 3 settings panels |
| attendanceClassSection | `/attendance` | replace placeholder |
| Activity Trace panel | global drawer in `AppLayout` | |
| Workspace Action FAB + Focus mode | global FAB in `AppLayout` | |

## Phases (one turn each)

**Phase 1 — Foundation & shell parity**
- Activity Trace drawer (filters, search, export, clear) wired to a `useActivityTrace` store
- Workspace Action FAB (Institute Identity, AI Assistant, Activity Trace, Focus toggle)
- Theme seed (light/dark) carried into `index.html`
- Section focus mode on `AppLayout`

**Phase 2 — Dashboard consolidation**
Merge homeSection + dashboardSection + erpOverviewSection + realtime command center into one `/` Dashboard with hero, KPI strip, realtime command grid, UMIS-inspired widgets. Replace current Dashboard.

**Phase 3 — Students lifecycle**
- `/students` — merged registered table + ribbon (bulk actions, export, print)
- `/students/new` — full Add Student form ported field-by-field
- Sample dataset extended to match all displayed columns

**Phase 4 — Import pipeline (single wizard)**
4-step wizard combining Upload, Mapping, Duplicate resolution, AI Assistant suggestions, Saved Presets, Default Key — one flow, no duplicates.

**Phase 5 — Institute + Settings**
- `/settings/institute` (identity editor with icon, nickname, preview)
- `/settings/headers` (headers + saved presets + default key merged)

**Phase 6 — Attendance & remaining domains**
Port `attendanceClassSection` and any `sms52-domain-*` content groups into `/attendance` and respective module pages.

**Phase 7 — Polish & QA**
Cross-link nav, remove placeholders for migrated modules, verify build, screenshot QA each route.

## Technical approach

- Extract logic from the inline `<script>` blocks into typed React hooks + Zustand stores; no global `window` state.
- Convert inline CSS to Tailwind + tokens already defined in `index.css`; no raw color literals in components.
- Where the legacy file has two implementations of the same widget (e.g. two `pagination-btn` renderers at lines 38596 and 62793), keep the newer ERP-flavored one and delete the other.
- Mock data only — no backend in this migration. Lovable Cloud can be added later if you want persistence.
- Each phase ends with a working build; no half-wired routes left behind.

## What I need from you

1. **Approve the 7-phase plan**, or tell me to merge/drop phases.
2. Confirm priority order (default above) or reorder.
3. Confirm "mock data only" for now (vs. enabling Lovable Cloud immediately for real persistence).

Once approved I'll start **Phase 1** in the next turn.
