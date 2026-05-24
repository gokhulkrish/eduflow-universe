-- Patch 17: Institute Identity, Settings, and Header Mapping Parity

-- 1. Institute profile (single authoritative record per tenant)
create table if not exists public.institute_profile (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null unique,
  identity jsonb not null,
  header_config jsonb,
  settings jsonb,
  updated_by uuid,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.institute_profile enable row level security;

create policy "institute_profile_select" on public.institute_profile
  for select to authenticated using (true);

create policy "institute_profile_insert" on public.institute_profile
  for insert to authenticated with check (true);

create policy "institute_profile_update" on public.institute_profile
  for update to authenticated using (true);

-- 2. Per-tenant header definitions (visible, alias, mapping, grouping)
create table if not exists public.institute_headers (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  key text not null,
  label text not null,
  visible bool not null default true,
  mapped_to text,
  alias_of text,
  group_name text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, key)
);

create index if not exists idx_institute_headers_tenant
  on public.institute_headers (institution_id, sort_order);

alter table public.institute_headers enable row level security;

create policy "institute_headers_select" on public.institute_headers
  for select to authenticated using (true);

create policy "institute_headers_insert" on public.institute_headers
  for insert to authenticated with check (true);

create policy "institute_headers_update" on public.institute_headers
  for update to authenticated using (true);

create policy "institute_headers_delete" on public.institute_headers
  for delete to authenticated using (true);

-- 3. Settings change history
create table if not exists public.institute_settings_history (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  changed_by uuid,
  before_state jsonb,
  after_state jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_institute_settings_history_tenant
  on public.institute_settings_history (institution_id, created_at desc);

alter table public.institute_settings_history enable row level security;

create policy "institute_settings_history_select" on public.institute_settings_history
  for select to authenticated using (true);

create policy "institute_settings_history_insert" on public.institute_settings_history
  for insert to authenticated with check (true);
