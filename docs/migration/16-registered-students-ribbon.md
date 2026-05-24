# Patch 16 – Registered Students Ribbon and Advanced Table Parity

> **Objective:** Migrate legacy registered-students workspace controls, table behaviors, export tools, review actions, and governance tools without redesigning the UI or overwriting working modules.

## Ribbon Command Model

The legacy ribbon exposes a 44-command surface preserved as `RegisteredAction`:

| Group | Commands |
|---|---|
| **Selection** | select_all, deselect_all, invert_select, select_by_filter |
| **Review** | approve, reject, compare_versions, lock_fields, send_correction_request |
| **Notes** | internal_note, counselor_note, principal_note, parent_request_log |
| **Import/Export** | download_template, open_import, export_csv, export_xlsx, export_json, export_gov_format, download_report, open_report_center, print_grid, subscription |
| **View** | copy_view, view_grid, view_card, view_split |
| **Layout** | toggle_compact, toggle_wrap, toggle_freeze_first, toggle_freeze_actions, toggle_banded, toggle_focus |
| **Analytics** | compute_summary, chart_report, pivot_report, group_by, control_break, save_report |
| **Governance** | highlight_missing, duplicate_detect, permissions, field_visibility, audit_log, restore_version, retention_policies |

## Database Extensions

Migration: `supabase/migrations/20260524190014_registered_workspace.sql`

### `registered_workspace_presets`

Stores view mode, layout toggles, column visibility, sort, filter, and report state per user.

| Column | Type | Purpose |
|---|---|---|
| `institution_id` | `uuid` | Tenant |
| `user_id` | `uuid` | Owner (nullable for shared) |
| `preset_name` | `text` | User-facing name |
| `view_mode` | `text` | `grid`, `card`, `split` |
| `compact` | `bool` | Compact row mode |
| `wrap` | `bool` | Text wrapping |
| `freeze_first` | `bool` | Freeze identity columns |
| `freeze_actions` | `bool` | Freeze action column |
| `banded_rows` | `bool` | Alternating row colors |
| `focus_mode` | `bool` | Reduced visual noise |
| `group_by` | `jsonb` | Grouping configuration |
| `control_break` | `jsonb` | Control break settings |
| `visible_columns` | `jsonb` | Column visibility map |
| `sort_state` | `jsonb` | Sort direction/field |
| `filter_state` | `jsonb` | Active filters |
| `report_state` | `jsonb` | Report projection config |

### `registered_workspace_actions`

Audit trail for governance and ribbon actions.

| Column | Type | Purpose |
|---|---|---|
| `institution_id` | `uuid` | Tenant |
| `user_id` | `uuid` | Actor |
| `action` | `text` | `RegisteredAction` value |
| `row_ids` | `jsonb` | Affected row IDs |
| `meta` | `jsonb` | Extra context |

### `registered_report_snapshots`

Saved report state for sharing, download, and subscriptions.

| Column | Type | Purpose |
|---|---|---|
| `institution_id` | `uuid` | Tenant |
| `user_id` | `uuid` | Owner |
| `report_name` | `text` | User-facing name |
| `report_state` | `jsonb` | Full report configuration |

## Selection Service

`applySelectionAction(action, currentIds, visibleIds)` handles:
- `select_all` → return all visible IDs
- `deselect_all` → return empty array
- `invert_select` → toggle each visible ID
- `select_by_filter` → return all visible IDs

## API Routes

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/registered-students/actions` | Log a ribbon action |
| `GET` | `/api/registered-students/presets` | List presets (optionally per user) |
| `POST` | `/api/registered-students/presets` | Save a new preset |
| `DELETE` | `/api/registered-students/presets/:id` | Delete a preset |
| `GET` | `/api/registered-students/report-snapshots` | List saved snapshots |
| `POST` | `/api/registered-students/report-snapshots` | Save a report snapshot |

## Legacy Parity Notes

Preserved behaviors:
- Ribbon tab groups and tool buttons (existing `Students.tsx` + `group-model.ts`)
- Export/download/report center (existing CSV export + new snapshot endpoints)
- Selection inversion/filter selection (new `applySelectionAction`)
- Comparison and lock actions (new `registered_workspace_actions` log)
- Administrative audit/restore/retention actions (new action log)

Not introduced:
- No UI redesign
- No overwrite of existing `Students.tsx` ribbon rendering

## Files Created

| File | Purpose |
|---|---|
| `supabase/migrations/20260524190014_registered_workspace.sql` | 3 tables + indexes + RLS |
| `src/core/registered-students/types.ts` | `RegisteredAction`, `WorkspacePreset`, `WorkspaceAction`, `ReportSnapshot` |
| `src/core/registered-students/service.ts` | selection, preset CRUD, action logging, snapshot CRUD |
| `src/core/registered-students/index.ts` | Barrel export |
| `app/api/registered-students/actions/route.ts` | POST log action |
| `app/api/registered-students/presets/route.ts` | GET/POST presets |
| `app/api/registered-students/presets/[id]/route.ts` | DELETE preset |
| `app/api/registered-students/report-snapshots/route.ts` | GET/POST snapshots |
| `docs/migration/16-registered-students-ribbon.md` | This document |

## Done Criteria

- [x] Ribbon commands are represented as backend actions (`RegisteredAction` type)
- [x] Export/report tools are available through API endpoints
- [x] View modes and layout toggles persist per user or preset (`registered_workspace_presets`)
- [x] Review, lock, and correction flows remain separate and traceable
- [x] Governance actions are logged (`registered_workspace_actions`)
- [x] No UI redesign introduced
