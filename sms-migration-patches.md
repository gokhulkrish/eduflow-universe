# SMS-2 → eduflow-universe Migration Patches

> 10 incremental patches that bridge the legacy SMS-2 monolith into the eduflow-universe architecture.
> Each patch can be toggled independently via feature flags (`src/lib/featureFlags.ts`) and rolled back via `src/lib/rollbackRegistry.ts`.

---

## Patch 001: Foundation Audit ✅ LIVE
**Flag:** `patch-001-foundation-audit` | **Default:** ON

**Goal:** Establish the compatibility registry, ownership map, and gap analysis.

**Deliverables:**
- `migration-registry.ts` – runtime registry snapshot with gap/collision/capability analysis
- `module-registry.ts` – 52 architecture modules + 12 legacy-pack modules as `ModuleDefinition[]`
- `legacy-adapter.ts` – route translation (53 alias pairs), storage key normalization (14 prefixes), event bridging
- `migration-registry.json` – patch definitions with `defaultEnabled` flags

**Verification:** Migration.tsx renders 52 indexed modules, gap analysis lists 0 critical gaps.

---

## Patch 002: Safe Feature Flags ✅ LIVE
**Flag:** `patch-002-safe-feature-flags` | **Default:** ON

**Goal:** Runtime toggles, rollback registry, and scoped activation for every patch.

**Deliverables:**
- `featureFlags.ts` – `MIGRATION_PATCH_FLAGS` (10 flags), env override support (`VITE_MIGRATION_FLAGS`), localStorage persistence
- `rollbackRegistry.ts` – per-patch rollback records with `active`/`reason`/`triggeredAt`/`resolvedAt`

**Verification:** Migration.tsx shows toggle switches for all 10 patches with rollback buttons.

---

## Patch 003: Runtime Shell Compatibility ✅ LIVE
**Flag:** `patch-003-runtime-shell-compatibility` | **Default:** ON

**Goal:** Desktop/mobile shell intelligence and hydration stability.

**Deliverables:**
- `shell-runtime.ts` – shell mode detection, sidebar state, focus orchestration
- `mobile-shell.ts` – mobile-specific shell adaptations
- `mobile-runtime.ts` – runtime detection and responsive behavior
- `runtime-diagnostics.ts` – startup trace, performance metrics, error boundaries

**Verification:** Sidebar collapses on mobile, focus mode works, runtime diagnostics panel displays metrics.

---

## Patch 004: State Normalization ✅ LIVE
**Flag:** `patch-004-state-normalization` | **Default:** ON

**Goal:** Unified state adapters for focus, workspace, settings, and registry state.

**Deliverables:**
- `state-normalization.ts` – state bridging between legacy and new formats
- `runtime-storage.ts` – namespaced localStorage wrapper with change detection
- `storage-registry.ts` – registered storage keys with read/write hooks
- `storage-normalization.ts` – storage key migration from legacy prefixes

**Verification:** All localStorage keys use `sms.*` prefix; legacy keys bridged through `legacy-adapter.ts`.

---

## Patch 005: Workspace Actions ✅ LIVE
**Flag:** `patch-005-workspace-actions` | **Default:** ON

**Goal:** Workspace menus, focus orchestration, and floating actions.

**Deliverables:**
- `app-sync.ts` – event bus with subscribe/emit for cross-module communication
- `command-center-access.ts` – role-based dashboard (Command Center) access
- AppLayout.tsx + AppSidebar.tsx – responsive sidebar with permission-gated navigation

**Verification:** Sidebar groups render with correct permission filtering; Command Center shows for admin roles.

---

## Patch 006: Settings Orchestration ✅ LIVE
**Flag:** `patch-006-settings-orchestration` | **Default:** ON

**Goal:** Advanced settings tabs, panels, and persistence.

**Deliverables:**
- `Settings.tsx` – multi-tab settings page (workspace control, AI policy, startup trace)
- `InstituteSettings.tsx` – institute profile editor with branding/accreditation
- `SettingsHeaders.tsx` – header registry with custom fields and alias management
- `header-registry.ts` – `initRegistryStorage()` for header persistence

