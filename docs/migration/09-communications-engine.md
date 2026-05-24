# Patch 09 – Communications Engine Migration (Corrected, Strict Upgrade-Only)

## Data Model

| Table | Purpose | Status |
|---|---|---|
| `message_templates` | Message templates per channel with variable placeholders | ✅ Added |
| `message_campaigns` | Campaigns with audience query and scheduling | ✅ Added |
| `message_queue` | Per-recipient queue with attempt tracking | ✅ Added |
| `message_logs` | Immutable delivery log with error capture | ✅ Added |

## Template Engine

| Function | Location | Description |
|---|---|---|
| `renderTemplate` | `src/core/communications/templateEngine.ts` | Replaces `{variable}` placeholders from context; missing vars render as empty string |

## Audience Expansion

| Function | Location | Description |
|---|---|---|
| `resolveAudience` | `src/core/communications/audience.ts` | Resolves `studentIds`/`classIds`/`sectionIds` from `student_contact_view` |

## Sender Service

| Function | Location | Description |
|---|---|---|
| `sendMessage` | `src/core/communications/sender.ts` | Renders template, writes to `message_logs` as 'sent' |
| `queueCampaign` | `src/core/communications/sender.ts` | Creates campaign, resolves audience, queues per-recipient messages |

## Queue Worker

| Function | Location | Description |
|---|---|---|
| `processQueuedMessages` | `src/core/communications/worker.ts` | Transactional: locks queue rows (`for update skip locked`), renders template, writes log as 'sent' or 'failed'. Handles batch up to `limit` (default 100). |

## Legacy Adapter

`src/legacy/compat/communicationsAdapter.ts`:
- `legacySendFeeReminder(payload)` → delegates to `sendMessage`
- `legacyQueueAttendanceAlert(payload)` → delegates to `queueCampaign`

## API Routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/communications/send` | Send a single message |
| `POST` | `/api/communications/campaigns` | Queue a new campaign |
| `GET` | `/api/communications/logs?tenantId=&channel=` | List logs (last 200) |

## Feature Toggle

- Runtime key: `useNewComms` (default `false`)
- Config surface: `useNewCommunicationsEngine` mapped via `src/config/featureToggles.ts`
- Default-off for phased rollout

## SQL Migration

`supabase/migrations/20260524190008_communications_engine.sql`:
- Creates `message_templates`, `message_campaigns`, `message_queue`, `message_logs`
- All tables have RLS policies and `updated_at` triggers where applicable
- `message_queue` has full status lifecycle: `queued` → `processing` → `sent`/`failed` → `acknowledged`

## Key Files

- `src/core/communications/templateEngine.ts` — Pure template renderer
- `src/core/communications/audience.ts` — Audience resolver
- `src/core/communications/sender.ts` — Send + campaign queue
- `src/core/communications/worker.ts` — Queue processor
- `src/legacy/compat/communicationsAdapter.ts` — Legacy adapter
- `app/api/communications/send/route.ts` — Single send API
- `app/api/communications/campaigns/route.ts` — Campaign API
- `app/api/communications/logs/route.ts` — Logs API
