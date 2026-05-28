-- Hard DB constraints for critical student IDs (regno, emis_id, phone)
-- Phase 1: add columns, backfill, triggers, partial unique indexes,
--          conditional CHECK constraints (NOT VALID for existing rows),
--          staging columns, and a validation function.

-- =====================================================
-- 1. regno — primary student identifier column
-- =====================================================

alter table public.students
  add column if not exists regno text;

update public.students
set regno = admission_no
where regno is null or regno = '';

alter table public.students
  alter column regno set not null,
  add constraint students_regno_unique unique (regno);

create or replace function public.sync_regno_from_admission()
returns trigger as $$
begin
  if NEW.admission_no is distinct from OLD.admission_no then
    NEW.regno = NEW.admission_no;
  end if;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_sync_regno_from_admission on public.students;
create trigger trg_sync_regno_from_admission
  before insert or update of admission_no
  on public.students
  for each row
  execute function public.sync_regno_from_admission();

-- =====================================================
-- 2. emis_id — partial unique index + conditional NOT NULL
-- =====================================================

create unique index if not exists idx_students_emis_id_unique
  on public.students (emis_id)
  where emis_id is not null and emis_id != '';

alter table public.students
  add constraint chk_students_emis_active
  check (
    (emis_id is not null and emis_id != '')
    or status not in ('active', 'graduated')
  ) not valid;

-- =====================================================
-- 3. phone — partial unique index + conditional NOT NULL + format check
-- =====================================================

create unique index if not exists idx_students_phone_unique
  on public.students (phone)
  where phone is not null and phone != '';

alter table public.students
  add constraint chk_students_phone_format
  check (
    phone is null
    or phone = ''
    or phone ~ '^\+?[0-9\s\-\(\)]{7,20}$'
  ) not valid;

alter table public.students
  add constraint chk_students_phone_active
  check (
    (phone is not null and phone != '')
    or status not in ('active', 'graduated')
  ) not valid;

-- =====================================================
-- 4. Staging columns for legacy data migration
-- =====================================================

alter table public.students
  add column if not exists regno_staging text,
  add column if not exists emis_staging text,
  add column if not exists phone_staging text;

alter table public.students
  add column if not exists migration_log jsonb default '[]'::jsonb;

-- =====================================================
-- 5. Validation function — returns all constraint violations
-- =====================================================

create or replace function public.check_student_constraints()
returns table (
  student_id uuid,
  admission_no text,
  regno text,
  status text,
  violations text[]
) language sql as $$
  select
    s.id,
    s.admission_no,
    s.regno,
    s.status,
    array_remove(array[
      case when s.regno is null or s.regno = '' then 'MISSING_REGNO' end,
      case when (s.emis_id is null or s.emis_id = '') and s.status in ('active', 'graduated') then 'MISSING_EMIS' end,
      case when (s.phone is null or s.phone = '') and s.status in ('active', 'graduated') then 'MISSING_PHONE' end,
      case when s.phone is not null and s.phone != '' and s.phone !~ '^\+?[0-9\s\-\(\)]{7,20}$' then 'INVALID_PHONE' end
    ], null) as violations
  from public.students s
  where
    s.regno is null or s.regno = ''
    or ((s.emis_id is null or s.emis_id = '') and s.status in ('active', 'graduated'))
    or ((s.phone is null or s.phone = '') and s.status in ('active', 'graduated'))
    or (s.phone is not null and s.phone != '' and s.phone !~ '^\+?[0-9\s\-\(\)]{7,20}$');
$$;

-- =====================================================
-- 6. Helper: annotate a row with a migration event
-- =====================================================

-- =====================================================
-- 7. Refresh student_register view to expose regno
-- =====================================================

drop view if exists public.student_register;
create view public.student_register
with (security_invoker = true)
as
select
  s.id as student_id,
  s.admission_no,
  s.regno,
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

-- =====================================================
-- 8. Helper: annotate a row with a migration event
-- =====================================================

create or replace function public.append_migration_log(
  p_student_id uuid,
  p_event text,
  p_detail jsonb default '{}'::jsonb
)
returns void
language plpgsql as $$
begin
  update public.students
  set migration_log = migration_log || jsonb_build_array(
    jsonb_build_object(
      'event', p_event,
      'detail', p_detail,
      'at', now()
    )
  )
  where id = p_student_id;
end;
$$;
