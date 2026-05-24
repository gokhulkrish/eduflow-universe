-- Patch 18: Decommission readiness, parity matrix, and cutover controls

create table if not exists public.migration_parity_matrix (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  feature_key text not null,
  legacy_module text,
  new_module text,
  status text not null default 'missing'
    check (status in ('missing', 'partial', 'matched', 'verified', 'retired')),
  evidence text,
  notes text,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, feature_key)
);

create index if not exists idx_migration_parity_matrix_tenant_status
  on public.migration_parity_matrix (tenant_id, status, feature_key);

alter table public.migration_parity_matrix enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'migration_parity_matrix'
      and policyname = 'migration_parity_matrix_select'
  ) then
    create policy "migration_parity_matrix_select" on public.migration_parity_matrix
      for select to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'migration_parity_matrix'
      and policyname = 'migration_parity_matrix_insert'
  ) then
    create policy "migration_parity_matrix_insert" on public.migration_parity_matrix
      for insert to authenticated with check (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'migration_parity_matrix'
      and policyname = 'migration_parity_matrix_update'
  ) then
    create policy "migration_parity_matrix_update" on public.migration_parity_matrix
      for update to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_migration_parity_matrix_updated_at'
      and tgrelid = 'public.migration_parity_matrix'::regclass
  ) then
    create trigger trg_migration_parity_matrix_updated_at
      before update on public.migration_parity_matrix
      for each row execute function public.update_updated_at_column();
  end if;
end $$;

create table if not exists public.migration_cutover_controls (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique,
  dual_run_enabled bool not null default true,
  new_system_primary bool not null default false,
  legacy_fallback_enabled bool not null default true,
  migration_frozen bool not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.migration_cutover_controls enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'migration_cutover_controls'
      and policyname = 'migration_cutover_controls_select'
  ) then
    create policy "migration_cutover_controls_select" on public.migration_cutover_controls
      for select to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'migration_cutover_controls'
      and policyname = 'migration_cutover_controls_insert'
  ) then
    create policy "migration_cutover_controls_insert" on public.migration_cutover_controls
      for insert to authenticated with check (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'migration_cutover_controls'
      and policyname = 'migration_cutover_controls_update'
  ) then
    create policy "migration_cutover_controls_update" on public.migration_cutover_controls
      for update to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_migration_cutover_controls_updated_at'
      and tgrelid = 'public.migration_cutover_controls'::regclass
  ) then
    create trigger trg_migration_cutover_controls_updated_at
      before update on public.migration_cutover_controls
      for each row execute function public.update_updated_at_column();
  end if;
end $$;

create table if not exists public.migration_audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  actor_id uuid,
  action text not null,
  feature_key text,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_migration_audit_log_tenant_created
  on public.migration_audit_log (tenant_id, created_at desc);

alter table public.migration_audit_log enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'migration_audit_log'
      and policyname = 'migration_audit_log_select'
  ) then
    create policy "migration_audit_log_select" on public.migration_audit_log
      for select to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'migration_audit_log'
      and policyname = 'migration_audit_log_insert'
  ) then
    create policy "migration_audit_log_insert" on public.migration_audit_log
      for insert to authenticated with check (true);
  end if;
end $$;
