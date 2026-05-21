
-- Helper: any staff-ish role
create or replace function public.is_staff(_uid uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles where user_id=_uid
    and role in ('super_admin','admin','principal','hod','faculty','staff',
                 'finance','scholarship','certificate','librarian','hostel_warden','transport'));
$$;

create or replace function public.is_admin(_uid uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles where user_id=_uid
    and role in ('super_admin','admin','principal'));
$$;

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path=public as $$
begin new.updated_at = now(); return new; end $$;

-- ACADEMICS
create table public.academic_years(
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.academic_years enable row level security;
create policy "ay read auth" on public.academic_years for select to authenticated using (true);
create policy "ay admin manage" on public.academic_years for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.classes(
  id uuid primary key default gen_random_uuid(),
  grade text not null,
  section text not null default 'A',
  stream text,
  capacity int not null default 40,
  class_teacher uuid,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(grade, section, academic_year_id)
);
alter table public.classes enable row level security;
create policy "cls read auth" on public.classes for select to authenticated using (true);
create policy "cls admin manage" on public.classes for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create table public.subjects(
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  credits numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table public.subjects enable row level security;
create policy "sub read auth" on public.subjects for select to authenticated using (true);
create policy "sub admin manage" on public.subjects for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- STUDENTS
create table public.students(
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
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
  father_name text,
  father_occupation text,
  mother_name text,
  mother_occupation text,
  guardian_phone text,
  annual_income numeric,
  community text,
  first_graduate boolean default false,
  income_verified text default 'Pending',
  umis_id text,
  emis_id text,
  district text,
  block text,
  house text,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.students(admission_no);
create index on public.students(user_id);
alter table public.students enable row level security;
create policy "stu staff read" on public.students for select to authenticated
  using (public.is_staff(auth.uid()) or user_id = auth.uid());
create policy "stu admin write" on public.students for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger trg_stu_upd before update on public.students
  for each row execute function public.update_updated_at_column();

-- STAFF
create table public.staff(
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  employee_no text not null unique,
  first_name text not null,
  last_name text,
  email text,
  phone text,
  department text,
  designation text,
  date_of_joining date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.staff enable row level security;
create policy "stf staff read" on public.staff for select to authenticated
  using (public.is_staff(auth.uid()) or user_id = auth.uid());
create policy "stf admin write" on public.staff for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create trigger trg_stf_upd before update on public.staff
  for each row execute function public.update_updated_at_column();

-- ENROLLMENT
create table public.enrollments(
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  roll_no text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique(student_id, class_id)
);
alter table public.enrollments enable row level security;
create policy "enr read" on public.enrollments for select to authenticated using (
  public.is_staff(auth.uid()) or exists(select 1 from public.students s where s.id=student_id and s.user_id=auth.uid())
);
create policy "enr admin write" on public.enrollments for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ATTENDANCE
create table public.attendance(
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  date date not null,
  period text,
  status text not null default 'present',
  remarks text,
  marked_by uuid,
  created_at timestamptz not null default now(),
  unique(student_id, date, period)
);
alter table public.attendance enable row level security;
create policy "att read" on public.attendance for select to authenticated using (
  public.is_staff(auth.uid()) or exists(select 1 from public.students s where s.id=student_id and s.user_id=auth.uid())
);
create policy "att staff write" on public.attendance for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- FINANCE
create table public.fee_structures(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text,
  academic_year_id uuid references public.academic_years(id) on delete set null,
  amount numeric not null default 0,
  frequency text not null default 'annual',
  due_day int,
  created_at timestamptz not null default now()
);
alter table public.fee_structures enable row level security;
create policy "fs read auth" on public.fee_structures for select to authenticated using (true);
create policy "fs finance manage" on public.fee_structures for all to authenticated
  using (public.has_role(auth.uid(),'finance') or public.is_admin(auth.uid()))
  with check (public.has_role(auth.uid(),'finance') or public.is_admin(auth.uid()));

create table public.fee_invoices(
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  fee_structure_id uuid references public.fee_structures(id) on delete set null,
  invoice_no text not null unique,
  amount numeric not null,
  amount_paid numeric not null default 0,
  due_date date,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.fee_invoices enable row level security;
create policy "fi read" on public.fee_invoices for select to authenticated using (
  public.is_staff(auth.uid()) or exists(select 1 from public.students s where s.id=student_id and s.user_id=auth.uid())
);
create policy "fi finance write" on public.fee_invoices for all to authenticated
  using (public.has_role(auth.uid(),'finance') or public.is_admin(auth.uid()))
  with check (public.has_role(auth.uid(),'finance') or public.is_admin(auth.uid()));

create table public.fee_payments(
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.fee_invoices(id) on delete cascade,
  amount numeric not null,
  method text not null default 'cash',
  reference text,
  paid_at timestamptz not null default now(),
  received_by uuid
);
alter table public.fee_payments enable row level security;
create policy "fp read" on public.fee_payments for select to authenticated using (
  public.is_staff(auth.uid()) or exists(
    select 1 from public.fee_invoices i join public.students s on s.id=i.student_id
    where i.id=invoice_id and s.user_id=auth.uid())
);
create policy "fp finance write" on public.fee_payments for all to authenticated
  using (public.has_role(auth.uid(),'finance') or public.is_admin(auth.uid()))
  with check (public.has_role(auth.uid(),'finance') or public.is_admin(auth.uid()));

-- LIBRARY
create table public.library_books(
  id uuid primary key default gen_random_uuid(),
  isbn text,
  title text not null,
  author text,
  category text,
  total_copies int not null default 1,
  available_copies int not null default 1,
  shelf text,
  created_at timestamptz not null default now()
);
alter table public.library_books enable row level security;
create policy "lb read auth" on public.library_books for select to authenticated using (true);
create policy "lb librarian manage" on public.library_books for all to authenticated
  using (public.has_role(auth.uid(),'librarian') or public.is_admin(auth.uid()))
  with check (public.has_role(auth.uid(),'librarian') or public.is_admin(auth.uid()));

create table public.library_loans(
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.library_books(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete cascade,
  issued_at timestamptz not null default now(),
  due_date date not null,
  returned_at timestamptz,
  fine numeric not null default 0,
  status text not null default 'issued'
);
alter table public.library_loans enable row level security;
create policy "ll read" on public.library_loans for select to authenticated using (
  public.is_staff(auth.uid()) or exists(select 1 from public.students s where s.id=student_id and s.user_id=auth.uid())
);
create policy "ll librarian write" on public.library_loans for all to authenticated
  using (public.has_role(auth.uid(),'librarian') or public.is_admin(auth.uid()))
  with check (public.has_role(auth.uid(),'librarian') or public.is_admin(auth.uid()));

-- HOSTEL
create table public.hostel_rooms(
  id uuid primary key default gen_random_uuid(),
  block text not null,
  room_no text not null,
  capacity int not null default 2,
  occupied int not null default 0,
  room_type text default 'standard',
  created_at timestamptz not null default now(),
  unique(block, room_no)
);
alter table public.hostel_rooms enable row level security;
create policy "hr read auth" on public.hostel_rooms for select to authenticated using (true);
create policy "hr warden manage" on public.hostel_rooms for all to authenticated
  using (public.has_role(auth.uid(),'hostel_warden') or public.is_admin(auth.uid()))
  with check (public.has_role(auth.uid(),'hostel_warden') or public.is_admin(auth.uid()));

create table public.hostel_allocations(
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.hostel_rooms(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  allocated_on date not null default current_date,
  vacated_on date,
  status text not null default 'active'
);
alter table public.hostel_allocations enable row level security;
create policy "ha read" on public.hostel_allocations for select to authenticated using (
  public.is_staff(auth.uid()) or exists(select 1 from public.students s where s.id=student_id and s.user_id=auth.uid())
);
create policy "ha warden write" on public.hostel_allocations for all to authenticated
  using (public.has_role(auth.uid(),'hostel_warden') or public.is_admin(auth.uid()))
  with check (public.has_role(auth.uid(),'hostel_warden') or public.is_admin(auth.uid()));

-- TRANSPORT
create table public.transport_routes(
  id uuid primary key default gen_random_uuid(),
  route_no text not null unique,
  name text not null,
  driver_name text,
  driver_phone text,
  vehicle_no text,
  capacity int not null default 40,
  fare numeric not null default 0,
  created_at timestamptz not null default now()
);
alter table public.transport_routes enable row level security;
create policy "tr read auth" on public.transport_routes for select to authenticated using (true);
create policy "tr transport manage" on public.transport_routes for all to authenticated
  using (public.has_role(auth.uid(),'transport') or public.is_admin(auth.uid()))
  with check (public.has_role(auth.uid(),'transport') or public.is_admin(auth.uid()));

create table public.transport_allocations(
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.transport_routes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  stop_name text,
  allocated_on date not null default current_date,
  status text not null default 'active'
);
alter table public.transport_allocations enable row level security;
create policy "ta read" on public.transport_allocations for select to authenticated using (
  public.is_staff(auth.uid()) or exists(select 1 from public.students s where s.id=student_id and s.user_id=auth.uid())
);
create policy "ta transport write" on public.transport_allocations for all to authenticated
  using (public.has_role(auth.uid(),'transport') or public.is_admin(auth.uid()))
  with check (public.has_role(auth.uid(),'transport') or public.is_admin(auth.uid()));

-- CERTIFICATES
create table public.certificate_templates(
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.certificate_templates enable row level security;
create policy "ct read auth" on public.certificate_templates for select to authenticated using (true);
create policy "ct cert manage" on public.certificate_templates for all to authenticated
  using (public.has_role(auth.uid(),'certificate') or public.is_admin(auth.uid()))
  with check (public.has_role(auth.uid(),'certificate') or public.is_admin(auth.uid()));

create table public.certificate_requests(
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.certificate_templates(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete cascade,
  purpose text,
  status text not null default 'requested',
  approved_by uuid,
  approved_at timestamptz,
  issued_at timestamptz,
  revoked_at timestamptz,
  revoke_reason text,
  qr_token text not null default replace(gen_random_uuid()::text,'-',''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.certificate_requests(qr_token);
alter table public.certificate_requests enable row level security;
create policy "cr read" on public.certificate_requests for select to authenticated using (
  public.is_staff(auth.uid()) or exists(select 1 from public.students s where s.id=student_id and s.user_id=auth.uid())
);
create policy "cr cert write" on public.certificate_requests for all to authenticated
  using (public.has_role(auth.uid(),'certificate') or public.is_admin(auth.uid()))
  with check (public.has_role(auth.uid(),'certificate') or public.is_admin(auth.uid()));
create trigger trg_cr_upd before update on public.certificate_requests
  for each row execute function public.update_updated_at_column();
