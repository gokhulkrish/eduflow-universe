
-- Wave 10: HR & Payroll Core.
-- Adds leave management, payroll, appraisals, and recruitment tables.

-- Leave types (policy configuration)
create table if not exists public.leave_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  days_per_year numeric(5,1) not null default 0,
  carry_forward boolean not null default false,
  requires_approval boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.leave_types enable row level security;

-- Per-employee leave balance
create table if not exists public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete cascade,
  year int not null default extract(year from now()),
  total_days numeric(5,1) not null default 0,
  used_days numeric(5,1) not null default 0,
  carried_days numeric(5,1) not null default 0,
  unique (staff_id, leave_type_id, year)
);
alter table public.leave_balances enable row level security;

-- Leave requests
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  days numeric(5,1) not null,
  reason text,
  status text not null default 'pending', -- pending, approved, rejected, cancelled
  approved_by uuid references public.staff(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.leave_requests enable row level security;

-- Payroll runs (periods)
create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  period_start date not null,
  period_end date not null,
  payment_date date,
  status text not null default 'draft', -- draft, processing, completed, cancelled
  total_amount numeric(14,2) not null default 0,
  employee_count int not null default 0,
  processed_by uuid references auth.users(id) on delete set null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.payroll_runs enable row level security;

-- Payroll items (per employee)
create table if not exists public.payroll_items (
  id uuid primary key default gen_random_uuid(),
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  basic_pay numeric(12,2) not null default 0,
  allowances numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  net_pay numeric(12,2) not null default 0,
  bank_account text,
  remarks text,
  unique (payroll_run_id, staff_id)
);
alter table public.payroll_items enable row level security;

-- Appraisals / performance reviews
create table if not exists public.appraisals (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  reviewer_id uuid references public.staff(id) on delete set null,
  review_period text not null, -- e.g. '2025-Q1', '2024-2025'
  overall_rating numeric(3,2),
  comments text,
  status text not null default 'draft', -- draft, submitted, reviewed, completed
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.appraisals enable row level security;

-- KPI scores within appraisals
create table if not exists public.appraisal_kpis (
  id uuid primary key default gen_random_uuid(),
  appraisal_id uuid not null references public.appraisals(id) on delete cascade,
  kpi_name text not null,
  score numeric(3,2),
  weight numeric(3,2) not null default 1.0,
  remarks text
);
alter table public.appraisal_kpis enable row level security;

-- Job openings (recruitment)
create table if not exists public.job_openings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text,
  location text,
  type text not null default 'full-time', -- full-time, part-time, contract
  description text,
  requirements text,
  salary_range text,
  status text not null default 'open', -- open, closed, filled
  posted_at timestamptz not null default now(),
  closes_at date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.job_openings enable row level security;

-- Candidates (recruitment pipeline)
create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  job_opening_id uuid not null references public.job_openings(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  resume_url text,
  status text not null default 'applied', -- applied, screened, interviewed, offered, hired, rejected
  applied_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.candidates enable row level security;

-- RLS policies
create policy "hr read auth" on public.leave_types for select to authenticated using (true);
create policy "hr staff manage" on public.leave_types for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "hr staff update" on public.leave_types for update to authenticated using (public.is_staff(auth.uid()));
create policy "hr admin delete" on public.leave_types for delete to authenticated using (public.is_admin(auth.uid()));
create policy "hr read auth" on public.leave_balances for select to authenticated using (true);
create policy "hr staff manage" on public.leave_balances for all to authenticated with check (public.is_staff(auth.uid()));
create policy "hr read auth" on public.leave_requests for select to authenticated using (true);
create policy "hr staff manage" on public.leave_requests for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "hr staff update" on public.leave_requests for update to authenticated using (public.is_staff(auth.uid()));
create policy "hr read auth" on public.payroll_runs for select to authenticated using (true);
create policy "hr staff manage" on public.payroll_runs for all to authenticated with check (public.is_staff(auth.uid()));
create policy "hr read auth" on public.payroll_items for select to authenticated using (true);
create policy "hr staff manage" on public.payroll_items for all to authenticated with check (public.is_staff(auth.uid()));
create policy "hr read auth" on public.appraisals for select to authenticated using (true);
create policy "hr staff manage" on public.appraisals for all to authenticated with check (public.is_staff(auth.uid()));
create policy "hr read auth" on public.appraisal_kpis for select to authenticated using (true);
create policy "hr staff manage" on public.appraisal_kpis for all to authenticated with check (public.is_staff(auth.uid()));
create policy "hr read auth" on public.job_openings for select to authenticated using (true);
create policy "hr staff manage" on public.job_openings for all to authenticated with check (public.is_staff(auth.uid()));
create policy "hr read auth" on public.candidates for select to authenticated using (true);
create policy "hr staff manage" on public.candidates for all to authenticated with check (public.is_staff(auth.uid()));

-- Updated_at triggers
create trigger trg_leave_requests_updated_at before update on public.leave_requests
  for each row execute function public.update_updated_at_column();
create trigger trg_appraisals_updated_at before update on public.appraisals
  for each row execute function public.update_updated_at_column();
create trigger trg_candidates_updated_at before update on public.candidates
  for each row execute function public.update_updated_at_column();

-- Permissions
insert into public.permissions(module_key, action, label) values
  ('hr','view','View HR Dashboard'),
  ('hr','edit','Manage HR'),
  ('hr','payroll','Process Payroll'),
  ('hr','leave','Manage Leave'),
  ('hr','appraisal','Manage Appraisals'),
  ('hr','recruit','Manage Recruitment')
on conflict do nothing;

-- Default leave types
insert into public.leave_types(name, code, days_per_year, carry_forward) values
  ('Annual Leave', 'annual', 18, true),
  ('Sick Leave', 'sick', 12, false),
  ('Casual Leave', 'casual', 6, false),
  ('Maternity Leave', 'maternity', 90, false),
  ('Paternity Leave', 'paternity', 10, false),
  ('Personal Leave', 'personal', 5, false)
on conflict do nothing;
