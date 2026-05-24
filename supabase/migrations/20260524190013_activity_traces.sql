-- Patch 15: Activity Trace and Local Search Parity
-- Adds persistent trace logging for workspace events

create table if not exists public.activity_traces (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  category text not null,
  title text not null,
  detail text,
  source text,
  section text,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_traces_tenant_created
  on public.activity_traces (institution_id, created_at desc);

alter table public.activity_traces enable row level security;

create policy "activity_traces_select" on public.activity_traces
  for select to authenticated using (true);

create policy "activity_traces_insert" on public.activity_traces
  for insert to authenticated with check (true);
