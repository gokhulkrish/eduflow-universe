-- Patch 08: Fees & Finance Migration Shell (Ledgers, Risk, Receipts)

create table if not exists public.fee_plans (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  name text not null,
  code text not null,
  description text,
  academic_year_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists ux_fee_plans_inst_code
  on public.fee_plans (institution_id, code);

alter table public.fee_plans enable row level security;

create policy "fee_plans_select" on public.fee_plans for select to authenticated using (true);
create policy "fee_plans_insert" on public.fee_plans for insert to authenticated with check (true);
create policy "fee_plans_update" on public.fee_plans for update to authenticated using (true);

create trigger trg_fee_plans_updated_at before update on public.fee_plans
  for each row execute function public.update_updated_at_column();

create table if not exists public.fee_items (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  plan_id uuid not null references public.fee_plans(id) on delete cascade,
  name text not null,
  code text not null,
  amount numeric(12,2) not null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists ux_fee_items_inst_plan_code
  on public.fee_items (institution_id, plan_id, code);

alter table public.fee_items enable row level security;

create policy "fee_items_select" on public.fee_items for select to authenticated using (true);
create policy "fee_items_insert" on public.fee_items for insert to authenticated with check (true);
create policy "fee_items_update" on public.fee_items for update to authenticated using (true);

create trigger trg_fee_items_updated_at before update on public.fee_items
  for each row execute function public.update_updated_at_column();

create table if not exists public.fee_ledgers (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  student_id uuid not null references public.students(id) on delete cascade,
  plan_id uuid not null references public.fee_plans(id) on delete restrict,
  item_id uuid not null references public.fee_items(id) on delete restrict,
  due_amount numeric(12,2) not null,
  paid_amount numeric(12,2) not null default 0,
  concession_amount numeric(12,2) not null default 0,
  due_date date,
  last_payment_date date,
  status text not null default 'due' check (status in ('due','partial','paid','waived','cancelled')),
  risk_state text not null default 'normal' check (risk_state in ('normal','warning','critical')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_fee_ledgers_student
  on public.fee_ledgers (institution_id, student_id);

alter table public.fee_ledgers enable row level security;

create policy "fee_ledgers_select" on public.fee_ledgers for select to authenticated using (true);
create policy "fee_ledgers_insert" on public.fee_ledgers for insert to authenticated with check (true);
create policy "fee_ledgers_update" on public.fee_ledgers for update to authenticated using (true);

create trigger trg_fee_ledgers_updated_at before update on public.fee_ledgers
  for each row execute function public.update_updated_at_column();

create table if not exists public.fee_receipts (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  student_id uuid not null references public.students(id) on delete cascade,
  receipt_no text not null,
  receipt_date date not null,
  amount numeric(12,2) not null,
  payment_mode text,
  reference_no text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_fee_receipts_inst_receipt_no
  on public.fee_receipts (institution_id, receipt_no);

alter table public.fee_receipts enable row level security;

create policy "fee_receipts_select" on public.fee_receipts for select to authenticated using (true);
create policy "fee_receipts_insert" on public.fee_receipts for insert to authenticated with check (true);

create trigger trg_fee_receipts_updated_at before update on public.fee_receipts
  for each row execute function public.update_updated_at_column();

create table if not exists public.fee_receipt_lines (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  receipt_id uuid not null references public.fee_receipts(id) on delete cascade,
  ledger_id uuid not null references public.fee_ledgers(id) on delete restrict,
  amount numeric(12,2) not null
);

alter table public.fee_receipt_lines enable row level security;

create policy "fee_receipt_lines_select" on public.fee_receipt_lines for select to authenticated using (true);
create policy "fee_receipt_lines_insert" on public.fee_receipt_lines for insert to authenticated with check (true);
