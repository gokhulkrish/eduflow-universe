-- Wave 4: Success & Compliance.
-- Defines schemas for Scholarships, Certificates, Grievances, Health Records, and DMS Documents.

create or replace function public.can_manage_success_compliance(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role in ('super_admin', 'admin', 'principal', 'hod', 'scholarship', 'certificate', 'staff')
  );
$$;

revoke execute on function public.can_manage_success_compliance(uuid) from public, anon;

-- 1. Scholarships
create table if not exists public.scholarships (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  description text,
  provider text, -- 'government', 'institutional', 'private'
  amount numeric(12,2) check (amount >= 0),
  eligibility_criteria text,
  status public.person_status not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, name)
);

create table if not exists public.scholarship_applications (
  id uuid primary key default gen_random_uuid(),
  scholarship_id uuid not null references public.scholarships(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  applied_on date not null default current_date,
  status public.verification_status not null default 'pending',
  income_verified boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, scholarship_id, academic_year_id)
);

create table if not exists public.scholarship_verifications (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.scholarship_applications(id) on delete cascade,
  verified_by uuid references auth.users(id) on delete set null,
  verification_date timestamptz not null default now(),
  status public.verification_status not null default 'verified',
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Certificates
create table if not exists public.certificate_templates (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null, -- 'Bonafide', 'Transfer', 'Conduct', 'Achievement'
  template_html text not null,
  variables text[],
  status public.person_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, name)
);

create table if not exists public.certificate_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  template_id uuid not null references public.certificate_templates(id) on delete cascade,
  requested_on timestamptz not null default now(),
  purpose text,
  status public.verification_status not null default 'pending',
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.certificate_requests(id) on delete set null,
  student_id uuid not null references public.students(id) on delete cascade,
  template_id uuid not null references public.certificate_templates(id) on delete cascade,
  certificate_no text not null unique,
  issued_on timestamptz not null default now(),
  issued_by uuid references auth.users(id) on delete set null,
  verification_code text not null unique,
  content_snapshot text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Grievances
create table if not exists public.grievances (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  parent_profile_id uuid references public.profiles(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  title text not null,
  description text not null,
  category text not null, -- 'academic', 'facility', 'transport', 'fee', 'harassment', 'other'
  priority text not null default 'medium', -- 'low', 'medium', 'high'
  status text not null default 'pending', -- 'pending', 'investigating', 'resolved', 'closed'
  resolution text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Health Records
create table if not exists public.health_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete cascade,
  blood_group text,
  allergies text[],
  medical_history text,
  emergency_contact_name text,
  emergency_contact_phone text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. DMS Documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  title text not null,
  file_path text not null,
  file_type text,
  file_size integer,
  category text not null default 'general', -- 'admission_doc', 'scholarship_doc', 'certificate', etc.
  meta jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists scholarship_apps_student_idx on public.scholarship_applications(student_id);
create index if not exists certificate_requests_student_idx on public.certificate_requests(student_id);
create index if not exists certificates_student_no_idx on public.certificates(student_id, certificate_no);
create index if not exists grievances_lookup_idx on public.grievances(institution_id, status);
create index if not exists documents_lookup_idx on public.documents(student_id, category);

-- Enable RLS and create Policies
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'scholarships','scholarship_applications','scholarship_verifications',
    'certificate_templates','certificate_requests','certificates',
    'grievances','health_records','documents'
  ] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || ' select authenticated', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || ' manage success compliance', tbl);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      tbl || ' select authenticated',
      tbl
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.can_manage_success_compliance(auth.uid())) with check (public.can_manage_success_compliance(auth.uid()))',
      tbl || ' manage success compliance',
      tbl
    );
  end loop;
end $$;

-- Triggers for updated_at
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'scholarships','scholarship_applications','scholarship_verifications',
    'certificate_templates','certificate_requests','certificates',
    'grievances','health_records','documents'
  ] loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', tbl, tbl);
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      tbl,
      tbl
    );
  end loop;
end $$;

-- Seed system permissions
insert into public.permissions (module_key, action, label) values
  ('scholarships', 'view', 'View Scholarships & Applications'),
  ('scholarships', 'create', 'Add Scholarships Schemes'),
  ('scholarships', 'edit', 'Evaluate Scholarship applications'),
  ('scholarships', 'delete', 'Remove Scholarship Schemes'),
  ('certificates', 'view', 'View Issued Certificates'),
  ('certificates', 'create', 'Create Templates & Request Certificates'),
  ('certificates', 'edit', 'Approve & Sign Certificates'),
  ('certificates', 'delete', 'Revoke Certificates'),
  ('grievances', 'view', 'View Grievances Tickets'),
  ('grievances', 'create', 'Submit Grievance Tickets'),
  ('grievances', 'edit', 'Resolve Grievance Tickets'),
  ('grievances', 'delete', 'Delete Grievance Tickets'),
  ('health', 'view', 'View Student Health Cards'),
  ('health', 'edit', 'Modify Student Health Cards'),
  ('documents', 'view', 'View Stored DMS Documents'),
  ('documents', 'create', 'Upload DMS Documents'),
  ('documents', 'delete', 'Remove DMS Documents')
on conflict do nothing;
