-- Patch 14: Attendance Deep Parity
-- Extends attendance_status enum, adds sessions/adjustments tables, summary views

-- 1. Extend attendance_status enum with canonical values
do $$ begin
  alter type public.attendance_status add value if not exists 'excused';
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter type public.attendance_status add value if not exists 'holiday';
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter type public.attendance_status add value if not exists 'leave';
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter type public.attendance_status add value if not exists 'unknown';
exception
  when duplicate_object then null;
end $$;

-- 2. Create attendance_sessions table (class/section/date grouping)
create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  academic_year_id uuid,
  class_id uuid,
  section_id uuid,
  attendance_date date not null,
  session_type text not null default 'daily',
  status text not null default 'open'
    check (status in ('open', 'closed', 'locked')),
  marked_by uuid,
  remarks text,
  meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, class_id, section_id, attendance_date, session_type)
);

create index if not exists idx_attendance_sessions_tenant_date
  on public.attendance_sessions (institution_id, attendance_date desc);

alter table public.attendance_sessions enable row level security;

create policy "attendance_sessions_select" on public.attendance_sessions
  for select to authenticated using (true);

create policy "attendance_sessions_insert" on public.attendance_sessions
  for insert to authenticated with check (true);

create policy "attendance_sessions_update" on public.attendance_sessions
  for update to authenticated using (true);

create policy "attendance_sessions_delete" on public.attendance_sessions
  for delete to authenticated using (true);

-- 3. Add session_id and correction tracking to attendance
alter table public.attendance
  add column if not exists session_id uuid references public.attendance_sessions(id) on delete set null,
  add column if not exists original_status text,
  add column if not exists corrected_by uuid,
  add column if not exists corrected_at timestamptz,
  add column if not exists correction_reason text;

-- 4. Add updated_at trigger for attendance if missing
do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_attendance_updated_at'
      and tgrelid = 'public.attendance'::regclass
  ) then
    create trigger trg_attendance_updated_at
      before update on public.attendance
      for each row execute function public.update_updated_at_column();
  end if;
end $$;

-- 5. Create attendance_adjustments for correction audit trail
create table if not exists public.attendance_adjustments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  record_id uuid not null references public.attendance(id) on delete cascade,
  changed_by uuid,
  changed_at timestamptz not null default now(),
  from_status text,
  to_status text,
  note text,
  meta jsonb
);

create index if not exists idx_attendance_adjustments_record
  on public.attendance_adjustments (record_id);

alter table public.attendance_adjustments enable row level security;

create policy "attendance_adjustments_select" on public.attendance_adjustments
  for select to authenticated using (true);

create policy "attendance_adjustments_insert" on public.attendance_adjustments
  for insert to authenticated with check (true);

-- 6. Create student attendance summary view
create or replace view public.attendance_student_summary as
select
  s.institution_id,
  a.student_id,
  count(*) filter (where a.status = 'present') as present_count,
  count(*) filter (where a.status = 'absent') as absent_count,
  count(*) filter (where a.status = 'late') as late_count,
  count(*) filter (where a.status = 'half_day') as half_day_count,
  count(*) filter (where a.status = 'excused') as excused_count,
  count(*) as total_marked,
  round(
    (count(*) filter (where a.status = 'present')::numeric / nullif(count(*), 0)) * 100,
    2
  ) as attendance_percentage
from public.attendance a
join public.students s on s.id = a.student_id
group by s.institution_id, a.student_id;

-- 7. Create class daily summary view
create or replace view public.attendance_class_daily_summary as
select
  s.institution_id,
  s.class_id,
  s.section_id,
  s.attendance_date,
  count(*) filter (where a.status = 'present') as present_count,
  count(*) filter (where a.status = 'absent') as absent_count,
  count(*) filter (where a.status = 'late') as late_count,
  count(*) filter (where a.status = 'half_day') as half_day_count,
  count(*) as total_marked
from public.attendance_sessions s
left join public.attendance a on a.session_id = s.id
group by s.institution_id, s.class_id, s.section_id, s.attendance_date;
