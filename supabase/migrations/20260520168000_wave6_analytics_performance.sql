-- Wave 6: Analytics & Performance.
-- Defines schemas for Dashboard KPIs cache, fee collections aggregation view,
-- student analytics summaries, and performance database indexes.

-- 1. Dashboard KPIs Cache Table
create table if not exists public.dashboard_kpis (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  metric_key text not null,
  metric_value numeric(15,4),
  label text,
  calculated_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb,
  unique (institution_id, metric_key)
);

-- 2. Fee Collection Summary Analytical View
create or replace view public.fee_collection_summary
with (security_invoker = true)
as
select
  institution_id,
  academic_year_id,
  fee_category_id,
  payment_method,
  status,
  count(*) as payment_count,
  sum(amount_paid) as total_collected,
  avg(amount_paid) as average_payment,
  min(amount_paid) as min_payment,
  max(amount_paid) as max_payment
from public.fee_payments
group by institution_id, academic_year_id, fee_category_id, payment_method, status;

-- 3. Student Analytics Summary Analytical View
create or replace view public.student_analytics_summary
with (security_invoker = true)
as
select
  s.institution_id,
  s.id as student_id,
  s.first_name,
  s.last_name,
  trim(concat_ws(' ', s.first_name, s.last_name)) as display_name,
  s.gender,
  s.status as student_status,
  s.attendance_percent,
  s.fee_status,
  e.id as enrollment_id,
  e.academic_year_id,
  e.class_level_id,
  e.section_id,
  e.roll_number,
  e.status as enrollment_status,
  (
    select coalesce(sum(fp.amount_paid), 0)
    from public.fee_payments fp
    where fp.student_id = s.id
  ) as total_fees_paid
from public.students s
left join lateral (
  select *
  from public.enrollments e1
  where e1.student_id = s.id
  order by case when e1.status = 'active' then 0 else 1 end, e1.updated_at desc
  limit 1
) e on true;

-- 4. Advanced Performance Indexes for Joins and Reports
create index if not exists fee_payments_reporting_idx 
  on public.fee_payments (institution_id, academic_year_id, payment_date desc);

create index if not exists chat_messages_reporting_idx 
  on public.chat_messages (thread_id, sender_id, created_at desc);

create index if not exists notifications_read_user_idx 
  on public.notifications (user_id, is_read, created_at desc);

create index if not exists student_search_idx 
  on public.students (institution_id, status, last_name, first_name);

create index if not exists enrollment_active_lookup_idx 
  on public.enrollments (student_id, status) 
  where status = 'active';

-- Enable RLS for Dashboard KPIs Cache Table
alter table public.dashboard_kpis enable row level security;

-- Drop policy if exists
drop policy if exists "dashboard_kpis select policy" on public.dashboard_kpis;
drop policy if exists "dashboard_kpis manage policy" on public.dashboard_kpis;

-- Policies for Dashboard KPIs
create policy "dashboard_kpis select policy" on public.dashboard_kpis
  for select to authenticated
  using (true);

create policy "dashboard_kpis manage policy" on public.dashboard_kpis
  for all to authenticated
  using (public.can_manage_people_academics(auth.uid()))
  with check (public.can_manage_people_academics(auth.uid()));

-- Grants for views
grant select on public.fee_collection_summary to authenticated;
grant select on public.student_analytics_summary to authenticated;

-- Seed system permissions for analytics
insert into public.permissions (module_key, action, label) values
  ('reports', 'view', 'Access Analytics Dashboard'),
  ('reports', 'export', 'Export Analytical Summary Sheets')
on conflict do nothing;
