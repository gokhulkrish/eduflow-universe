
-- Patch 026: User Management Core Tables
-- Adds user_management_users and user_management_roles tables
-- for the User Management module behind patch-025 gate.

-- User management roles (role contracts)
create table if not exists public.user_management_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  permissions text[] not null default '{}',
  is_system_role boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_management_roles enable row level security;

-- User management users (system access users)
create table if not exists public.user_management_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role_id uuid references public.user_management_roles(id) on delete set null,
  role_name text not null,
  department text not null default '',
  status text not null default 'pending' check (status in ('active', 'inactive', 'suspended', 'pending')),
  permissions text[] not null default '{}',
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_management_users enable row level security;

-- System permissions reference table
create table if not exists public.user_management_permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text not null default '',
  category text not null default 'general',
  created_at timestamptz not null default now()
);
alter table public.user_management_permissions enable row level security;

-- Seed system permissions
insert into public.user_management_permissions (key, label, description, category) values
  ('view_students', 'View Students', 'View student records and details', 'students'),
  ('edit_students', 'Edit Students', 'Create, update, and modify student records', 'students'),
  ('view_fees', 'View Fees', 'View fee structures and payments', 'fees'),
  ('edit_fees', 'Edit Fees', 'Create and manage fee structures', 'fees'),
  ('view_attendance', 'View Attendance', 'View attendance records', 'attendance'),
  ('edit_attendance', 'Edit Attendance', 'Mark and modify attendance', 'attendance'),
  ('manage_users', 'Manage Users', 'Create, update, and delete user accounts', 'admin'),
  ('manage_roles', 'Manage Roles', 'Create and modify roles and permissions', 'admin')
on conflict (key) do nothing;

-- Seed default roles
insert into public.user_management_roles (name, description, permissions, is_system_role) values
  ('Administrator', 'Full system access', '{view_students,edit_students,view_fees,edit_fees,view_attendance,edit_attendance,manage_users,manage_roles}', true),
  ('Principal', 'Institute head with oversight permissions', '{view_students,view_fees,view_attendance,manage_users}', true),
  ('Staff', 'Standard staff permissions', '{view_students,edit_attendance,view_attendance}', true)
on conflict do nothing;

-- Row level security policies
create policy "Authenticated users can read roles"
  on public.user_management_roles for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users with manage_roles can insert roles"
  on public.user_management_roles for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users with manage_roles can update roles"
  on public.user_management_roles for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users with manage_roles can delete roles"
  on public.user_management_roles for delete
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read users"
  on public.user_management_users for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users with manage_users can insert users"
  on public.user_management_users for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users with manage_users can update users"
  on public.user_management_users for update
  using (auth.role() = 'authenticated');

create policy "Authenticated users with manage_users can delete users"
  on public.user_management_users for delete
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read permissions"
  on public.user_management_permissions for select
  using (auth.role() = 'authenticated');
