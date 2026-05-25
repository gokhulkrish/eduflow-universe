-- Backfill the normalized student register shape for partially migrated databases.
-- This keeps the live register load working even when older enrollment tables
-- were created before the Wave 2 schema finished applying.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.enrollments add column if not exists institution_id uuid references public.institutions(id) on delete set null;
alter table public.enrollments add column if not exists campus_id uuid references public.campuses(id) on delete set null;
alter table public.enrollments add column if not exists academic_year_id uuid references public.academic_years(id) on delete set null;
alter table public.enrollments add column if not exists program_id uuid references public.programs(id) on delete set null;
alter table public.enrollments add column if not exists class_level_id uuid references public.class_levels(id) on delete set null;
alter table public.enrollments add column if not exists section_id uuid references public.sections(id) on delete set null;
alter table public.enrollments add column if not exists academic_year_label text;
alter table public.enrollments add column if not exists grade_label text;
alter table public.enrollments add column if not exists section_label text;
alter table public.enrollments add column if not exists stream text;
alter table public.enrollments add column if not exists house text;
alter table public.enrollments add column if not exists roll_number integer;
alter table public.enrollments add column if not exists joined_on date;
alter table public.enrollments add column if not exists left_on date;
alter table public.enrollments add column if not exists meta jsonb not null default '{}'::jsonb;
alter table public.enrollments add column if not exists updated_at timestamptz not null default now();

alter table public.enrollments enable row level security;

drop trigger if exists set_enrollments_updated_at on public.enrollments;
create trigger set_enrollments_updated_at
before update on public.enrollments
for each row execute function public.set_updated_at();

drop view if exists public.student_register;
create view public.student_register
with (security_invoker = true)
as
select
  s.id as student_id,
  s.admission_no,
  s.first_name,
  s.last_name,
  trim(concat_ws(' ', s.first_name, s.last_name)) as display_name,
  s.dob,
  s.gender,
  s.blood_group,
  s.nationality,
  s.email,
  s.phone,
  s.alternate_phone,
  s.address,
  s.umis_id,
  s.emis_id,
  s.community,
  s.first_graduate,
  s.income_verification_status,
  s.scholarship_notes,
  s.fee_status,
  s.attendance_percent,
  s.status,
  s.created_at,
  s.updated_at,
  e.id as enrollment_id,
  coalesce(e.academic_year_label, ay.label) as academic_year,
  coalesce(e.grade_label, cl.label) as grade,
  coalesce(e.section_label, sec.label) as section,
  e.roll_number,
  e.stream,
  e.house,
  e.status as enrollment_status,
  g.id as guardian_id,
  g.full_name as guardian_name,
  g.occupation as guardian_occupation,
  g.phone as guardian_phone,
  g.email as guardian_email,
  g.annual_income as guardian_annual_income
from public.students s
left join lateral (
  select *
  from public.enrollments e1
  where e1.student_id = s.id
  order by case when lower(coalesce(e1.status::text, '')) = 'active' then 0 else 1 end, e1.updated_at desc
  limit 1
) e on true
left join public.academic_years ay on ay.id = e.academic_year_id
left join public.class_levels cl on cl.id = e.class_level_id
left join public.sections sec on sec.id = e.section_id
left join lateral (
  select g1.*
  from public.student_guardians sg
  join public.guardians g1 on g1.id = sg.guardian_id
  where sg.student_id = s.id
  order by sg.is_primary desc, sg.updated_at desc
  limit 1
) g on true;

grant select on public.student_register to authenticated;
