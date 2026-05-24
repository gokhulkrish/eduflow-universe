create table if not exists public.dashboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  academic_year_id uuid,
  snapshot_key text not null,
  snapshot_value jsonb not null,
  updated_at timestamptz not null default now(),
  unique (tenant_id, academic_year_id, snapshot_key)
);

create table if not exists public.monitoring_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  event_type text not null,
  subject_type text,
  subject_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_monitoring_events_tenant_created
  on public.monitoring_events (tenant_id, created_at desc);

create table if not exists public.system_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  health_status text not null,
  issues jsonb,
  counters jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_system_health_snapshots_tenant_updated
  on public.system_health_snapshots (tenant_id, updated_at desc);

