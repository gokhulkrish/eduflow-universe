-- Patch 05: Attendance model refinement
-- Adds attendance_status enum, lock/override columns, attendance_periods table

do $$ begin
  create type public.attendance_status as enum ('present', 'absent', 'late', 'half_day', 'od');
exception
  when duplicate_object then null;
end $$;

alter table public.attendance
  add column if not exists locked_until date,
  add column if not exists locked_by uuid,
  add column if not exists overridden_by uuid,
  add column if not exists overridden_at timestamptz;

create table if not exists public.attendance_periods (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null,
  period_no integer not null,
  status public.attendance_status not null default 'present',
  source_system text not null default 'new-system',
  legacy_batch_id uuid references public.import_batches(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_attendance_periods_student_date_period
  on public.attendance_periods (student_id, date, period_no);

alter table public.attendance_periods enable row level security;

create policy "attendance_periods_select" on public.attendance_periods
  for select to authenticated using (true);

create policy "attendance_periods_insert" on public.attendance_periods
  for insert to authenticated with check (true);

create policy "attendance_periods_update" on public.attendance_periods
  for update to authenticated using (true);

create policy "attendance_periods_delete" on public.attendance_periods
  for delete to authenticated using (true);

create trigger trg_attendance_periods_updated_at before update on public.attendance_periods
  for each row execute function public.update_updated_at_column();
