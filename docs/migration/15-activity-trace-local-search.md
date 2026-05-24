# Patch 15 – Activity Trace and Local Search Parity

> **Objective:** Migrate legacy runtime observability and local search behaviors without route-to-module mapping, without UI redesign, and without replacing working search or trace features unless missing legacy behavior requires it.

## Activity Trace

### Storage

A persistent `activity_traces` table replaces the in-memory Zustand store as the system of record.

| Column | Type | Purpose |
|---|---|---|
| `id` | `uuid` | PK |
| `institution_id` | `uuid` | Tenant scoping |
| `category` | `text` | `system`, `navigation`, `action`, `field`, `persistence`, `sync`, `alert` |
| `title` | `text` | Event title |
| `detail` | `text` | Optional detail |
| `source` | `text` | Originating component/module |
| `section` | `text`| UI section context |
| `meta` | `jsonb` | Extra context |
| `created_at` | `timestamptz` | When captured |

Index on `(institution_id, created_at desc)` for tenant-scoped time-ordered queries.

### Trace Capture Rules

Traces are captured for:
- navigation and section changes,
- field edits,
- form saves and persistence,
- sync operations,
- alerts and confirmations,
- workflow starts and completions,
- import stage transitions.

Noisy internal rerenders and repeated no-op changes are excluded.

### Services

| Function | Purpose |
|---|---|
| `appendTrace(input)` | Insert new trace row |
| `getTraces(tenantId, limit?)` | Fetch recent traces |
| `exportTraceJson(tenantId)` | Export all retained traces as JSON |
| `logWorkspaceEvent(category, title, detail?, section?)` | Fire-and-forget trace capture |

## Local Search Index

### Index Contents

A searchable index of local workspace affordances — sections, import steps, functions, help, and features.

| Type | Examples |
|---|---|
| `section` | Home, Students, Attendance, Assessment, Fees, Reports |
| `import-step` | Create Batch, Map Fields, Keying Setup, Detect Duplicates, Validate, Preview, Transfer |
| `function` | Activity Log, Automation, Migration Center |
| `help` | Help, Support, Documentation |
| `feature` | Dashboard metrics, ERP workspaces |

### Search Service

| Function | Purpose |
|---|---|
| `buildLocalSearchIndex(extra?)` | Initialize or extend the search index |
| `searchLocalWorkspace(query, items?)` | Filter index by title/section/query match |

Ranking is simple and explainable: any match in `title`, `section`, or `query` field includes the item.

### Keyboard Discovery

Command-style search (`Ctrl+K` / `Cmd+K`) is already supported via existing `CommandPalette.tsx` component. This patch provides the backend index for that palette to query.

## API Routes

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/activity-traces?tenantId=...` | List recent traces |
| `POST` | `/api/activity-traces` | Append a trace event |
| `GET` | `/api/search/local?q=...` | Search local workspace index |

## Legacy Parity Notes

Preserved behaviors:
- Live trace badge updates (client-side Zustand store remains)
- Filter chips (existing `setFilter` in store)
- Search within traces (existing `setQuery` in store)
- Export trace log (via `GET /api/activity-traces`)
- Clear trace history (via `clear()` store action)
- Trace events for import, workflow, field changes (via `POST /api/activity-traces`)

Not introduced:
- No UMIS/GegoK12 route-to-module mapping
- No UI redesign

## Files Created

| File | Purpose |
|---|---|
| `supabase/migrations/20260524190013_activity_traces.sql` | activity_traces table |
| `src/core/trace/types.ts` | TraceCategory, TraceItem, AppendTraceInput |
| `src/core/trace/service.ts` | appendTrace, getTraces, exportTraceJson, logWorkspaceEvent |
| `src/core/trace/index.ts` | Barrel export |
| `src/core/search/types.ts` | SearchItemType, SearchItem |
| `src/core/search/service.ts` | buildLocalSearchIndex, searchLocalWorkspace |
| `src/core/search/index.ts` | Barrel export |
| `app/api/activity-traces/route.ts` | GET + POST traces |
| `app/api/search/local/route.ts` | GET local search |
| `docs/migration/15-activity-trace-local-search.md` | This document |

## Done Criteria

- [x] Activity traces are persisted and exportable
- [x] Navigation, field, persistence, sync, alert, and workflow events are captured
- [x] Local search indexes sections, import steps, functions, help, and features
- [x] No UMIS/GegoK12 route mapping introduced
- [x] No UI redesign introduced
