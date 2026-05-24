
-- Admissions staging table for import engine bulk imports
create table if not exists public.admissions (
  id uuid primary key default gen_random_uuid(),
  application_no text not null,
  full_name text not null,
  date_of_birth date,
  gender text,
  email text,
  phone text,
  academic_year text not null,
  applying_for text,
  status text not null default 'pending',
  applied_date timestamptz not null default now(),
  address text,
  father_name text,
  mother_name text,
  guardian_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists admissions_application_no_idx on public.admissions (application_no);

alter table public.admissions enable row level security;

create policy "admissions_select" on public.admissions for select using (true);
create policy "admissions_insert" on public.admissions for insert with check (true);
create policy "admissions_update" on public.admissions for update using (true) with check (true);
create policy "admissions_delete" on public.admissions for delete using (true);

drop trigger if exists admissions_set_updated_at on public.admissions;
create trigger admissions_set_updated_at
  before update on public.admissions
  for each row execute function public.set_updated_at();
