-- Patch 08 (corrected): Fees extensions — missing columns, constraints, entity map

alter table public.fee_plans
  add column if not exists status text not null default 'active'
    check (status in ('active','inactive','archived'));

drop index if exists ux_fee_plans_inst_code;
create unique index if not exists ux_fee_plans_inst_code
  on public.fee_plans (institution_id, code) where deleted_at is null;

alter table public.fee_items
  add column if not exists sort_order integer not null default 0;

alter table public.fee_items
  add constraint ck_fee_items_amount check (amount >= 0);

drop index if exists ux_fee_items_inst_plan_code;
create unique index if not exists ux_fee_items_inst_plan_code
  on public.fee_items (institution_id, plan_id, code) where deleted_at is null;

alter table public.fee_ledgers
  add column if not exists adjustment_amount numeric(12,2) not null default 0;

alter table public.fee_ledgers
  add constraint ck_fee_ledgers_due check (due_amount >= 0),
  add constraint ck_fee_ledgers_paid check (paid_amount >= 0),
  add constraint ck_fee_ledgers_concession check (concession_amount >= 0);

alter table public.fee_ledgers
  add constraint ux_fee_ledgers_student_item unique (institution_id, student_id, item_id);

alter table public.fee_receipts
  add column if not exists source text not null default 'system'
    check (source in ('system','legacy-adapter','import'));

alter table public.fee_receipts
  add column if not exists idempotency_key text;

alter table public.fee_receipts
  add constraint ck_fee_receipts_amount check (amount >= 0);

create unique index if not exists ux_fee_receipts_idempotency
  on public.fee_receipts (institution_id, idempotency_key)
  where idempotency_key is not null;

alter table public.fee_receipt_lines
  add constraint ck_fee_receipt_lines_amount check (amount > 0);

create table if not exists public.legacy_fee_entity_map (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  legacy_entity_type text not null,
  legacy_entity_id text not null,
  new_entity_type text not null,
  new_entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (institution_id, legacy_entity_type, legacy_entity_id)
);

alter table public.legacy_fee_entity_map enable row level security;

create policy "legacy_fee_entity_map_select" on public.legacy_fee_entity_map
  for select to authenticated using (true);

create policy "legacy_fee_entity_map_insert" on public.legacy_fee_entity_map
  for insert to authenticated with check (true);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  key text not null,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, key)
);

alter table public.app_settings enable row level security;

create policy "app_settings_select" on public.app_settings
  for select to authenticated using (true);

create policy "app_settings_insert" on public.app_settings
  for insert to authenticated with check (true);

create policy "app_settings_update" on public.app_settings
  for update to authenticated using (true);

create trigger trg_app_settings_updated_at before update on public.app_settings
  for each row execute function public.update_updated_at_column();
