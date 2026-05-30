create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  department_name text not null,
  department_code text not null,
  hod_name text default '',
  program_level text default '',
  sanctioned_intake integer default 0,
  naac_nba_status text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  class_id text default '',
  topic text default '',
  objectives text default '',
  materials text default '',
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  priority text not null default 'normal',
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text default '',
  phone text default '',
  email text default '',
  department text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date timestamptz not null,
  type text not null default 'public',
  created_at timestamptz not null default now()
);

create table if not exists public.leave_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  days integer not null default 0,
  paid boolean not null default true,
  carry_forward boolean not null default false,
  created_at timestamptz not null default now()
);

alter publication supabase_realtime add table public.departments;
alter publication supabase_realtime add table public.lesson_plans;
alter publication supabase_realtime add table public.notices;
alter publication supabase_realtime add table public.contacts;
alter publication supabase_realtime add table public.holidays;
alter publication supabase_realtime add table public.leave_types;
