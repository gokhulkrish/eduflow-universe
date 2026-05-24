-- Patch 16: Registered Students Ribbon and Advanced Table Parity
-- Adds workspace presets, action logs, and report snapshots

-- 1. Workspace view presets (layout, columns, sort, filter, report state)
create table if not exists public.registered_workspace_presets (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  user_id uuid,
  preset_name text not null,
  view_mode text not null default 'grid'
    check (view_mode in ('grid', 'card', 'split')),
  compact bool not null default false,
  wrap bool not null default false,
  freeze_first bool not null default false,
  freeze_actions bool not null default false,
  banded_rows bool not null default false,
  focus_mode bool not null default false,
  group_by jsonb,
  control_break jsonb,
  visible_columns jsonb,
  sort_state jsonb,
  filter_state jsonb,
  report_state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workspace_presets_tenant_user
  on public.registered_workspace_presets (institution_id, user_id);

alter table public.registered_workspace_presets enable row level security;

create policy "workspace_presets_select" on public.registered_workspace_presets
  for select to authenticated using (true);

create policy "workspace_presets_insert" on public.registered_workspace_presets
  for insert to authenticated with check (true);

create policy "workspace_presets_update" on public.registered_workspace_presets
  for update to authenticated using (true);

create policy "workspace_presets_delete" on public.registered_workspace_presets
  for delete to authenticated using (true);

-- 2. Governance actions log (ribbon command audit trail)
create table if not exists public.registered_workspace_actions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  user_id uuid,
  action text not null,
  row_ids jsonb,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_workspace_actions_tenant_created
  on public.registered_workspace_actions (institution_id, created_at desc);

alter table public.registered_workspace_actions enable row level security;

create policy "workspace_actions_select" on public.registered_workspace_actions
  for select to authenticated using (true);

create policy "workspace_actions_insert" on public.registered_workspace_actions
  for insert to authenticated with check (true);

-- 3. Report snapshots (saved report state for sharing/download)
create table if not exists public.registered_report_snapshots (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  user_id uuid,
  report_name text not null,
  report_state jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_report_snapshots_tenant
  on public.registered_report_snapshots (institution_id, created_at desc);

alter table public.registered_report_snapshots enable row level security;

create policy "report_snapshots_select" on public.registered_report_snapshots
  for select to authenticated using (true);

create policy "report_snapshots_insert" on public.registered_report_snapshots
  for insert to authenticated with check (true);

create policy "report_snapshots_delete" on public.registered_report_snapshots
  for delete to authenticated using (true);
