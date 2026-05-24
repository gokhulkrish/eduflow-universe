# Patch 17 – Institute Identity, Settings, and Header Mapping Parity

> **Objective:** Migrate legacy institute identity, header configuration, field mapping, and settings persistence behaviors without redesigning the UI or overwriting working configuration code.

## Identity & Settings Models

### `InstituteIdentity`

| Field | Purpose |
|---|---|
| `name` | Full institute name |
| `shortName` | Abbreviated name |
| `nickname` | Common nickname |
| `code` | Registration code |
| `logoUrl` | Logo image URL |
| `address`, `district`, `state`, `pincode` | Location |
| `phone`, `email`, `website` | Contact |
| `headOfInstitute` | Principal / Director name |
| `nodalOfficer` | Nodal officer name |

### `HeaderConfig`

| Field | Purpose |
|---|---|
| `key` | Unique field key |
| `label` | Display label |
| `visible` | Visibility toggle |
| `mappedTo` | Target field key (if remapped) |
| `aliasOf` | Original header this aliases |
| `group` | Display group |
| `order` | Sort order |

### `ExperienceSettings`

| Section | Fields |
|---|---|
| `theme` | `light`, `dark`, `system` |
| `activityTrace` | `enabled`, `startExpanded`, `autoCollapse`, `autoCollapseDelayMs`, `retainLimit`, `showUnreadBadge` |
| `headers` | `visibleColumns`, `aliases`, `fieldGroups` |
| `workspace` | `sidebarCollapsed`, `focusMode` |

## Database Extensions

Migration: `supabase/migrations/20260524190015_institute_identity_settings.sql`

### `institute_profile`

Single authoritative record per tenant for identity, header config, and settings.

| Column | Type | Purpose |
|---|---|---|
| `institution_id` | `uuid` | Tenant (unique) |
| `identity` | `jsonb` | `InstituteIdentity` payload |
| `header_config` | `jsonb` | Array of `HeaderConfig` |
| `settings` | `jsonb` | `ExperienceSettings` payload |
| `updated_by` | `uuid` | Last editor |

### `institute_headers`

Per-tenant header definitions with visibility, alias, mapping, and grouping.

| Column | Type | Constraints |
|---|---|---|
| `institution_id` | `uuid` | Tenant |
| `key` | `text` | Unique per tenant |
| `label` | `text` | Display label |
| `visible` | `bool` | Default true |
| `mapped_to` | `text` | Remapped target |
| `alias_of` | `text` | Original header |
| `group_name` | `text` | Display group |
| `sort_order` | `int` | Sort position |

Unique: `(institution_id, key)`. Index: `(institution_id, sort_order)`.

### `institute_settings_history`

Audit trail for every settings change.

| Column | Type | Purpose |
|---|---|---|
| `institution_id` | `uuid` | Tenant |
| `changed_by` | `uuid` | Who changed |
| `before_state` | `jsonb` | Snapshot before |
| `after_state` | `jsonb` | Snapshot after |
| `reason` | `text` | Optional reason |

## Persistence Rules

### Load order
1. Database profile (`institute_profile`)
2. Local storage fallback (backward-compatible keys)
3. Built-in defaults

### Save behavior
- Upsert to database
- Write history record on every meaningful change
- Coalesce partial updates (null fields don't erase existing values)

### Reset behavior
Resets restore the last committed profile snapshot from the database, not tenant defaults.

## Header Mapping

`resolveHeaderMapping(headers)` returns visible headers sorted by order, with:
- `mappedTo` defaulting to `key` if not set
- `aliasOf` preserved for backward compatibility with legacy exports and import screens

## API Routes

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/institute/profile?institutionId=...` | Load profile |
| `POST` | `/api/institute/profile` | Save/update profile |
| `GET` | `/api/institute/headers?institutionId=...` | Get resolved headers |
| `GET` | `/api/institute/settings/history?institutionId=...` | Get settings change history |

## Legacy Parity Notes

Preserved behaviors:
- Institute profile editor (via `POST /api/institute/profile`)
- Configured header count and custom header count (via header_config JSON length)
- Last updated display (from `updated_at` / history timestamps)
- Field grouping and alias mapping (via `resolveHeaderMapping`)
- Backward-compatible localStorage keys for experience settings, identity snapshot, header config snapshot, workspace visibility preferences

Not introduced:
- No UI redesign

## Files Created

| File | Purpose |
|---|---|
| `supabase/migrations/20260524190015_institute_identity_settings.sql` | 3 tables + indexes + RLS |
| `src/core/institute/types.ts` | `InstituteIdentity`, `HeaderConfig`, `ExperienceSettings` |
| `src/core/institute/service.ts` | `loadProfile`, `saveProfile`, `resolveHeaderMapping`, `getSettingsHistory` |
| `src/core/institute/index.ts` | Barrel export |
| `app/api/institute/profile/route.ts` | GET/POST profile |
| `app/api/institute/headers/route.ts` | GET resolved headers |
| `app/api/institute/settings/history/route.ts` | GET settings history |
| `docs/migration/17-institute-identity-settings.md` | This document |

## Done Criteria

- [x] Institute profile persists in one authoritative record (`institute_profile`)
- [x] Header mapping supports visible, alias, and mapped fields (`resolveHeaderMapping`)
- [x] Settings load and save with database-first precedence
- [x] History is recorded on every meaningful change (`institute_settings_history`)
- [x] Local storage remains backward compatible
- [x] No UI redesign introduced
