-- Wave 2: People & Academics foundation.
-- The app reads student register rows through a single normalized view, while
-- writes continue through the canonical people/academics tables.

do $$
begin
  create type public.person_status as enum ('active', 'inactive', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.student_status as enum ('active', 'inactive', 'graduated', 'transferred', 'withdrawn', 'alumni');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.enrollment_status as enum ('active', 'completed', 'promoted', 'transferred', 'withdrawn');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.guardian_relationship as enum ('father', 'mother', 'guardian', 'grandparent', 'sibling', 'other');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.staff_status as enum ('active', 'on_leave', 'inactive', 'relieved');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.verification_status as enum ('pending', 'agreed', 'appealed', 'verified', 'rejected');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.can_manage_people_academics(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role in ('super_admin', 'admin', 'principal', 'hod', 'faculty', 'staff')
  );
$$;

create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  code text unique,
  email text,
  phone text,
  address text,
  status public.person_status not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campuses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  slug text not null,
  code text,
  address text,
  status public.person_status not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(institution_id, slug)
);

create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  label text not null,
  starts_on date,
  ends_on date,
  is_current boolean not null default false,
  status public.person_status not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(institution_id, label)
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  code text,
  status public.person_status not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(institution_id, name)
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  name text not null,
  code text,
  level text,
  stream text,
  duration_years numeric(4,1),
  status public.person_status not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(institution_id, name)
);

create table if not exists public.class_levels (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  label text not null,
  sort_order integer not null default 0,
  status public.person_status not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(institution_id, label)
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  campus_id uuid references public.campuses(id) on delete set null,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  class_level_id uuid references public.class_levels(id) on delete set null,
  program_id uuid references public.programs(id) on delete set null,
  label text not null,
  capacity integer,
  status public.person_status not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(institution_id, academic_year_id, class_level_id, label)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  program_id uuid references public.programs(id) on delete set null,
  name text not null,
  code text,
  status public.person_status not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(institution_id, name)
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete set null,
  campus_id uuid references public.campuses(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  admission_no text not null unique,
  first_name text not null,
  last_name text,
  dob date,
  gender text,
  blood_group text,
  nationality text default 'Indian',
  email text,
  phone text,
  alternate_phone text,
  address text,
  umis_id text unique,
  emis_id text unique,
  community text,
  first_graduate boolean not null default false,
  income_verification_status public.verification_status not null default 'pending',
  scholarship_notes text,
  fee_status text not null default 'Pending',
  attendance_percent numeric(5,2) not null default 0,
  status public.student_status not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_attendance_percent_range check (attendance_percent between 0 and 100)
);

create table if not exists public.guardians (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  relationship public.guardian_relationship not null default 'guardian',
  occupation text,
  phone text,
  email text,
  annual_income numeric(12,2),
  address text,
  is_primary boolean not null default false,
  status public.person_status not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_guardians (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  guardian_id uuid not null references public.guardians(id) on delete cascade,
  relationship public.guardian_relationship not null default 'guardian',
  is_primary boolean not null default false,
  can_pickup boolean not null default true,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, guardian_id)
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete set null,
  campus_id uuid references public.campuses(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  employee_no text unique,
  full_name text not null,
  designation text,
  department_id uuid references public.departments(id) on delete set null,
  email text,
  phone text,
  status public.staff_status not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faculty (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null unique references public.staff(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  faculty_code text unique,
  specialization text,
  qualification text,
  status public.staff_status not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete set null,
  campus_id uuid references public.campuses(id) on delete set null,
  student_id uuid not null references public.students(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  program_id uuid references public.programs(id) on delete set null,
  class_level_id uuid references public.class_levels(id) on delete set null,
  section_id uuid references public.sections(id) on delete set null,
  academic_year_label text,
  grade_label text,
  section_label text,
  stream text,
  house text,
  roll_number integer,
  joined_on date,
  left_on date,
  status public.enrollment_status not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campuses_institution_idx on public.campuses(institution_id);
create index if not exists academic_years_institution_current_idx on public.academic_years(institution_id, is_current) where is_current;
create index if not exists departments_institution_idx on public.departments(institution_id);
create index if not exists programs_department_idx on public.programs(department_id);
create index if not exists class_levels_institution_sort_idx on public.class_levels(institution_id, sort_order);
create index if not exists sections_lookup_idx on public.sections(institution_id, academic_year_id, class_level_id, label);
create index if not exists subjects_program_idx on public.subjects(program_id);
create index if not exists students_name_idx on public.students(first_name, last_name);
create index if not exists students_status_idx on public.students(status);
create index if not exists guardians_phone_idx on public.guardians(phone);
create index if not exists student_guardians_student_idx on public.student_guardians(student_id);
create index if not exists student_guardians_guardian_idx on public.student_guardians(guardian_id);
create index if not exists staff_department_idx on public.staff(department_id);
create index if not exists faculty_department_idx on public.faculty(department_id);
create index if not exists enrollments_student_idx on public.enrollments(student_id);
create index if not exists enrollments_section_idx on public.enrollments(section_id);
create unique index if not exists enrollments_active_year_student_idx
  on public.enrollments(student_id, academic_year_id)
  where status = 'active' and academic_year_id is not null;
create unique index if not exists enrollments_active_roll_idx
  on public.enrollments(institution_id, academic_year_id, coalesce(grade_label, ''), coalesce(section_label, ''), roll_number)
  where status = 'active' and roll_number is not null;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'institutions','campuses','academic_years','departments','programs',
    'class_levels','sections','subjects','students','guardians',
    'student_guardians','staff','faculty','enrollments'
  ] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || ' select authenticated', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || ' manage people academics', tbl);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      tbl || ' select authenticated',
      tbl
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.can_manage_people_academics(auth.uid())) with check (public.can_manage_people_academics(auth.uid()))',
      tbl || ' manage people academics',
      tbl
    );
  end loop;
end $$;

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'institutions','campuses','academic_years','departments','programs',
    'class_levels','sections','subjects','students','guardians',
    'student_guardians','staff','faculty','enrollments'
  ] loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', tbl, tbl);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      tbl,
      tbl
    );
  end loop;
