create table if not exists public.curriculum_outcomes (
  id uuid primary key default gen_random_uuid(),
  curriculum_name text not null,
  course_code text default '',
  semester text default '',
  outcome_map_status text default 'Draft',
  syllabus_coverage integer default 0,
  attainment_band text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.accreditation_records (
  id uuid primary key default gen_random_uuid(),
  quality_cycle text not null,
  framework text default '',
  criterion text default '',
  evidence_status text default 'Pending',
  owner text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.class_wall_posts (
  id uuid primary key default gen_random_uuid(),
  class text not null default '',
  author text not null default '',
  content text not null default '',
  attachment text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.course_mappings (
  id uuid primary key default gen_random_uuid(),
  course text not null,
  grade text not null default '',
  section text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.sanctioned_seats (
  id uuid primary key default gen_random_uuid(),
  course text not null,
  grade text default '',
  total integer default 0,
  filled integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.discipline_incidents (
  id uuid primary key default gen_random_uuid(),
  student text not null,
  type text not null default '',
  description text default '',
  date timestamptz not null default now(),
  severity text not null default 'minor',
  action text default '',
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter publication supabase_realtime add table public.curriculum_outcomes;
alter publication supabase_realtime add table public.accreditation_records;
alter publication supabase_realtime add table public.class_wall_posts;
alter publication supabase_realtime add table public.course_mappings;
alter publication supabase_realtime add table public.sanctioned_seats;
alter publication supabase_realtime add table public.discipline_incidents;
