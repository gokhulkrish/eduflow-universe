-- Wave 3: Operations & Finance.
-- Defines schemas for Fees, Hostel, Transport, Library, and Tasks modules.

create or replace function public.can_manage_operations_finance(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role in ('super_admin', 'admin', 'principal', 'finance', 'hostel_warden', 'transport', 'librarian', 'staff')
  );
$$;

revoke execute on function public.can_manage_operations_finance(uuid) from public, anon;

-- 1. Fees
create table if not exists public.fee_categories (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  description text,
  status public.person_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, name)
);

create table if not exists public.fee_structures (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  fee_category_id uuid not null references public.fee_categories(id) on delete cascade,
  class_level_id uuid not null references public.class_levels(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  due_date date,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, fee_category_id, class_level_id, academic_year_id)
);

create table if not exists public.fee_payments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete set null,
  student_id uuid not null references public.students(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  fee_category_id uuid references public.fee_categories(id) on delete set null,
  amount_paid numeric(12,2) not null check (amount_paid > 0),
  payment_date timestamptz not null default now(),
  payment_method text not null default 'cash', -- 'cash', 'bank_transfer', 'card', 'online'
  transaction_reference text,
  receipt_no text unique,
  status text not null default 'completed', -- 'completed', 'pending', 'failed', 'refunded'
  meta jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Hostel
create table if not exists public.hostels (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  campus_id uuid references public.campuses(id) on delete cascade,
  name text not null,
  type text not null default 'coed', -- 'boys', 'girls', 'coed'
  capacity integer check (capacity > 0),
  warden_id uuid references public.staff(id) on delete set null,
  address text,
  status public.person_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, name)
);

create table if not exists public.hostel_rooms (
  id uuid primary key default gen_random_uuid(),
  hostel_id uuid not null references public.hostels(id) on delete cascade,
  room_number text not null,
  floor text,
  capacity integer not null check (capacity > 0),
  cost_per_term numeric(12,2) check (cost_per_term >= 0),
  status public.person_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hostel_id, room_number)
);

create table if not exists public.hostel_allocations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  hostel_room_id uuid not null references public.hostel_rooms(id) on delete cascade,
  allocated_from date not null default current_date,
  allocated_to date,
  status public.person_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, hostel_room_id, allocated_from)
);

-- 3. Transport
create table if not exists public.transport_routes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  route_name text not null,
  route_code text unique,
  vehicle_no text,
  driver_id uuid references public.staff(id) on delete set null,
  cost_per_term numeric(12,2) check (cost_per_term >= 0),
  status public.person_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, route_name)
);

create table if not exists public.transport_allocations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  transport_route_id uuid not null references public.transport_routes(id) on delete cascade,
  pickup_stop text,
  allocated_from date not null default current_date,
  allocated_to date,
  status public.person_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, transport_route_id, allocated_from)
);

-- 4. Library
create table if not exists public.library_books (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  title text not null,
  isbn text,
  authors text,
  publisher text,
  quantity integer not null default 1 check (quantity >= 0),
  available_quantity integer not null default 1 check (available_quantity >= 0),
  location_shelf text,
  status public.person_status not null default 'active',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.library_issues (
  id uuid primary key default gen_random_uuid(),
  library_book_id uuid not null references public.library_books(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  issued_on date not null default current_date,
  due_on date not null,
  returned_on date,
  fine_amount numeric(12,2) not null default 0 check (fine_amount >= 0),
  status text not null default 'issued', -- 'issued', 'returned', 'lost', 'damaged'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (student_id is not null or staff_id is not null)
);

-- 5. Tasks Workflow
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references auth.users(id) on delete set null,
  due_date date,
  priority text not null default 'medium', -- 'low', 'medium', 'high'
  status text not null default 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  meta jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists fee_structures_lookup_idx on public.fee_structures(institution_id, fee_category_id, class_level_id);
create index if not exists fee_payments_student_idx on public.fee_payments(student_id);
create index if not exists hostel_rooms_hostel_idx on public.hostel_rooms(hostel_id);
create index if not exists hostel_allocations_student_idx on public.hostel_allocations(student_id);
create index if not exists transport_allocations_student_idx on public.transport_allocations(student_id);
create index if not exists library_books_title_idx on public.library_books(title);
create index if not exists library_issues_lookup_idx on public.library_issues(library_book_id, student_id, staff_id);
create index if not exists tasks_assigned_status_idx on public.tasks(assigned_to, status);

-- Enable RLS and create Policies
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'fee_categories','fee_structures','fee_payments',
    'hostels','hostel_rooms','hostel_allocations',
    'transport_routes','transport_allocations',
    'library_books','library_issues','tasks'
  ] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || ' select authenticated', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || ' manage operations finance', tbl);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      tbl || ' select authenticated',
      tbl
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.can_manage_operations_finance(auth.uid())) with check (public.can_manage_operations_finance(auth.uid()))',
      tbl || ' manage operations finance',
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
    'fee_categories','fee_structures','fee_payments',
    'hostels','hostel_rooms','hostel_allocations',
    'transport_routes','transport_allocations',
    'library_books','library_issues','tasks'
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
  ('fees', 'view', 'View Fees & Dues'),
  ('fees', 'create', 'Create Fee Categories & Structures'),
  ('fees', 'edit', 'Modify Fee Ledger'),
  ('fees', 'delete', 'Delete Fee Records'),
  ('hostel', 'view', 'View Hostel Rooms & Allocations'),
  ('hostel', 'create', 'Add Hostel & Rooms'),
  ('hostel', 'edit', 'Manage Hostel Assignments'),
  ('hostel', 'delete', 'Remove Hostel Records'),
  ('transport', 'view', 'View Transport Routes & Buses'),
  ('transport', 'create', 'Add Routes & Allocation'),
  ('transport', 'edit', 'Modify Transport Schedules'),
  ('transport', 'delete', 'Remove Transport Routes'),
  ('library', 'view', 'Browse Library Books'),
  ('library', 'create', 'Add Library Catalog'),
  ('library', 'edit', 'Issue and Return Books'),
  ('library', 'delete', 'Delete Library Catalog'),
  ('tasks', 'view', 'View Tasks Workflow'),
  ('tasks', 'create', 'Create Tasks Workflow'),
  ('tasks', 'edit', 'Modify Tasks Workflow'),
  ('tasks', 'delete', 'Remove Tasks Workflow')
on conflict do nothing;
