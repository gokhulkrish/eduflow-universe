create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.module_registry (
  id uuid default gen_random_uuid() primary key,
  module_key text not null unique,
  label text not null,
  kind text not null,
  status text,
  category text,
  domain_key text,
  domain_label text,
  description text,
  launch_type text,
  section_id text,
  tab_key text,
  step text,
  tab_id text,
  module_ref text,
  workspace_key text,
  route text,
  renderer text,
  source_line integer,
  submodules jsonb not null default '[]'::jsonb,
  fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_registry_module_key_idx on public.module_registry (module_key);
create index if not exists module_registry_kind_idx on public.module_registry (kind);
create index if not exists module_registry_label_idx on public.module_registry (label);
alter table public.module_registry enable row level security;
create policy "module_registry_select" on public.module_registry for select using (true);
create policy "module_registry_insert" on public.module_registry for insert with check (true);
create policy "module_registry_update" on public.module_registry for update using (true) with check (true);
create policy "module_registry_delete" on public.module_registry for delete using (true);

create table if not exists public.module_home (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_home_module_registry_id_idx on public.module_home (module_registry_id);
create index if not exists module_home_module_key_idx on public.module_home (module_key);
create index if not exists module_home_record_title_idx on public.module_home (record_title);
create index if not exists module_home_status_idx on public.module_home (module_status);
create index if not exists module_home_domain_idx on public.module_home (domain_key);
alter table public.module_home enable row level security;
create policy "module_home_select" on public.module_home for select using (true);
create policy "module_home_insert" on public.module_home for insert with check (true);
create policy "module_home_update" on public.module_home for update using (true) with check (true);
create policy "module_home_delete" on public.module_home for delete using (true);
drop trigger if exists module_home_set_updated_at on public.module_home;
create trigger module_home_set_updated_at before update on public.module_home for each row execute function public.set_updated_at();

create table if not exists public.module_dashboard_data_processing (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_dashboard_data_processing_module_registry_id_idx on public.module_dashboard_data_processing (module_registry_id);
create index if not exists module_dashboard_data_processing_module_key_idx on public.module_dashboard_data_processing (module_key);
create index if not exists module_dashboard_data_processing_record_title_idx on public.module_dashboard_data_processing (record_title);
create index if not exists module_dashboard_data_processing_status_idx on public.module_dashboard_data_processing (module_status);
create index if not exists module_dashboard_data_processing_domain_idx on public.module_dashboard_data_processing (domain_key);
alter table public.module_dashboard_data_processing enable row level security;
create policy "module_dashboard_data_processing_select" on public.module_dashboard_data_processing for select using (true);
create policy "module_dashboard_data_processing_insert" on public.module_dashboard_data_processing for insert with check (true);
create policy "module_dashboard_data_processing_update" on public.module_dashboard_data_processing for update using (true) with check (true);
create policy "module_dashboard_data_processing_delete" on public.module_dashboard_data_processing for delete using (true);
drop trigger if exists module_dashboard_data_processing_set_updated_at on public.module_dashboard_data_processing;
create trigger module_dashboard_data_processing_set_updated_at before update on public.module_dashboard_data_processing for each row execute function public.set_updated_at();

create table if not exists public.module_dashboard_analytical (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_dashboard_analytical_module_registry_id_idx on public.module_dashboard_analytical (module_registry_id);
create index if not exists module_dashboard_analytical_module_key_idx on public.module_dashboard_analytical (module_key);
create index if not exists module_dashboard_analytical_record_title_idx on public.module_dashboard_analytical (record_title);
create index if not exists module_dashboard_analytical_status_idx on public.module_dashboard_analytical (module_status);
create index if not exists module_dashboard_analytical_domain_idx on public.module_dashboard_analytical (domain_key);
alter table public.module_dashboard_analytical enable row level security;
create policy "module_dashboard_analytical_select" on public.module_dashboard_analytical for select using (true);
create policy "module_dashboard_analytical_insert" on public.module_dashboard_analytical for insert with check (true);
create policy "module_dashboard_analytical_update" on public.module_dashboard_analytical for update using (true) with check (true);
create policy "module_dashboard_analytical_delete" on public.module_dashboard_analytical for delete using (true);
drop trigger if exists module_dashboard_analytical_set_updated_at on public.module_dashboard_analytical;
create trigger module_dashboard_analytical_set_updated_at before update on public.module_dashboard_analytical for each row execute function public.set_updated_at();

create table if not exists public.module_dashboard_scholarship_status (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_dashboard_scholarship_status_module_registry_id_idx on public.module_dashboard_scholarship_status (module_registry_id);
create index if not exists module_dashboard_scholarship_status_module_key_idx on public.module_dashboard_scholarship_status (module_key);
create index if not exists module_dashboard_scholarship_status_record_title_idx on public.module_dashboard_scholarship_status (record_title);
create index if not exists module_dashboard_scholarship_status_status_idx on public.module_dashboard_scholarship_status (module_status);
create index if not exists module_dashboard_scholarship_status_domain_idx on public.module_dashboard_scholarship_status (domain_key);
alter table public.module_dashboard_scholarship_status enable row level security;
create policy "module_dashboard_scholarship_status_select" on public.module_dashboard_scholarship_status for select using (true);
create policy "module_dashboard_scholarship_status_insert" on public.module_dashboard_scholarship_status for insert with check (true);
create policy "module_dashboard_scholarship_status_update" on public.module_dashboard_scholarship_status for update using (true) with check (true);
create policy "module_dashboard_scholarship_status_delete" on public.module_dashboard_scholarship_status for delete using (true);
drop trigger if exists module_dashboard_scholarship_status_set_updated_at on public.module_dashboard_scholarship_status;
create trigger module_dashboard_scholarship_status_set_updated_at before update on public.module_dashboard_scholarship_status for each row execute function public.set_updated_at();

create table if not exists public.module_add_student (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_add_student_module_registry_id_idx on public.module_add_student (module_registry_id);
create index if not exists module_add_student_module_key_idx on public.module_add_student (module_key);
create index if not exists module_add_student_record_title_idx on public.module_add_student (record_title);
create index if not exists module_add_student_status_idx on public.module_add_student (module_status);
create index if not exists module_add_student_domain_idx on public.module_add_student (domain_key);
alter table public.module_add_student enable row level security;
create policy "module_add_student_select" on public.module_add_student for select using (true);
create policy "module_add_student_insert" on public.module_add_student for insert with check (true);
create policy "module_add_student_update" on public.module_add_student for update using (true) with check (true);
create policy "module_add_student_delete" on public.module_add_student for delete using (true);
drop trigger if exists module_add_student_set_updated_at on public.module_add_student;
create trigger module_add_student_set_updated_at before update on public.module_add_student for each row execute function public.set_updated_at();

create table if not exists public.module_registered_students (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_registered_students_module_registry_id_idx on public.module_registered_students (module_registry_id);
create index if not exists module_registered_students_module_key_idx on public.module_registered_students (module_key);
create index if not exists module_registered_students_record_title_idx on public.module_registered_students (record_title);
create index if not exists module_registered_students_status_idx on public.module_registered_students (module_status);
create index if not exists module_registered_students_domain_idx on public.module_registered_students (domain_key);
alter table public.module_registered_students enable row level security;
create policy "module_registered_students_select" on public.module_registered_students for select using (true);
create policy "module_registered_students_insert" on public.module_registered_students for insert with check (true);
create policy "module_registered_students_update" on public.module_registered_students for update using (true) with check (true);
create policy "module_registered_students_delete" on public.module_registered_students for delete using (true);
drop trigger if exists module_registered_students_set_updated_at on public.module_registered_students;
create trigger module_registered_students_set_updated_at before update on public.module_registered_students for each row execute function public.set_updated_at();

create table if not exists public.module_partial_saved_students (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_partial_saved_students_module_registry_id_idx on public.module_partial_saved_students (module_registry_id);
create index if not exists module_partial_saved_students_module_key_idx on public.module_partial_saved_students (module_key);
create index if not exists module_partial_saved_students_record_title_idx on public.module_partial_saved_students (record_title);
create index if not exists module_partial_saved_students_status_idx on public.module_partial_saved_students (module_status);
create index if not exists module_partial_saved_students_domain_idx on public.module_partial_saved_students (domain_key);
alter table public.module_partial_saved_students enable row level security;
create policy "module_partial_saved_students_select" on public.module_partial_saved_students for select using (true);
create policy "module_partial_saved_students_insert" on public.module_partial_saved_students for insert with check (true);
create policy "module_partial_saved_students_update" on public.module_partial_saved_students for update using (true) with check (true);
create policy "module_partial_saved_students_delete" on public.module_partial_saved_students for delete using (true);
drop trigger if exists module_partial_saved_students_set_updated_at on public.module_partial_saved_students;
create trigger module_partial_saved_students_set_updated_at before update on public.module_partial_saved_students for each row execute function public.set_updated_at();

create table if not exists public.module_admissions (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_admissions_module_registry_id_idx on public.module_admissions (module_registry_id);
create index if not exists module_admissions_module_key_idx on public.module_admissions (module_key);
create index if not exists module_admissions_record_title_idx on public.module_admissions (record_title);
create index if not exists module_admissions_status_idx on public.module_admissions (module_status);
create index if not exists module_admissions_domain_idx on public.module_admissions (domain_key);
alter table public.module_admissions enable row level security;
create policy "module_admissions_select" on public.module_admissions for select using (true);
create policy "module_admissions_insert" on public.module_admissions for insert with check (true);
create policy "module_admissions_update" on public.module_admissions for update using (true) with check (true);
create policy "module_admissions_delete" on public.module_admissions for delete using (true);
drop trigger if exists module_admissions_set_updated_at on public.module_admissions;
create trigger module_admissions_set_updated_at before update on public.module_admissions for each row execute function public.set_updated_at();

create table if not exists public.module_certificates (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_certificates_module_registry_id_idx on public.module_certificates (module_registry_id);
create index if not exists module_certificates_module_key_idx on public.module_certificates (module_key);
create index if not exists module_certificates_record_title_idx on public.module_certificates (record_title);
create index if not exists module_certificates_status_idx on public.module_certificates (module_status);
create index if not exists module_certificates_domain_idx on public.module_certificates (domain_key);
alter table public.module_certificates enable row level security;
create policy "module_certificates_select" on public.module_certificates for select using (true);
create policy "module_certificates_insert" on public.module_certificates for insert with check (true);
create policy "module_certificates_update" on public.module_certificates for update using (true) with check (true);
create policy "module_certificates_delete" on public.module_certificates for delete using (true);
drop trigger if exists module_certificates_set_updated_at on public.module_certificates;
create trigger module_certificates_set_updated_at before update on public.module_certificates for each row execute function public.set_updated_at();

create table if not exists public.module_import_create (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_import_create_module_registry_id_idx on public.module_import_create (module_registry_id);
create index if not exists module_import_create_module_key_idx on public.module_import_create (module_key);
create index if not exists module_import_create_record_title_idx on public.module_import_create (record_title);
create index if not exists module_import_create_status_idx on public.module_import_create (module_status);
create index if not exists module_import_create_domain_idx on public.module_import_create (domain_key);
alter table public.module_import_create enable row level security;
create policy "module_import_create_select" on public.module_import_create for select using (true);
create policy "module_import_create_insert" on public.module_import_create for insert with check (true);
create policy "module_import_create_update" on public.module_import_create for update using (true) with check (true);
create policy "module_import_create_delete" on public.module_import_create for delete using (true);
drop trigger if exists module_import_create_set_updated_at on public.module_import_create;
create trigger module_import_create_set_updated_at before update on public.module_import_create for each row execute function public.set_updated_at();

create table if not exists public.module_import_map (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_import_map_module_registry_id_idx on public.module_import_map (module_registry_id);
create index if not exists module_import_map_module_key_idx on public.module_import_map (module_key);
create index if not exists module_import_map_record_title_idx on public.module_import_map (record_title);
create index if not exists module_import_map_status_idx on public.module_import_map (module_status);
create index if not exists module_import_map_domain_idx on public.module_import_map (domain_key);
alter table public.module_import_map enable row level security;
create policy "module_import_map_select" on public.module_import_map for select using (true);
create policy "module_import_map_insert" on public.module_import_map for insert with check (true);
create policy "module_import_map_update" on public.module_import_map for update using (true) with check (true);
create policy "module_import_map_delete" on public.module_import_map for delete using (true);
drop trigger if exists module_import_map_set_updated_at on public.module_import_map;
create trigger module_import_map_set_updated_at before update on public.module_import_map for each row execute function public.set_updated_at();

create table if not exists public.module_import_keying (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_import_keying_module_registry_id_idx on public.module_import_keying (module_registry_id);
create index if not exists module_import_keying_module_key_idx on public.module_import_keying (module_key);
create index if not exists module_import_keying_record_title_idx on public.module_import_keying (record_title);
create index if not exists module_import_keying_status_idx on public.module_import_keying (module_status);
create index if not exists module_import_keying_domain_idx on public.module_import_keying (domain_key);
alter table public.module_import_keying enable row level security;
create policy "module_import_keying_select" on public.module_import_keying for select using (true);
create policy "module_import_keying_insert" on public.module_import_keying for insert with check (true);
create policy "module_import_keying_update" on public.module_import_keying for update using (true) with check (true);
create policy "module_import_keying_delete" on public.module_import_keying for delete using (true);
drop trigger if exists module_import_keying_set_updated_at on public.module_import_keying;
create trigger module_import_keying_set_updated_at before update on public.module_import_keying for each row execute function public.set_updated_at();

create table if not exists public.module_import_duplicate_review (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_import_duplicate_review_module_registry_id_idx on public.module_import_duplicate_review (module_registry_id);
create index if not exists module_import_duplicate_review_module_key_idx on public.module_import_duplicate_review (module_key);
create index if not exists module_import_duplicate_review_record_title_idx on public.module_import_duplicate_review (record_title);
create index if not exists module_import_duplicate_review_status_idx on public.module_import_duplicate_review (module_status);
create index if not exists module_import_duplicate_review_domain_idx on public.module_import_duplicate_review (domain_key);
alter table public.module_import_duplicate_review enable row level security;
create policy "module_import_duplicate_review_select" on public.module_import_duplicate_review for select using (true);
create policy "module_import_duplicate_review_insert" on public.module_import_duplicate_review for insert with check (true);
create policy "module_import_duplicate_review_update" on public.module_import_duplicate_review for update using (true) with check (true);
create policy "module_import_duplicate_review_delete" on public.module_import_duplicate_review for delete using (true);
drop trigger if exists module_import_duplicate_review_set_updated_at on public.module_import_duplicate_review;
create trigger module_import_duplicate_review_set_updated_at before update on public.module_import_duplicate_review for each row execute function public.set_updated_at();

create table if not exists public.module_import_validation (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_import_validation_module_registry_id_idx on public.module_import_validation (module_registry_id);
create index if not exists module_import_validation_module_key_idx on public.module_import_validation (module_key);
create index if not exists module_import_validation_record_title_idx on public.module_import_validation (record_title);
create index if not exists module_import_validation_status_idx on public.module_import_validation (module_status);
create index if not exists module_import_validation_domain_idx on public.module_import_validation (domain_key);
alter table public.module_import_validation enable row level security;
create policy "module_import_validation_select" on public.module_import_validation for select using (true);
create policy "module_import_validation_insert" on public.module_import_validation for insert with check (true);
create policy "module_import_validation_update" on public.module_import_validation for update using (true) with check (true);
create policy "module_import_validation_delete" on public.module_import_validation for delete using (true);
drop trigger if exists module_import_validation_set_updated_at on public.module_import_validation;
create trigger module_import_validation_set_updated_at before update on public.module_import_validation for each row execute function public.set_updated_at();

create table if not exists public.module_import_preview (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_import_preview_module_registry_id_idx on public.module_import_preview (module_registry_id);
create index if not exists module_import_preview_module_key_idx on public.module_import_preview (module_key);
create index if not exists module_import_preview_record_title_idx on public.module_import_preview (record_title);
create index if not exists module_import_preview_status_idx on public.module_import_preview (module_status);
create index if not exists module_import_preview_domain_idx on public.module_import_preview (domain_key);
alter table public.module_import_preview enable row level security;
create policy "module_import_preview_select" on public.module_import_preview for select using (true);
create policy "module_import_preview_insert" on public.module_import_preview for insert with check (true);
create policy "module_import_preview_update" on public.module_import_preview for update using (true) with check (true);
create policy "module_import_preview_delete" on public.module_import_preview for delete using (true);
drop trigger if exists module_import_preview_set_updated_at on public.module_import_preview;
create trigger module_import_preview_set_updated_at before update on public.module_import_preview for each row execute function public.set_updated_at();

create table if not exists public.module_import_transfer (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_import_transfer_module_registry_id_idx on public.module_import_transfer (module_registry_id);
create index if not exists module_import_transfer_module_key_idx on public.module_import_transfer (module_key);
create index if not exists module_import_transfer_record_title_idx on public.module_import_transfer (record_title);
create index if not exists module_import_transfer_status_idx on public.module_import_transfer (module_status);
create index if not exists module_import_transfer_domain_idx on public.module_import_transfer (domain_key);
alter table public.module_import_transfer enable row level security;
create policy "module_import_transfer_select" on public.module_import_transfer for select using (true);
create policy "module_import_transfer_insert" on public.module_import_transfer for insert with check (true);
create policy "module_import_transfer_update" on public.module_import_transfer for update using (true) with check (true);
create policy "module_import_transfer_delete" on public.module_import_transfer for delete using (true);
drop trigger if exists module_import_transfer_set_updated_at on public.module_import_transfer;
create trigger module_import_transfer_set_updated_at before update on public.module_import_transfer for each row execute function public.set_updated_at();

create table if not exists public.module_collegeinfo (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_collegeinfo_module_registry_id_idx on public.module_collegeinfo (module_registry_id);
create index if not exists module_collegeinfo_module_key_idx on public.module_collegeinfo (module_key);
create index if not exists module_collegeinfo_record_title_idx on public.module_collegeinfo (record_title);
create index if not exists module_collegeinfo_status_idx on public.module_collegeinfo (module_status);
create index if not exists module_collegeinfo_domain_idx on public.module_collegeinfo (domain_key);
alter table public.module_collegeinfo enable row level security;
create policy "module_collegeinfo_select" on public.module_collegeinfo for select using (true);
create policy "module_collegeinfo_insert" on public.module_collegeinfo for insert with check (true);
create policy "module_collegeinfo_update" on public.module_collegeinfo for update using (true) with check (true);
create policy "module_collegeinfo_delete" on public.module_collegeinfo for delete using (true);
drop trigger if exists module_collegeinfo_set_updated_at on public.module_collegeinfo;
create trigger module_collegeinfo_set_updated_at before update on public.module_collegeinfo for each row execute function public.set_updated_at();

create table if not exists public.module_courseinfo (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_courseinfo_module_registry_id_idx on public.module_courseinfo (module_registry_id);
create index if not exists module_courseinfo_module_key_idx on public.module_courseinfo (module_key);
create index if not exists module_courseinfo_record_title_idx on public.module_courseinfo (record_title);
create index if not exists module_courseinfo_status_idx on public.module_courseinfo (module_status);
create index if not exists module_courseinfo_domain_idx on public.module_courseinfo (domain_key);
alter table public.module_courseinfo enable row level security;
create policy "module_courseinfo_select" on public.module_courseinfo for select using (true);
create policy "module_courseinfo_insert" on public.module_courseinfo for insert with check (true);
create policy "module_courseinfo_update" on public.module_courseinfo for update using (true) with check (true);
create policy "module_courseinfo_delete" on public.module_courseinfo for delete using (true);
drop trigger if exists module_courseinfo_set_updated_at on public.module_courseinfo;
create trigger module_courseinfo_set_updated_at before update on public.module_courseinfo for each row execute function public.set_updated_at();

create table if not exists public.module_usermanagement (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_usermanagement_module_registry_id_idx on public.module_usermanagement (module_registry_id);
create index if not exists module_usermanagement_module_key_idx on public.module_usermanagement (module_key);
create index if not exists module_usermanagement_record_title_idx on public.module_usermanagement (record_title);
create index if not exists module_usermanagement_status_idx on public.module_usermanagement (module_status);
create index if not exists module_usermanagement_domain_idx on public.module_usermanagement (domain_key);
alter table public.module_usermanagement enable row level security;
create policy "module_usermanagement_select" on public.module_usermanagement for select using (true);
create policy "module_usermanagement_insert" on public.module_usermanagement for insert with check (true);
create policy "module_usermanagement_update" on public.module_usermanagement for update using (true) with check (true);
create policy "module_usermanagement_delete" on public.module_usermanagement for delete using (true);
drop trigger if exists module_usermanagement_set_updated_at on public.module_usermanagement;
create trigger module_usermanagement_set_updated_at before update on public.module_usermanagement for each row execute function public.set_updated_at();

create table if not exists public.module_academics (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_academics_module_registry_id_idx on public.module_academics (module_registry_id);
create index if not exists module_academics_module_key_idx on public.module_academics (module_key);
create index if not exists module_academics_record_title_idx on public.module_academics (record_title);
create index if not exists module_academics_status_idx on public.module_academics (module_status);
create index if not exists module_academics_domain_idx on public.module_academics (domain_key);
alter table public.module_academics enable row level security;
create policy "module_academics_select" on public.module_academics for select using (true);
create policy "module_academics_insert" on public.module_academics for insert with check (true);
create policy "module_academics_update" on public.module_academics for update using (true) with check (true);
create policy "module_academics_delete" on public.module_academics for delete using (true);
drop trigger if exists module_academics_set_updated_at on public.module_academics;
create trigger module_academics_set_updated_at before update on public.module_academics for each row execute function public.set_updated_at();

create table if not exists public.module_timetable (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_timetable_module_registry_id_idx on public.module_timetable (module_registry_id);
create index if not exists module_timetable_module_key_idx on public.module_timetable (module_key);
create index if not exists module_timetable_record_title_idx on public.module_timetable (record_title);
create index if not exists module_timetable_status_idx on public.module_timetable (module_status);
create index if not exists module_timetable_domain_idx on public.module_timetable (domain_key);
alter table public.module_timetable enable row level security;
create policy "module_timetable_select" on public.module_timetable for select using (true);
create policy "module_timetable_insert" on public.module_timetable for insert with check (true);
create policy "module_timetable_update" on public.module_timetable for update using (true) with check (true);
create policy "module_timetable_delete" on public.module_timetable for delete using (true);
drop trigger if exists module_timetable_set_updated_at on public.module_timetable;
create trigger module_timetable_set_updated_at before update on public.module_timetable for each row execute function public.set_updated_at();

create table if not exists public.module_homework (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_homework_module_registry_id_idx on public.module_homework (module_registry_id);
create index if not exists module_homework_module_key_idx on public.module_homework (module_key);
create index if not exists module_homework_record_title_idx on public.module_homework (record_title);
create index if not exists module_homework_status_idx on public.module_homework (module_status);
create index if not exists module_homework_domain_idx on public.module_homework (domain_key);
alter table public.module_homework enable row level security;
create policy "module_homework_select" on public.module_homework for select using (true);
create policy "module_homework_insert" on public.module_homework for insert with check (true);
create policy "module_homework_update" on public.module_homework for update using (true) with check (true);
create policy "module_homework_delete" on public.module_homework for delete using (true);
drop trigger if exists module_homework_set_updated_at on public.module_homework;
create trigger module_homework_set_updated_at before update on public.module_homework for each row execute function public.set_updated_at();

create table if not exists public.module_assignments (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_assignments_module_registry_id_idx on public.module_assignments (module_registry_id);
create index if not exists module_assignments_module_key_idx on public.module_assignments (module_key);
create index if not exists module_assignments_record_title_idx on public.module_assignments (record_title);
create index if not exists module_assignments_status_idx on public.module_assignments (module_status);
create index if not exists module_assignments_domain_idx on public.module_assignments (domain_key);
alter table public.module_assignments enable row level security;
create policy "module_assignments_select" on public.module_assignments for select using (true);
create policy "module_assignments_insert" on public.module_assignments for insert with check (true);
create policy "module_assignments_update" on public.module_assignments for update using (true) with check (true);
create policy "module_assignments_delete" on public.module_assignments for delete using (true);
drop trigger if exists module_assignments_set_updated_at on public.module_assignments;
create trigger module_assignments_set_updated_at before update on public.module_assignments for each row execute function public.set_updated_at();

create table if not exists public.module_attendance (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_attendance_module_registry_id_idx on public.module_attendance (module_registry_id);
create index if not exists module_attendance_module_key_idx on public.module_attendance (module_key);
create index if not exists module_attendance_record_title_idx on public.module_attendance (record_title);
create index if not exists module_attendance_status_idx on public.module_attendance (module_status);
create index if not exists module_attendance_domain_idx on public.module_attendance (domain_key);
alter table public.module_attendance enable row level security;
create policy "module_attendance_select" on public.module_attendance for select using (true);
create policy "module_attendance_insert" on public.module_attendance for insert with check (true);
create policy "module_attendance_update" on public.module_attendance for update using (true) with check (true);
create policy "module_attendance_delete" on public.module_attendance for delete using (true);
drop trigger if exists module_attendance_set_updated_at on public.module_attendance;
create trigger module_attendance_set_updated_at before update on public.module_attendance for each row execute function public.set_updated_at();

create table if not exists public.module_exams (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_exams_module_registry_id_idx on public.module_exams (module_registry_id);
create index if not exists module_exams_module_key_idx on public.module_exams (module_key);
create index if not exists module_exams_record_title_idx on public.module_exams (record_title);
create index if not exists module_exams_status_idx on public.module_exams (module_status);
create index if not exists module_exams_domain_idx on public.module_exams (domain_key);
alter table public.module_exams enable row level security;
create policy "module_exams_select" on public.module_exams for select using (true);
create policy "module_exams_insert" on public.module_exams for insert with check (true);
create policy "module_exams_update" on public.module_exams for update using (true) with check (true);
create policy "module_exams_delete" on public.module_exams for delete using (true);
drop trigger if exists module_exams_set_updated_at on public.module_exams;
create trigger module_exams_set_updated_at before update on public.module_exams for each row execute function public.set_updated_at();

create table if not exists public.module_videorooms (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_videorooms_module_registry_id_idx on public.module_videorooms (module_registry_id);
create index if not exists module_videorooms_module_key_idx on public.module_videorooms (module_key);
create index if not exists module_videorooms_record_title_idx on public.module_videorooms (record_title);
create index if not exists module_videorooms_status_idx on public.module_videorooms (module_status);
create index if not exists module_videorooms_domain_idx on public.module_videorooms (domain_key);
alter table public.module_videorooms enable row level security;
create policy "module_videorooms_select" on public.module_videorooms for select using (true);
create policy "module_videorooms_insert" on public.module_videorooms for insert with check (true);
create policy "module_videorooms_update" on public.module_videorooms for update using (true) with check (true);
create policy "module_videorooms_delete" on public.module_videorooms for delete using (true);
drop trigger if exists module_videorooms_set_updated_at on public.module_videorooms;
create trigger module_videorooms_set_updated_at before update on public.module_videorooms for each row execute function public.set_updated_at();

create table if not exists public.module_quiz (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_quiz_module_registry_id_idx on public.module_quiz (module_registry_id);
create index if not exists module_quiz_module_key_idx on public.module_quiz (module_key);
create index if not exists module_quiz_record_title_idx on public.module_quiz (record_title);
create index if not exists module_quiz_status_idx on public.module_quiz (module_status);
create index if not exists module_quiz_domain_idx on public.module_quiz (domain_key);
alter table public.module_quiz enable row level security;
create policy "module_quiz_select" on public.module_quiz for select using (true);
create policy "module_quiz_insert" on public.module_quiz for insert with check (true);
create policy "module_quiz_update" on public.module_quiz for update using (true) with check (true);
create policy "module_quiz_delete" on public.module_quiz for delete using (true);
drop trigger if exists module_quiz_set_updated_at on public.module_quiz;
create trigger module_quiz_set_updated_at before update on public.module_quiz for each row execute function public.set_updated_at();

create table if not exists public.module_people (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_people_module_registry_id_idx on public.module_people (module_registry_id);
create index if not exists module_people_module_key_idx on public.module_people (module_key);
create index if not exists module_people_record_title_idx on public.module_people (record_title);
create index if not exists module_people_status_idx on public.module_people (module_status);
create index if not exists module_people_domain_idx on public.module_people (domain_key);
alter table public.module_people enable row level security;
create policy "module_people_select" on public.module_people for select using (true);
create policy "module_people_insert" on public.module_people for insert with check (true);
create policy "module_people_update" on public.module_people for update using (true) with check (true);
create policy "module_people_delete" on public.module_people for delete using (true);
drop trigger if exists module_people_set_updated_at on public.module_people;
create trigger module_people_set_updated_at before update on public.module_people for each row execute function public.set_updated_at();

create table if not exists public.module_administration (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_administration_module_registry_id_idx on public.module_administration (module_registry_id);
create index if not exists module_administration_module_key_idx on public.module_administration (module_key);
create index if not exists module_administration_record_title_idx on public.module_administration (record_title);
create index if not exists module_administration_status_idx on public.module_administration (module_status);
create index if not exists module_administration_domain_idx on public.module_administration (domain_key);
alter table public.module_administration enable row level security;
create policy "module_administration_select" on public.module_administration for select using (true);
create policy "module_administration_insert" on public.module_administration for insert with check (true);
create policy "module_administration_update" on public.module_administration for update using (true) with check (true);
create policy "module_administration_delete" on public.module_administration for delete using (true);
drop trigger if exists module_administration_set_updated_at on public.module_administration;
create trigger module_administration_set_updated_at before update on public.module_administration for each row execute function public.set_updated_at();

create table if not exists public.module_payroll (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_payroll_module_registry_id_idx on public.module_payroll (module_registry_id);
create index if not exists module_payroll_module_key_idx on public.module_payroll (module_key);
create index if not exists module_payroll_record_title_idx on public.module_payroll (record_title);
create index if not exists module_payroll_status_idx on public.module_payroll (module_status);
create index if not exists module_payroll_domain_idx on public.module_payroll (domain_key);
alter table public.module_payroll enable row level security;
create policy "module_payroll_select" on public.module_payroll for select using (true);
create policy "module_payroll_insert" on public.module_payroll for insert with check (true);
create policy "module_payroll_update" on public.module_payroll for update using (true) with check (true);
create policy "module_payroll_delete" on public.module_payroll for delete using (true);
drop trigger if exists module_payroll_set_updated_at on public.module_payroll;
create trigger module_payroll_set_updated_at before update on public.module_payroll for each row execute function public.set_updated_at();

create table if not exists public.module_reception (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_reception_module_registry_id_idx on public.module_reception (module_registry_id);
create index if not exists module_reception_module_key_idx on public.module_reception (module_key);
create index if not exists module_reception_record_title_idx on public.module_reception (record_title);
create index if not exists module_reception_status_idx on public.module_reception (module_status);
create index if not exists module_reception_domain_idx on public.module_reception (domain_key);
alter table public.module_reception enable row level security;
create policy "module_reception_select" on public.module_reception for select using (true);
create policy "module_reception_insert" on public.module_reception for insert with check (true);
create policy "module_reception_update" on public.module_reception for update using (true) with check (true);
create policy "module_reception_delete" on public.module_reception for delete using (true);
drop trigger if exists module_reception_set_updated_at on public.module_reception;
create trigger module_reception_set_updated_at before update on public.module_reception for each row execute function public.set_updated_at();

create table if not exists public.module_fees (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_fees_module_registry_id_idx on public.module_fees (module_registry_id);
create index if not exists module_fees_module_key_idx on public.module_fees (module_key);
create index if not exists module_fees_record_title_idx on public.module_fees (record_title);
create index if not exists module_fees_status_idx on public.module_fees (module_status);
create index if not exists module_fees_domain_idx on public.module_fees (domain_key);
alter table public.module_fees enable row level security;
create policy "module_fees_select" on public.module_fees for select using (true);
create policy "module_fees_insert" on public.module_fees for insert with check (true);
create policy "module_fees_update" on public.module_fees for update using (true) with check (true);
create policy "module_fees_delete" on public.module_fees for delete using (true);
drop trigger if exists module_fees_set_updated_at on public.module_fees;
create trigger module_fees_set_updated_at before update on public.module_fees for each row execute function public.set_updated_at();

create table if not exists public.module_scholarships (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_scholarships_module_registry_id_idx on public.module_scholarships (module_registry_id);
create index if not exists module_scholarships_module_key_idx on public.module_scholarships (module_key);
create index if not exists module_scholarships_record_title_idx on public.module_scholarships (record_title);
create index if not exists module_scholarships_status_idx on public.module_scholarships (module_status);
create index if not exists module_scholarships_domain_idx on public.module_scholarships (domain_key);
alter table public.module_scholarships enable row level security;
create policy "module_scholarships_select" on public.module_scholarships for select using (true);
create policy "module_scholarships_insert" on public.module_scholarships for insert with check (true);
create policy "module_scholarships_update" on public.module_scholarships for update using (true) with check (true);
create policy "module_scholarships_delete" on public.module_scholarships for delete using (true);
drop trigger if exists module_scholarships_set_updated_at on public.module_scholarships;
create trigger module_scholarships_set_updated_at before update on public.module_scholarships for each row execute function public.set_updated_at();

create table if not exists public.module_communication (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_communication_module_registry_id_idx on public.module_communication (module_registry_id);
create index if not exists module_communication_module_key_idx on public.module_communication (module_key);
create index if not exists module_communication_record_title_idx on public.module_communication (record_title);
create index if not exists module_communication_status_idx on public.module_communication (module_status);
create index if not exists module_communication_domain_idx on public.module_communication (domain_key);
alter table public.module_communication enable row level security;
create policy "module_communication_select" on public.module_communication for select using (true);
create policy "module_communication_insert" on public.module_communication for insert with check (true);
create policy "module_communication_update" on public.module_communication for update using (true) with check (true);
create policy "module_communication_delete" on public.module_communication for delete using (true);
drop trigger if exists module_communication_set_updated_at on public.module_communication;
create trigger module_communication_set_updated_at before update on public.module_communication for each row execute function public.set_updated_at();

create table if not exists public.module_chat (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_chat_module_registry_id_idx on public.module_chat (module_registry_id);
create index if not exists module_chat_module_key_idx on public.module_chat (module_key);
create index if not exists module_chat_record_title_idx on public.module_chat (record_title);
create index if not exists module_chat_status_idx on public.module_chat (module_status);
create index if not exists module_chat_domain_idx on public.module_chat (domain_key);
alter table public.module_chat enable row level security;
create policy "module_chat_select" on public.module_chat for select using (true);
create policy "module_chat_insert" on public.module_chat for insert with check (true);
create policy "module_chat_update" on public.module_chat for update using (true) with check (true);
create policy "module_chat_delete" on public.module_chat for delete using (true);
drop trigger if exists module_chat_set_updated_at on public.module_chat;
create trigger module_chat_set_updated_at before update on public.module_chat for each row execute function public.set_updated_at();

create table if not exists public.module_events (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_events_module_registry_id_idx on public.module_events (module_registry_id);
create index if not exists module_events_module_key_idx on public.module_events (module_key);
create index if not exists module_events_record_title_idx on public.module_events (record_title);
create index if not exists module_events_status_idx on public.module_events (module_status);
create index if not exists module_events_domain_idx on public.module_events (domain_key);
alter table public.module_events enable row level security;
create policy "module_events_select" on public.module_events for select using (true);
create policy "module_events_insert" on public.module_events for insert with check (true);
create policy "module_events_update" on public.module_events for update using (true) with check (true);
create policy "module_events_delete" on public.module_events for delete using (true);
drop trigger if exists module_events_set_updated_at on public.module_events;
create trigger module_events_set_updated_at before update on public.module_events for each row execute function public.set_updated_at();

create table if not exists public.module_media (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_media_module_registry_id_idx on public.module_media (module_registry_id);
create index if not exists module_media_module_key_idx on public.module_media (module_key);
create index if not exists module_media_record_title_idx on public.module_media (record_title);
create index if not exists module_media_status_idx on public.module_media (module_status);
create index if not exists module_media_domain_idx on public.module_media (domain_key);
alter table public.module_media enable row level security;
create policy "module_media_select" on public.module_media for select using (true);
create policy "module_media_insert" on public.module_media for insert with check (true);
create policy "module_media_update" on public.module_media for update using (true) with check (true);
create policy "module_media_delete" on public.module_media for delete using (true);
drop trigger if exists module_media_set_updated_at on public.module_media;
create trigger module_media_set_updated_at before update on public.module_media for each row execute function public.set_updated_at();

create table if not exists public.module_hostel (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_hostel_module_registry_id_idx on public.module_hostel (module_registry_id);
create index if not exists module_hostel_module_key_idx on public.module_hostel (module_key);
create index if not exists module_hostel_record_title_idx on public.module_hostel (record_title);
create index if not exists module_hostel_status_idx on public.module_hostel (module_status);
create index if not exists module_hostel_domain_idx on public.module_hostel (domain_key);
alter table public.module_hostel enable row level security;
create policy "module_hostel_select" on public.module_hostel for select using (true);
create policy "module_hostel_insert" on public.module_hostel for insert with check (true);
create policy "module_hostel_update" on public.module_hostel for update using (true) with check (true);
create policy "module_hostel_delete" on public.module_hostel for delete using (true);
drop trigger if exists module_hostel_set_updated_at on public.module_hostel;
create trigger module_hostel_set_updated_at before update on public.module_hostel for each row execute function public.set_updated_at();

create table if not exists public.module_transport (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_transport_module_registry_id_idx on public.module_transport (module_registry_id);
create index if not exists module_transport_module_key_idx on public.module_transport (module_key);
create index if not exists module_transport_record_title_idx on public.module_transport (record_title);
create index if not exists module_transport_status_idx on public.module_transport (module_status);
create index if not exists module_transport_domain_idx on public.module_transport (domain_key);
alter table public.module_transport enable row level security;
create policy "module_transport_select" on public.module_transport for select using (true);
create policy "module_transport_insert" on public.module_transport for insert with check (true);
create policy "module_transport_update" on public.module_transport for update using (true) with check (true);
create policy "module_transport_delete" on public.module_transport for delete using (true);
drop trigger if exists module_transport_set_updated_at on public.module_transport;
create trigger module_transport_set_updated_at before update on public.module_transport for each row execute function public.set_updated_at();

create table if not exists public.module_library (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_library_module_registry_id_idx on public.module_library (module_registry_id);
create index if not exists module_library_module_key_idx on public.module_library (module_key);
create index if not exists module_library_record_title_idx on public.module_library (record_title);
create index if not exists module_library_status_idx on public.module_library (module_status);
create index if not exists module_library_domain_idx on public.module_library (domain_key);
alter table public.module_library enable row level security;
create policy "module_library_select" on public.module_library for select using (true);
create policy "module_library_insert" on public.module_library for insert with check (true);
create policy "module_library_update" on public.module_library for update using (true) with check (true);
create policy "module_library_delete" on public.module_library for delete using (true);
drop trigger if exists module_library_set_updated_at on public.module_library;
create trigger module_library_set_updated_at before update on public.module_library for each row execute function public.set_updated_at();

create table if not exists public.module_inventory (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_inventory_module_registry_id_idx on public.module_inventory (module_registry_id);
create index if not exists module_inventory_module_key_idx on public.module_inventory (module_key);
create index if not exists module_inventory_record_title_idx on public.module_inventory (record_title);
create index if not exists module_inventory_status_idx on public.module_inventory (module_status);
create index if not exists module_inventory_domain_idx on public.module_inventory (domain_key);
alter table public.module_inventory enable row level security;
create policy "module_inventory_select" on public.module_inventory for select using (true);
create policy "module_inventory_insert" on public.module_inventory for insert with check (true);
create policy "module_inventory_update" on public.module_inventory for update using (true) with check (true);
create policy "module_inventory_delete" on public.module_inventory for delete using (true);
drop trigger if exists module_inventory_set_updated_at on public.module_inventory;
create trigger module_inventory_set_updated_at before update on public.module_inventory for each row execute function public.set_updated_at();

create table if not exists public.module_taskmanagement (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_taskmanagement_module_registry_id_idx on public.module_taskmanagement (module_registry_id);
create index if not exists module_taskmanagement_module_key_idx on public.module_taskmanagement (module_key);
create index if not exists module_taskmanagement_record_title_idx on public.module_taskmanagement (record_title);
create index if not exists module_taskmanagement_status_idx on public.module_taskmanagement (module_status);
create index if not exists module_taskmanagement_domain_idx on public.module_taskmanagement (domain_key);
alter table public.module_taskmanagement enable row level security;
create policy "module_taskmanagement_select" on public.module_taskmanagement for select using (true);
create policy "module_taskmanagement_insert" on public.module_taskmanagement for insert with check (true);
create policy "module_taskmanagement_update" on public.module_taskmanagement for update using (true) with check (true);
create policy "module_taskmanagement_delete" on public.module_taskmanagement for delete using (true);
drop trigger if exists module_taskmanagement_set_updated_at on public.module_taskmanagement;
create trigger module_taskmanagement_set_updated_at before update on public.module_taskmanagement for each row execute function public.set_updated_at();

create table if not exists public.module_placement (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_placement_module_registry_id_idx on public.module_placement (module_registry_id);
create index if not exists module_placement_module_key_idx on public.module_placement (module_key);
create index if not exists module_placement_record_title_idx on public.module_placement (record_title);
create index if not exists module_placement_status_idx on public.module_placement (module_status);
create index if not exists module_placement_domain_idx on public.module_placement (domain_key);
alter table public.module_placement enable row level security;
create policy "module_placement_select" on public.module_placement for select using (true);
create policy "module_placement_insert" on public.module_placement for insert with check (true);
create policy "module_placement_update" on public.module_placement for update using (true) with check (true);
create policy "module_placement_delete" on public.module_placement for delete using (true);
drop trigger if exists module_placement_set_updated_at on public.module_placement;
create trigger module_placement_set_updated_at before update on public.module_placement for each row execute function public.set_updated_at();

create table if not exists public.module_reportsanalytics (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_reportsanalytics_module_registry_id_idx on public.module_reportsanalytics (module_registry_id);
create index if not exists module_reportsanalytics_module_key_idx on public.module_reportsanalytics (module_key);
create index if not exists module_reportsanalytics_record_title_idx on public.module_reportsanalytics (record_title);
create index if not exists module_reportsanalytics_status_idx on public.module_reportsanalytics (module_status);
create index if not exists module_reportsanalytics_domain_idx on public.module_reportsanalytics (domain_key);
alter table public.module_reportsanalytics enable row level security;
create policy "module_reportsanalytics_select" on public.module_reportsanalytics for select using (true);
create policy "module_reportsanalytics_insert" on public.module_reportsanalytics for insert with check (true);
create policy "module_reportsanalytics_update" on public.module_reportsanalytics for update using (true) with check (true);
create policy "module_reportsanalytics_delete" on public.module_reportsanalytics for delete using (true);
drop trigger if exists module_reportsanalytics_set_updated_at on public.module_reportsanalytics;
create trigger module_reportsanalytics_set_updated_at before update on public.module_reportsanalytics for each row execute function public.set_updated_at();

create table if not exists public.module_alumni (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_alumni_module_registry_id_idx on public.module_alumni (module_registry_id);
create index if not exists module_alumni_module_key_idx on public.module_alumni (module_key);
create index if not exists module_alumni_record_title_idx on public.module_alumni (record_title);
create index if not exists module_alumni_status_idx on public.module_alumni (module_status);
create index if not exists module_alumni_domain_idx on public.module_alumni (domain_key);
alter table public.module_alumni enable row level security;
create policy "module_alumni_select" on public.module_alumni for select using (true);
create policy "module_alumni_insert" on public.module_alumni for insert with check (true);
create policy "module_alumni_update" on public.module_alumni for update using (true) with check (true);
create policy "module_alumni_delete" on public.module_alumni for delete using (true);
drop trigger if exists module_alumni_set_updated_at on public.module_alumni;
create trigger module_alumni_set_updated_at before update on public.module_alumni for each row execute function public.set_updated_at();

create table if not exists public.module_system (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_system_module_registry_id_idx on public.module_system (module_registry_id);
create index if not exists module_system_module_key_idx on public.module_system (module_key);
create index if not exists module_system_record_title_idx on public.module_system (record_title);
create index if not exists module_system_status_idx on public.module_system (module_status);
create index if not exists module_system_domain_idx on public.module_system (domain_key);
alter table public.module_system enable row level security;
create policy "module_system_select" on public.module_system for select using (true);
create policy "module_system_insert" on public.module_system for insert with check (true);
create policy "module_system_update" on public.module_system for update using (true) with check (true);
create policy "module_system_delete" on public.module_system for delete using (true);
drop trigger if exists module_system_set_updated_at on public.module_system;
create trigger module_system_set_updated_at before update on public.module_system for each row execute function public.set_updated_at();

create table if not exists public.module_settingsbackup (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_settingsbackup_module_registry_id_idx on public.module_settingsbackup (module_registry_id);
create index if not exists module_settingsbackup_module_key_idx on public.module_settingsbackup (module_key);
create index if not exists module_settingsbackup_record_title_idx on public.module_settingsbackup (record_title);
create index if not exists module_settingsbackup_status_idx on public.module_settingsbackup (module_status);
create index if not exists module_settingsbackup_domain_idx on public.module_settingsbackup (domain_key);
alter table public.module_settingsbackup enable row level security;
create policy "module_settingsbackup_select" on public.module_settingsbackup for select using (true);
create policy "module_settingsbackup_insert" on public.module_settingsbackup for insert with check (true);
create policy "module_settingsbackup_update" on public.module_settingsbackup for update using (true) with check (true);
create policy "module_settingsbackup_delete" on public.module_settingsbackup for delete using (true);
drop trigger if exists module_settingsbackup_set_updated_at on public.module_settingsbackup;
create trigger module_settingsbackup_set_updated_at before update on public.module_settingsbackup for each row execute function public.set_updated_at();

create table if not exists public.module_settings_header_registry (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_settings_header_registry_module_registry_id_idx on public.module_settings_header_registry (module_registry_id);
create index if not exists module_settings_header_registry_module_key_idx on public.module_settings_header_registry (module_key);
create index if not exists module_settings_header_registry_record_title_idx on public.module_settings_header_registry (record_title);
create index if not exists module_settings_header_registry_status_idx on public.module_settings_header_registry (module_status);
create index if not exists module_settings_header_registry_domain_idx on public.module_settings_header_registry (domain_key);
alter table public.module_settings_header_registry enable row level security;
create policy "module_settings_header_registry_select" on public.module_settings_header_registry for select using (true);
create policy "module_settings_header_registry_insert" on public.module_settings_header_registry for insert with check (true);
create policy "module_settings_header_registry_update" on public.module_settings_header_registry for update using (true) with check (true);
create policy "module_settings_header_registry_delete" on public.module_settings_header_registry for delete using (true);
drop trigger if exists module_settings_header_registry_set_updated_at on public.module_settings_header_registry;
create trigger module_settings_header_registry_set_updated_at before update on public.module_settings_header_registry for each row execute function public.set_updated_at();

create table if not exists public.module_settings_workspace_control (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_settings_workspace_control_module_registry_id_idx on public.module_settings_workspace_control (module_registry_id);
create index if not exists module_settings_workspace_control_module_key_idx on public.module_settings_workspace_control (module_key);
create index if not exists module_settings_workspace_control_record_title_idx on public.module_settings_workspace_control (record_title);
create index if not exists module_settings_workspace_control_status_idx on public.module_settings_workspace_control (module_status);
create index if not exists module_settings_workspace_control_domain_idx on public.module_settings_workspace_control (domain_key);
alter table public.module_settings_workspace_control enable row level security;
create policy "module_settings_workspace_control_select" on public.module_settings_workspace_control for select using (true);
create policy "module_settings_workspace_control_insert" on public.module_settings_workspace_control for insert with check (true);
create policy "module_settings_workspace_control_update" on public.module_settings_workspace_control for update using (true) with check (true);
create policy "module_settings_workspace_control_delete" on public.module_settings_workspace_control for delete using (true);
drop trigger if exists module_settings_workspace_control_set_updated_at on public.module_settings_workspace_control;
create trigger module_settings_workspace_control_set_updated_at before update on public.module_settings_workspace_control for each row execute function public.set_updated_at();

create table if not exists public.module_settings_ai_policy (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_settings_ai_policy_module_registry_id_idx on public.module_settings_ai_policy (module_registry_id);
create index if not exists module_settings_ai_policy_module_key_idx on public.module_settings_ai_policy (module_key);
create index if not exists module_settings_ai_policy_record_title_idx on public.module_settings_ai_policy (record_title);
create index if not exists module_settings_ai_policy_status_idx on public.module_settings_ai_policy (module_status);
create index if not exists module_settings_ai_policy_domain_idx on public.module_settings_ai_policy (domain_key);
alter table public.module_settings_ai_policy enable row level security;
create policy "module_settings_ai_policy_select" on public.module_settings_ai_policy for select using (true);
create policy "module_settings_ai_policy_insert" on public.module_settings_ai_policy for insert with check (true);
create policy "module_settings_ai_policy_update" on public.module_settings_ai_policy for update using (true) with check (true);
create policy "module_settings_ai_policy_delete" on public.module_settings_ai_policy for delete using (true);
drop trigger if exists module_settings_ai_policy_set_updated_at on public.module_settings_ai_policy;
create trigger module_settings_ai_policy_set_updated_at before update on public.module_settings_ai_policy for each row execute function public.set_updated_at();

create table if not exists public.module_settings_startup_trace (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_settings_startup_trace_module_registry_id_idx on public.module_settings_startup_trace (module_registry_id);
create index if not exists module_settings_startup_trace_module_key_idx on public.module_settings_startup_trace (module_key);
create index if not exists module_settings_startup_trace_record_title_idx on public.module_settings_startup_trace (record_title);
create index if not exists module_settings_startup_trace_status_idx on public.module_settings_startup_trace (module_status);
create index if not exists module_settings_startup_trace_domain_idx on public.module_settings_startup_trace (domain_key);
alter table public.module_settings_startup_trace enable row level security;
create policy "module_settings_startup_trace_select" on public.module_settings_startup_trace for select using (true);
create policy "module_settings_startup_trace_insert" on public.module_settings_startup_trace for insert with check (true);
create policy "module_settings_startup_trace_update" on public.module_settings_startup_trace for update using (true) with check (true);
create policy "module_settings_startup_trace_delete" on public.module_settings_startup_trace for delete using (true);
drop trigger if exists module_settings_startup_trace_set_updated_at on public.module_settings_startup_trace;
create trigger module_settings_startup_trace_set_updated_at before update on public.module_settings_startup_trace for each row execute function public.set_updated_at();

create table if not exists public.module_settings_batch_history (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  module_status text,
  domain_key text,
  domain_label text,
  renderer text,
  launch_type text,
  submodules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_settings_batch_history_module_registry_id_idx on public.module_settings_batch_history (module_registry_id);
create index if not exists module_settings_batch_history_module_key_idx on public.module_settings_batch_history (module_key);
create index if not exists module_settings_batch_history_record_title_idx on public.module_settings_batch_history (record_title);
create index if not exists module_settings_batch_history_status_idx on public.module_settings_batch_history (module_status);
create index if not exists module_settings_batch_history_domain_idx on public.module_settings_batch_history (domain_key);
alter table public.module_settings_batch_history enable row level security;
create policy "module_settings_batch_history_select" on public.module_settings_batch_history for select using (true);
create policy "module_settings_batch_history_insert" on public.module_settings_batch_history for insert with check (true);
create policy "module_settings_batch_history_update" on public.module_settings_batch_history for update using (true) with check (true);
create policy "module_settings_batch_history_delete" on public.module_settings_batch_history for delete using (true);
drop trigger if exists module_settings_batch_history_set_updated_at on public.module_settings_batch_history;
create trigger module_settings_batch_history_set_updated_at before update on public.module_settings_batch_history for each row execute function public.set_updated_at();

create table if not exists public.module_departments (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  category text,
  description text,
  departmentname text not null,
  departmentcode text not null,
  hodname text,
  programlevel text,
  sanctionedintake numeric default 0,
  naacnbastatus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_departments_module_registry_id_idx on public.module_departments (module_registry_id);
create index if not exists module_departments_module_key_idx on public.module_departments (module_key);
create index if not exists module_departments_record_title_idx on public.module_departments (record_title);
create index if not exists module_departments_category_idx on public.module_departments (category);
create index if not exists module_departments_departmentname_idx on public.module_departments (departmentname);
create index if not exists module_departments_departmentcode_idx on public.module_departments (departmentcode);
create index if not exists module_departments_hodname_idx on public.module_departments (hodname);
create index if not exists module_departments_programlevel_idx on public.module_departments (programlevel);
create index if not exists module_departments_naacnbastatus_idx on public.module_departments (naacnbastatus);
alter table public.module_departments enable row level security;
create policy "module_departments_select" on public.module_departments for select using (true);
create policy "module_departments_insert" on public.module_departments for insert with check (true);
create policy "module_departments_update" on public.module_departments for update using (true) with check (true);
create policy "module_departments_delete" on public.module_departments for delete using (true);
drop trigger if exists module_departments_set_updated_at on public.module_departments;
create trigger module_departments_set_updated_at before update on public.module_departments for each row execute function public.set_updated_at();

create table if not exists public.module_facultyhr (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  category text,
  description text,
  facultyname text not null,
  employeecode text not null,
  designation text,
  departmentname text,
  workloadhours numeric default 0,
  employmentstatus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_facultyhr_module_registry_id_idx on public.module_facultyhr (module_registry_id);
create index if not exists module_facultyhr_module_key_idx on public.module_facultyhr (module_key);
create index if not exists module_facultyhr_record_title_idx on public.module_facultyhr (record_title);
create index if not exists module_facultyhr_category_idx on public.module_facultyhr (category);
create index if not exists module_facultyhr_facultyname_idx on public.module_facultyhr (facultyname);
create index if not exists module_facultyhr_employeecode_idx on public.module_facultyhr (employeecode);
create index if not exists module_facultyhr_designation_idx on public.module_facultyhr (designation);
create index if not exists module_facultyhr_departmentname_idx on public.module_facultyhr (departmentname);
create index if not exists module_facultyhr_employmentstatus_idx on public.module_facultyhr (employmentstatus);
alter table public.module_facultyhr enable row level security;
create policy "module_facultyhr_select" on public.module_facultyhr for select using (true);
create policy "module_facultyhr_insert" on public.module_facultyhr for insert with check (true);
create policy "module_facultyhr_update" on public.module_facultyhr for update using (true) with check (true);
create policy "module_facultyhr_delete" on public.module_facultyhr for delete using (true);
drop trigger if exists module_facultyhr_set_updated_at on public.module_facultyhr;
create trigger module_facultyhr_set_updated_at before update on public.module_facultyhr for each row execute function public.set_updated_at();

create table if not exists public.module_curriculumoutcome (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  category text,
  description text,
  curriculumname text not null,
  coursecode text,
  semester text,
  outcomemapstatus text,
  syllabuscoverage numeric default 0,
  attainmentband text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_curriculumoutcome_module_registry_id_idx on public.module_curriculumoutcome (module_registry_id);
create index if not exists module_curriculumoutcome_module_key_idx on public.module_curriculumoutcome (module_key);
create index if not exists module_curriculumoutcome_record_title_idx on public.module_curriculumoutcome (record_title);
create index if not exists module_curriculumoutcome_category_idx on public.module_curriculumoutcome (category);
create index if not exists module_curriculumoutcome_curriculumname_idx on public.module_curriculumoutcome (curriculumname);
create index if not exists module_curriculumoutcome_coursecode_idx on public.module_curriculumoutcome (coursecode);
create index if not exists module_curriculumoutcome_semester_idx on public.module_curriculumoutcome (semester);
create index if not exists module_curriculumoutcome_outcomemapstatus_idx on public.module_curriculumoutcome (outcomemapstatus);
create index if not exists module_curriculumoutcome_attainmentband_idx on public.module_curriculumoutcome (attainmentband);
alter table public.module_curriculumoutcome enable row level security;
create policy "module_curriculumoutcome_select" on public.module_curriculumoutcome for select using (true);
create policy "module_curriculumoutcome_insert" on public.module_curriculumoutcome for insert with check (true);
create policy "module_curriculumoutcome_update" on public.module_curriculumoutcome for update using (true) with check (true);
create policy "module_curriculumoutcome_delete" on public.module_curriculumoutcome for delete using (true);
drop trigger if exists module_curriculumoutcome_set_updated_at on public.module_curriculumoutcome;
create trigger module_curriculumoutcome_set_updated_at before update on public.module_curriculumoutcome for each row execute function public.set_updated_at();

create table if not exists public.module_lmselearning (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  category text,
  description text,
  courseroom text not null,
  contentunit text,
  facultyowner text,
  engagementpercent numeric default 0,
  completionstatus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_lmselearning_module_registry_id_idx on public.module_lmselearning (module_registry_id);
create index if not exists module_lmselearning_module_key_idx on public.module_lmselearning (module_key);
create index if not exists module_lmselearning_record_title_idx on public.module_lmselearning (record_title);
create index if not exists module_lmselearning_category_idx on public.module_lmselearning (category);
create index if not exists module_lmselearning_courseroom_idx on public.module_lmselearning (courseroom);
create index if not exists module_lmselearning_contentunit_idx on public.module_lmselearning (contentunit);
create index if not exists module_lmselearning_facultyowner_idx on public.module_lmselearning (facultyowner);
create index if not exists module_lmselearning_completionstatus_idx on public.module_lmselearning (completionstatus);
alter table public.module_lmselearning enable row level security;
create policy "module_lmselearning_select" on public.module_lmselearning for select using (true);
create policy "module_lmselearning_insert" on public.module_lmselearning for insert with check (true);
create policy "module_lmselearning_update" on public.module_lmselearning for update using (true) with check (true);
create policy "module_lmselearning_delete" on public.module_lmselearning for delete using (true);
drop trigger if exists module_lmselearning_set_updated_at on public.module_lmselearning;
create trigger module_lmselearning_set_updated_at before update on public.module_lmselearning for each row execute function public.set_updated_at();

create table if not exists public.module_researchinnovation (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  category text,
  description text,
  researchtitle text not null,
  principalinvestigator text,
  fundingagency text,
  grantamount numeric default 0,
  researchstage text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_researchinnovation_module_registry_id_idx on public.module_researchinnovation (module_registry_id);
create index if not exists module_researchinnovation_module_key_idx on public.module_researchinnovation (module_key);
create index if not exists module_researchinnovation_record_title_idx on public.module_researchinnovation (record_title);
create index if not exists module_researchinnovation_category_idx on public.module_researchinnovation (category);
create index if not exists module_researchinnovation_researchtitle_idx on public.module_researchinnovation (researchtitle);
create index if not exists module_researchinnovation_principalinvestigator_idx on public.module_researchinnovation (principalinvestigator);
create index if not exists module_researchinnovation_fundingagency_idx on public.module_researchinnovation (fundingagency);
create index if not exists module_researchinnovation_researchstage_idx on public.module_researchinnovation (researchstage);
alter table public.module_researchinnovation enable row level security;
create policy "module_researchinnovation_select" on public.module_researchinnovation for select using (true);
create policy "module_researchinnovation_insert" on public.module_researchinnovation for insert with check (true);
create policy "module_researchinnovation_update" on public.module_researchinnovation for update using (true) with check (true);
create policy "module_researchinnovation_delete" on public.module_researchinnovation for delete using (true);
drop trigger if exists module_researchinnovation_set_updated_at on public.module_researchinnovation;
create trigger module_researchinnovation_set_updated_at before update on public.module_researchinnovation for each row execute function public.set_updated_at();

create table if not exists public.module_accreditationiqac (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  category text,
  description text,
  qualitycycle text not null,
  framework text,
  criterion text,
  evidencestatus text,
  owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_accreditationiqac_module_registry_id_idx on public.module_accreditationiqac (module_registry_id);
create index if not exists module_accreditationiqac_module_key_idx on public.module_accreditationiqac (module_key);
create index if not exists module_accreditationiqac_record_title_idx on public.module_accreditationiqac (record_title);
create index if not exists module_accreditationiqac_category_idx on public.module_accreditationiqac (category);
create index if not exists module_accreditationiqac_qualitycycle_idx on public.module_accreditationiqac (qualitycycle);
create index if not exists module_accreditationiqac_framework_idx on public.module_accreditationiqac (framework);
create index if not exists module_accreditationiqac_criterion_idx on public.module_accreditationiqac (criterion);
create index if not exists module_accreditationiqac_evidencestatus_idx on public.module_accreditationiqac (evidencestatus);
create index if not exists module_accreditationiqac_owner_idx on public.module_accreditationiqac (owner);
alter table public.module_accreditationiqac enable row level security;
create policy "module_accreditationiqac_select" on public.module_accreditationiqac for select using (true);
create policy "module_accreditationiqac_insert" on public.module_accreditationiqac for insert with check (true);
create policy "module_accreditationiqac_update" on public.module_accreditationiqac for update using (true) with check (true);
create policy "module_accreditationiqac_delete" on public.module_accreditationiqac for delete using (true);
drop trigger if exists module_accreditationiqac_set_updated_at on public.module_accreditationiqac;
create trigger module_accreditationiqac_set_updated_at before update on public.module_accreditationiqac for each row execute function public.set_updated_at();

create table if not exists public.module_financeaccounting (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  category text,
  description text,
  voucherno text not null,
  accounthead text not null,
  transactiontype text,
  amount numeric not null default 0,
  approvalstatus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_financeaccounting_module_registry_id_idx on public.module_financeaccounting (module_registry_id);
create index if not exists module_financeaccounting_module_key_idx on public.module_financeaccounting (module_key);
create index if not exists module_financeaccounting_record_title_idx on public.module_financeaccounting (record_title);
create index if not exists module_financeaccounting_category_idx on public.module_financeaccounting (category);
create index if not exists module_financeaccounting_voucherno_idx on public.module_financeaccounting (voucherno);
create index if not exists module_financeaccounting_accounthead_idx on public.module_financeaccounting (accounthead);
create index if not exists module_financeaccounting_transactiontype_idx on public.module_financeaccounting (transactiontype);
create index if not exists module_financeaccounting_approvalstatus_idx on public.module_financeaccounting (approvalstatus);
alter table public.module_financeaccounting enable row level security;
create policy "module_financeaccounting_select" on public.module_financeaccounting for select using (true);
create policy "module_financeaccounting_insert" on public.module_financeaccounting for insert with check (true);
create policy "module_financeaccounting_update" on public.module_financeaccounting for update using (true) with check (true);
create policy "module_financeaccounting_delete" on public.module_financeaccounting for delete using (true);
drop trigger if exists module_financeaccounting_set_updated_at on public.module_financeaccounting;
create trigger module_financeaccounting_set_updated_at before update on public.module_financeaccounting for each row execute function public.set_updated_at();

create table if not exists public.module_procurementassets (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  category text,
  description text,
  requesttitle text not null,
  vendorname text,
  assettag text,
  departmentname text,
  procurementstatus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_procurementassets_module_registry_id_idx on public.module_procurementassets (module_registry_id);
create index if not exists module_procurementassets_module_key_idx on public.module_procurementassets (module_key);
create index if not exists module_procurementassets_record_title_idx on public.module_procurementassets (record_title);
create index if not exists module_procurementassets_category_idx on public.module_procurementassets (category);
create index if not exists module_procurementassets_requesttitle_idx on public.module_procurementassets (requesttitle);
create index if not exists module_procurementassets_vendorname_idx on public.module_procurementassets (vendorname);
create index if not exists module_procurementassets_assettag_idx on public.module_procurementassets (assettag);
create index if not exists module_procurementassets_departmentname_idx on public.module_procurementassets (departmentname);
create index if not exists module_procurementassets_procurementstatus_idx on public.module_procurementassets (procurementstatus);
alter table public.module_procurementassets enable row level security;
create policy "module_procurementassets_select" on public.module_procurementassets for select using (true);
create policy "module_procurementassets_insert" on public.module_procurementassets for insert with check (true);
create policy "module_procurementassets_update" on public.module_procurementassets for update using (true) with check (true);
create policy "module_procurementassets_delete" on public.module_procurementassets for delete using (true);
drop trigger if exists module_procurementassets_set_updated_at on public.module_procurementassets;
create trigger module_procurementassets_set_updated_at before update on public.module_procurementassets for each row execute function public.set_updated_at();

create table if not exists public.module_grievancehelpdesk (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  category text,
  description text,
  tickettitle text not null,
  requestertype text,
  priorityband text,
  assignedteam text,
  slastatus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_grievancehelpdesk_module_registry_id_idx on public.module_grievancehelpdesk (module_registry_id);
create index if not exists module_grievancehelpdesk_module_key_idx on public.module_grievancehelpdesk (module_key);
create index if not exists module_grievancehelpdesk_record_title_idx on public.module_grievancehelpdesk (record_title);
create index if not exists module_grievancehelpdesk_category_idx on public.module_grievancehelpdesk (category);
create index if not exists module_grievancehelpdesk_tickettitle_idx on public.module_grievancehelpdesk (tickettitle);
create index if not exists module_grievancehelpdesk_requestertype_idx on public.module_grievancehelpdesk (requestertype);
create index if not exists module_grievancehelpdesk_priorityband_idx on public.module_grievancehelpdesk (priorityband);
create index if not exists module_grievancehelpdesk_assignedteam_idx on public.module_grievancehelpdesk (assignedteam);
create index if not exists module_grievancehelpdesk_slastatus_idx on public.module_grievancehelpdesk (slastatus);
alter table public.module_grievancehelpdesk enable row level security;
create policy "module_grievancehelpdesk_select" on public.module_grievancehelpdesk for select using (true);
create policy "module_grievancehelpdesk_insert" on public.module_grievancehelpdesk for insert with check (true);
create policy "module_grievancehelpdesk_update" on public.module_grievancehelpdesk for update using (true) with check (true);
create policy "module_grievancehelpdesk_delete" on public.module_grievancehelpdesk for delete using (true);
drop trigger if exists module_grievancehelpdesk_set_updated_at on public.module_grievancehelpdesk;
create trigger module_grievancehelpdesk_set_updated_at before update on public.module_grievancehelpdesk for each row execute function public.set_updated_at();

create table if not exists public.module_healthwellbeing (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  category text,
  description text,
  casetitle text not null,
  personname text,
  casetype text,
  followupdate timestamptz,
  carestatus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_healthwellbeing_module_registry_id_idx on public.module_healthwellbeing (module_registry_id);
create index if not exists module_healthwellbeing_module_key_idx on public.module_healthwellbeing (module_key);
create index if not exists module_healthwellbeing_record_title_idx on public.module_healthwellbeing (record_title);
create index if not exists module_healthwellbeing_category_idx on public.module_healthwellbeing (category);
create index if not exists module_healthwellbeing_casetitle_idx on public.module_healthwellbeing (casetitle);
create index if not exists module_healthwellbeing_personname_idx on public.module_healthwellbeing (personname);
create index if not exists module_healthwellbeing_casetype_idx on public.module_healthwellbeing (casetype);
create index if not exists module_healthwellbeing_carestatus_idx on public.module_healthwellbeing (carestatus);
alter table public.module_healthwellbeing enable row level security;
create policy "module_healthwellbeing_select" on public.module_healthwellbeing for select using (true);
create policy "module_healthwellbeing_insert" on public.module_healthwellbeing for insert with check (true);
create policy "module_healthwellbeing_update" on public.module_healthwellbeing for update using (true) with check (true);
create policy "module_healthwellbeing_delete" on public.module_healthwellbeing for delete using (true);
drop trigger if exists module_healthwellbeing_set_updated_at on public.module_healthwellbeing;
create trigger module_healthwellbeing_set_updated_at before update on public.module_healthwellbeing for each row execute function public.set_updated_at();

create table if not exists public.module_securitycompliance (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  category text,
  description text,
  controltitle text not null,
  controltype text,
  owner text,
  risklevel text,
  closurestatus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_securitycompliance_module_registry_id_idx on public.module_securitycompliance (module_registry_id);
create index if not exists module_securitycompliance_module_key_idx on public.module_securitycompliance (module_key);
create index if not exists module_securitycompliance_record_title_idx on public.module_securitycompliance (record_title);
create index if not exists module_securitycompliance_category_idx on public.module_securitycompliance (category);
create index if not exists module_securitycompliance_controltitle_idx on public.module_securitycompliance (controltitle);
create index if not exists module_securitycompliance_controltype_idx on public.module_securitycompliance (controltype);
create index if not exists module_securitycompliance_owner_idx on public.module_securitycompliance (owner);
create index if not exists module_securitycompliance_risklevel_idx on public.module_securitycompliance (risklevel);
create index if not exists module_securitycompliance_closurestatus_idx on public.module_securitycompliance (closurestatus);
alter table public.module_securitycompliance enable row level security;
create policy "module_securitycompliance_select" on public.module_securitycompliance for select using (true);
create policy "module_securitycompliance_insert" on public.module_securitycompliance for insert with check (true);
create policy "module_securitycompliance_update" on public.module_securitycompliance for update using (true) with check (true);
create policy "module_securitycompliance_delete" on public.module_securitycompliance for delete using (true);
drop trigger if exists module_securitycompliance_set_updated_at on public.module_securitycompliance;
create trigger module_securitycompliance_set_updated_at before update on public.module_securitycompliance for each row execute function public.set_updated_at();

create table if not exists public.module_documentdms (
  id uuid default gen_random_uuid() primary key,
  module_registry_id uuid not null references public.module_registry(id) on delete cascade,
  module_key text not null,
  record_title text not null,
  summary text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  category text,
  description text,
  documenttitle text not null,
  documenttype text,
  owner text,
  expirydate timestamptz,
  documentstatus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz default null
);

create index if not exists module_documentdms_module_registry_id_idx on public.module_documentdms (module_registry_id);
create index if not exists module_documentdms_module_key_idx on public.module_documentdms (module_key);
create index if not exists module_documentdms_record_title_idx on public.module_documentdms (record_title);
create index if not exists module_documentdms_category_idx on public.module_documentdms (category);
create index if not exists module_documentdms_documenttitle_idx on public.module_documentdms (documenttitle);
create index if not exists module_documentdms_documenttype_idx on public.module_documentdms (documenttype);
create index if not exists module_documentdms_owner_idx on public.module_documentdms (owner);
create index if not exists module_documentdms_documentstatus_idx on public.module_documentdms (documentstatus);
alter table public.module_documentdms enable row level security;
create policy "module_documentdms_select" on public.module_documentdms for select using (true);
create policy "module_documentdms_insert" on public.module_documentdms for insert with check (true);
create policy "module_documentdms_update" on public.module_documentdms for update using (true) with check (true);
create policy "module_documentdms_delete" on public.module_documentdms for delete using (true);
drop trigger if exists module_documentdms_set_updated_at on public.module_documentdms;
create trigger module_documentdms_set_updated_at before update on public.module_documentdms for each row execute function public.set_updated_at();

create table if not exists public.erp_workspace_state (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid,
  active_module text not null,
  active_workspace_key text not null,
  active_tab text,
  sidebar_expanded bool not null default true,
  pinned_modules jsonb,
  recent_modules jsonb,
  last_opened_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists erp_workspace_state_tenant_user_idx on public.erp_workspace_state (tenant_id, user_id);
create index if not exists erp_workspace_state_active_module_idx on public.erp_workspace_state (active_module);
alter table public.erp_workspace_state enable row level security;
create policy "erp_workspace_state_select" on public.erp_workspace_state for select using (true);
create policy "erp_workspace_state_insert" on public.erp_workspace_state for insert with check (true);
create policy "erp_workspace_state_update" on public.erp_workspace_state for update using (true) with check (true);
create policy "erp_workspace_state_delete" on public.erp_workspace_state for delete using (true);
drop trigger if exists erp_workspace_state_set_updated_at on public.erp_workspace_state;
create trigger erp_workspace_state_set_updated_at before update on public.erp_workspace_state for each row execute function public.set_updated_at();

create table if not exists public.erp_workspace_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid,
  module_key text not null,
  workspace_key text,
  event_type text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists erp_workspace_events_tenant_idx on public.erp_workspace_events (tenant_id);
create index if not exists erp_workspace_events_module_idx on public.erp_workspace_events (module_key);
create index if not exists erp_workspace_events_created_at_idx on public.erp_workspace_events (created_at desc);
alter table public.erp_workspace_events enable row level security;
create policy "erp_workspace_events_select" on public.erp_workspace_events for select using (true);
create policy "erp_workspace_events_insert" on public.erp_workspace_events for insert with check (true);
create policy "erp_workspace_events_update" on public.erp_workspace_events for update using (true) with check (true);
create policy "erp_workspace_events_delete" on public.erp_workspace_events for delete using (true);