end $$;

with institution_row as (
  insert into public.institutions(name, slug, code)
  values ('EduFlow Universe School', 'eduflow-universe', 'EDU')
  on conflict (slug) do update set name = excluded.name
  returning id
),
campus_row as (
  insert into public.campuses(institution_id, name, slug, code)
  select id, 'Main Campus', 'main', 'MAIN' from institution_row
  on conflict (institution_id, slug) do update set name = excluded.name
  returning id, institution_id
),
year_row as (
  insert into public.academic_years(institution_id, label, starts_on, ends_on, is_current)
  select institution_id, '2025-26', date '2025-04-01', date '2026-03-31', true from campus_row
  on conflict (institution_id, label) do update set is_current = true
  returning id, institution_id
),
department_row as (
  insert into public.departments(institution_id, name, code)
  select institution_id, 'General Academics', 'GEN' from year_row
  on conflict (institution_id, name) do update set code = excluded.code
  returning id, institution_id
),
program_row as (
  insert into public.programs(institution_id, department_id, name, code, level, stream)
  select institution_id, id, 'School Program', 'SCH', 'School', 'General' from department_row
  on conflict (institution_id, name) do update set code = excluded.code
  returning id, institution_id
),
level_seed(label, sort_order) as (
  values
    ('Pre-KG', 1), ('KG', 2), ('Grade 1', 3), ('Grade 2', 4), ('Grade 3', 5),
    ('Grade 4', 6), ('Grade 5', 7), ('Grade 6', 8), ('Grade 7', 9),
    ('Grade 8', 10), ('Grade 9', 11), ('Grade 10', 12), ('Grade 11', 13), ('Grade 12', 14)
),
level_row as (
  insert into public.class_levels(institution_id, program_id, label, sort_order)
  select p.institution_id, p.id, s.label, s.sort_order
  from program_row p
  cross join level_seed s
  on conflict (institution_id, label) do update set sort_order = excluded.sort_order
  returning id, institution_id, program_id, label
),
section_seed(label) as (
  values ('A'), ('B'), ('C'), ('D')
)
insert into public.sections(institution_id, campus_id, academic_year_id, class_level_id, program_id, label, capacity)
select l.institution_id, c.id, y.id, l.id, l.program_id, s.label, 40
from level_row l
join campus_row c on c.institution_id = l.institution_id
join year_row y on y.institution_id = l.institution_id
cross join section_seed s
on conflict (institution_id, academic_year_id, class_level_id, label) do update set capacity = excluded.capacity;

insert into public.permissions(module_key, action, label) values
  ('people','view','View People Directory'),
  ('people','create','Create People Records'),
  ('people','edit','Edit People Records'),
  ('people','delete','Delete People Records'),
  ('academics','view','View Academic Setup'),
  ('academics','create','Create Academic Setup'),
  ('academics','edit','Edit Academic Setup'),
  ('academics','delete','Delete Academic Setup'),
  ('admissions','view','View Admissions'),
  ('admissions','create','Create Admissions'),
  ('admissions','edit','Edit Admissions'),
  ('admissions','approve','Approve Admissions')
on conflict do nothing;

create or replace view public.student_register
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
  order by case when e1.status = 'active' then 0 else 1 end, e1.updated_at desc
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
revoke execute on function public.can_manage_people_academics(uuid) from public, anon;
