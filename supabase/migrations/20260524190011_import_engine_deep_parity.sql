-- Patch 13: Import Engine Deep Parity
-- Extends import_batches with full state machine, adds import_batch_rows and import_batch_recoveries

-- 1. Extend import_batches with columns for deep parity workflow
alter table public.import_batches
  add column if not exists institution_id uuid,
  add column if not exists import_type text not null default 'new',
  add column if not exists source_type text,
  add column if not exists file_name text,
  add column if not exists file_path text,
  add column if not exists separator text,
  add column if not exists duplicate_rows int not null default 0,
  add column if not exists recoverable bool not null default true;

-- 2. Drop old CHECK constraint and replace with full state machine
alter table public.import_batches
  drop constraint if exists import_batches_status_check;

-- Migrate existing rows with old status values
update public.import_batches
  set status = 'draft'
  where status not in (
    'draft', 'uploaded', 'keying', 'duplicates', 'validating',
    'preview', 'ready_to_transfer', 'transferring', 'completed', 'failed', 'expired'
  );

alter table public.import_batches
  add constraint import_batches_status_check
  check (status in (
    'draft',
    'uploaded',
    'keying',
    'duplicates',
    'validating',
    'preview',
    'ready_to_transfer',
    'transferring',
    'completed',
    'failed',
    'expired'
  ));

-- 3. Add composite index for tenant-scoped state queries
create index if not exists idx_import_batches_tenant_state
  on public.import_batches (institution_id, status, created_at desc);

-- 4. Create import_batch_rows for row-level deep parity tracking
create table if not exists public.import_batch_rows (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  row_number int not null,
  source_payload jsonb not null,
  normalized_payload jsonb,
  match_status text not null default 'pending'
    check (match_status in ('pending', 'matched', 'duplicate', 'invalid', 'ready')),
  decision text,
  error_messages jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_import_batch_rows_batch
  on public.import_batch_rows (batch_id, row_number);

alter table public.import_batch_rows enable row level security;

create policy "Users can view own batch rows"
  on public.import_batch_rows for select
  using (exists (
    select 1 from public.import_batches
    where id = batch_id and created_by = auth.uid()
  ));

create policy "Users can insert own batch rows"
  on public.import_batch_rows for insert
  with check (exists (
    select 1 from public.import_batches
    where id = batch_id and created_by = auth.uid()
  ));

create policy "Users can update own batch rows"
  on public.import_batch_rows for update
  using (exists (
    select 1 from public.import_batches
    where id = batch_id and created_by = auth.uid()
  ));

-- 5. Create import_batch_recoveries for saved batch recovery tracking
create table if not exists public.import_batch_recoveries (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  recovered_by uuid,
  recovered_at timestamptz not null default now(),
  reason text,
  meta jsonb
);

create index if not exists idx_import_batch_recoveries_batch
  on public.import_batch_recoveries (batch_id);

alter table public.import_batch_recoveries enable row level security;

create policy "Users can view own batch recoveries"
  on public.import_batch_recoveries for select
  using (exists (
    select 1 from public.import_batches
    where id = batch_id and created_by = auth.uid()
  ));

create policy "Users can insert own batch recoveries"
  on public.import_batch_recoveries for insert
  with check (exists (
    select 1 from public.import_batches
    where id = batch_id and created_by = auth.uid()
  ));

-- 6. Update expireStaleBatches conditions: add 'draft', 'uploaded', 'validating' to valid states
-- (already handled by new CHECK constraint above)