**Verification:** Settings page renders tabs; headers & fields panel reads/writes localStorage.

---

## Patch 007: Registry Core ✅ LIVE
**Flag:** `patch-007-registry-core` | **Default:** ON

**Goal:** Unified registry model, metadata, grouping, and persistence contracts.

**Deliverables:**
- `global-access-registry.ts` – `APP_ACCESS_RULES` (path→key mapping) with `resolveAccessKeyForPathname()`
- `module-access.ts` – `loadAccessibleModuleKeys()` and `isModuleEnabled()` with Supabase RBAC
- `capability-matrix.ts` – level hierarchy (none→view→create→edit→approve→delete→export→manage)
- `capability-runtime.ts` – in-memory/localStorage overrides for module capabilities

**Verification:** ResolveAccessKeyForPathname returns correct keys; RouteAccessGate gates routes.

---

## Patch 008: Registry Explorer ✅ LIVE
**Flag:** `patch-008-registry-explorer` | **Default:** ON

**Goal:** Inspector tooling, JSON views, and list virtualization.

**Deliverables:**
- `Migration.tsx` – migration control center UI with stats, gap analysis, capability clusters, domain map
- `duplication-report.ts` – module deduplication detection
- `module-deduplication.ts` – duplicate module key resolution
- `permission-matrix-search.ts` – search within permission matrix

**Verification:** Migration.tsx renders all panels; gap analysis shows real data.

---

## Patch 009: Student Workspace ✅ LIVE
**Flag:** `patch-009-student-workspace` | **Default:** ON

**Goal:** Student contextual tabs, detail panels, and flyout orchestration.

**Deliverables:**
- `Students.tsx` – student directory with search, pagination, CSV export
- `AddStudent.tsx` – student creation/edit form with custom fields
- `StudentInformation.tsx` – student detail view
- `StudentSearch.tsx` – advanced student search with filters
- `student-import.ts` – bulk import pipeline (58 KB) with fuzzy header matching, identity keying, validation, commit, rollback
- `import-engine/` – 25 files with 10 adapters (student, fees, attendance, exam-marks, transport, hostel, library, HR, admissions, assignments)

**Verification:** Student CRUD works; import pipeline processes CSV files through all 7 steps.

---

## Patch 010: ERP Context ✅ LIVE
**Flag:** `patch-010-erp-context` | **Default:** ON

**Goal:** ERP module grouping, contextual navigation, and activation engine.

**Deliverables:**
- `module-configs.tsx` – 26 ERP module UI configs (title, subtitle, icon, features)
- `module-registry.ts` – `primaryModules[]` × 52 + `legacyPackModules[]` × 12
- `group-model.ts` – section visibility management with collision detection
- `enterprise-orchestration.ts` – cross-module orchestration patterns
- `runtime-hardening.ts` – error recovery and state resilience
- `runtime-resilience.ts` – retry/circuit-breaker patterns
- `migration-certification.ts` – compliance verification reporting

**Verification:** All 52 primary modules accessible via sidebar; legacy packs render as context forms.

---

## Status Summary

