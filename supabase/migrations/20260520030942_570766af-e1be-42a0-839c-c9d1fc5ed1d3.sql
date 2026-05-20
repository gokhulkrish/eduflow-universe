
-- Roles enum
create type public.app_role as enum (
  'super_admin','admin','principal','hod','faculty','staff',
  'finance','scholarship','certificate','librarian','hostel_warden',
  'transport','student','parent'
);

create type public.access_level as enum (
  'none','view','create','edit','approve','delete','export','manage'
);

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  mfa_enrolled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

-- has_role security definer
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role);
$$;

-- Permissions registry
create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  action text not null,
  label text not null,
  unique(module_key, action)
);
alter table public.permissions enable row level security;

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role public.app_role not null,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  level public.access_level not null default 'none',
  updated_at timestamptz not null default now(),
  unique(role, permission_id)
);
alter table public.role_permissions enable row level security;

-- Audit log
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;

-- Profile auto-create trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles(id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  -- default role: student (super admin can elevate)
  insert into public.user_roles(user_id, role) values (new.id, 'student') on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS policies
create policy "profiles self read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "profiles self update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "user_roles self read" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "user_roles super admin manage" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'super_admin'))
  with check (public.has_role(auth.uid(),'super_admin'));

create policy "permissions read all" on public.permissions for select to authenticated using (true);
create policy "permissions super admin manage" on public.permissions for all to authenticated
  using (public.has_role(auth.uid(),'super_admin'))
  with check (public.has_role(auth.uid(),'super_admin'));

create policy "role_perms read all" on public.role_permissions for select to authenticated using (true);
create policy "role_perms super admin manage" on public.role_permissions for all to authenticated
  using (public.has_role(auth.uid(),'super_admin'))
  with check (public.has_role(auth.uid(),'super_admin'));

create policy "audit self read" on public.audit_log for select to authenticated
  using (actor = auth.uid() or public.has_role(auth.uid(),'super_admin'));
create policy "audit insert any auth" on public.audit_log for insert to authenticated
  with check (actor = auth.uid());

-- Seed permissions for canonical modules
insert into public.permissions(module_key, action, label) values
  ('students','view','View Students'),('students','create','Add Students'),('students','edit','Edit Students'),('students','delete','Delete Students'),('students','export','Export Students'),
  ('attendance','view','View Attendance'),('attendance','edit','Mark Attendance'),
  ('exams','view','View Exams'),('exams','edit','Manage Exams'),('exams','approve','Approve Results'),
  ('fees','view','View Fees'),('fees','edit','Manage Fees'),('fees','approve','Approve Refunds'),
  ('scholarships','view','View Scholarships'),('scholarships','approve','Sanction Scholarships'),
  ('certificates','view','View Certificates'),('certificates','create','Request Certificate'),('certificates','approve','Issue Certificate'),('certificates','delete','Revoke Certificate'),
  ('library','view','Library Access'),('hostel','view','Hostel Access'),('transport','view','Transport Access'),
  ('hr','view','HR Access'),('hr','edit','Manage HR'),
  ('reports','view','View Reports'),('reports','export','Export Reports'),
  ('settings','manage','Manage Settings'),('roles','manage','Manage Roles & Permissions'),
  ('automation','manage','Manage Automation'),('migration','manage','Migration Center'),
  ('observation','view','View Observations'),('observation','edit','Capture Observations')
on conflict do nothing;
