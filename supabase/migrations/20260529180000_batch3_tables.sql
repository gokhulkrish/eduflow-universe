create table if not exists public.lms_courses (
  id uuid primary key default gen_random_uuid(),
  course_room text not null,
  content_unit text default '',
  faculty_owner text default '',
  engagement_percent integer default 0,
  completion_status text default 'Not Started',
  created_at timestamptz not null default now()
);
create table if not exists public.procurement_requests (
  id uuid primary key default gen_random_uuid(),
  request_title text not null,
  vendor_name text default '',
  asset_tag text default '',
  department_name text default '',
  procurement_status text default 'Requested',
  created_at timestamptz not null default now()
);
create table if not exists public.research_projects (
  id uuid primary key default gen_random_uuid(),
  research_title text not null,
  principal_investigator text default '',
  funding_agency text default '',
  grant_amount numeric default 0,
  research_stage text default 'Proposal',
  created_at timestamptz not null default now()
);
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  document_title text not null,
  document_type text default '',
  owner text default '',
  expiry_date text default '',
  document_status text default 'Draft',
  created_at timestamptz not null default now()
);
create table if not exists public.health_cases (
  id uuid primary key default gen_random_uuid(),
  case_title text not null,
  person_name text default '',
  case_type text default '',
  follow_up_date text default '',
  care_status text default 'Open',
  created_at timestamptz not null default now()
);
alter publication supabase_realtime add table public.lms_courses;
alter publication supabase_realtime add table public.procurement_requests;
alter publication supabase_realtime add table public.research_projects;
alter publication supabase_realtime add table public.documents;
alter publication supabase_realtime add table public.health_cases;