| Patch | Status | Modules Unlocked | Key Files |
|-------|--------|-----------------|-----------|
| 001 Foundation Audit | ✅ LIVE | registry infrastructure | `migration-registry.ts`, `module-registry.ts`, `legacy-adapter.ts` |
| 002 Safe Feature Flags | ✅ LIVE | toggle/rollback system | `featureFlags.ts`, `rollbackRegistry.ts` |
| 003 Runtime Shell | ✅ LIVE | shell, mobile, diagnostics | `shell-runtime.ts`, `mobile-shell.ts` |
| 004 State Normalization | ✅ LIVE | state adapters | `state-normalization.ts`, `runtime-storage.ts` |
| 005 Workspace Actions | ✅ LIVE | app layout, sidebar, event bus | `AppSidebar.tsx`, `app-sync.ts` |
| 006 Settings Orchestration | ✅ LIVE | settings pages & headers | `Settings.tsx`, `InstituteSettings.tsx` |
| 007 Registry Core | ✅ LIVE | access registry, RBAC | `global-access-registry.ts`, `module-access.ts` |
| 008 Registry Explorer | ✅ LIVE | migration UI, gap analysis | `Migration.tsx`, `duplication-report.ts` |
| 009 Student Workspace | ✅ LIVE | student CRUD, import engine | `Students.tsx`, `student-import.ts`, `import-engine/` |
| 010 ERP Context | ✅ LIVE | all 52 modules, sidebar, configs | `module-configs.tsx`, `group-model.ts` |
| 011 Inventory & Guard Rails | ✅ LIVE | feature map, compat/ namespace | `legacyFeatureMap.ts`, `docs/migration/00-*.md`, `legacy/compat/` |
| 012 Schema Map | ✅ LIVE | batch_imports tables | `docs/migration/01-*.md`, `20260524170000_batch_imports_tables.sql` |
| 013 Import Engine Parity | ✅ LIVE | validation compat layer | `legacy/compat/importValidation.ts`, `docs/migration/02-*.md` |
| 014 Student Read Mirror | ✅ LIVE | read adapter | `legacy/compat/studentReadAdapter.ts`, `docs/migration/03-*.md` |
| 015 Student Dual-Write | ✅ LIVE | create/update/deactivate with dual-write | `core/students/service.ts`, `docs/migration/04-*.md` |
| 016 Attendance Service | ✅ LIVE | mark/upload/override | `core/attendance/service.ts`, `docs/migration/05-*.md` |
| 017 Assessment Engine | ✅ LIVE | scoring compat | `legacy/compat/scoringEngine.ts`, `docs/migration/06-*.md` |
| 018 Subjective Scoring | ✅ LIVE | standardized 1-10 scoring | `core/scoring/subjectiveToStandard.ts`, `docs/migration/07-*.md` |
| 019 Comms Engine | ✅ LIVE | template/campaign/log tables + 9 UI pages | `core/comms/service.ts`, `20260524171000_communications_tables.sql`, `CommsTemplates.tsx`, `CommsCampaigns.tsx`, `CommsBulkComposer.tsx`, `CommsLogs.tsx`, `CommsNotices.tsx`, `CommsEmergency.tsx`, `CommsFeedback.tsx`, `CommsClassWall.tsx`, `CommsAutomation.tsx` |
| 020 Audit Service | ✅ LIVE | centralized audit | `core/audit/service.ts`, `docs/migration/10-*.md` |
| 021 Monitor Dashboard | ✅ LIVE | monitoring_overview view | `core/monitoring/service.ts`, `20260524172000_monitoring_projection.sql` |
| 022 Promotion Engine | ✅ LIVE | Supabase-backed promotion | `core/academics/promotion.ts`, `20260524173000_promotion_tables.sql`, `PromotionEngine.tsx` |
| 023 Remark Templates | ✅ LIVE | score-range template matching | `core/academics/remarks.ts`, `20260524180000_seed_new_tables.sql` |
| 024 API Routes | ✅ LIVE | REST endpoints for all services | `app/api/promotion/`, `app/api/attendance/`, `app/api/monitoring/`, `app/api/audit/`, `app/api/comms/`, `app/api/remarks/` |
| 025 React Query Hooks | ✅ LIVE | typed hooks | `src/hooks/usePromotion.ts`, `useAttendance.ts`, `useScoring.ts`, `useMonitoring.ts`, `useAuditLog.ts` |
| 026 Feature Toggles | ✅ LIVE | business-level toggles | `src/lib/featureToggles.ts` |
| 027 Seed Data | ✅ LIVE | default templates, rules | `20260524180000_seed_new_tables.sql` |

All **27 patches** are ✅ LIVE. The migration is complete — all core services, UI pages, routes, and sidebar entries are implemented and wired.
