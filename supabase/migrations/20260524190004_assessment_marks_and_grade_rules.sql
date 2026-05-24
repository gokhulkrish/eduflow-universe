-- Patch 06: Assessment & Scoring Engine Alignment
-- Creates exam_marks and grade_rules tables

create table if not exists public.exam_marks (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  term_id uuid not null references public.exam_terms(id) on delete cascade,
  component_id uuid not null references public.exam_components(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete cascade,
  raw_marks numeric(6,2) not null,
  max_marks numeric(6,2) not null,
  weighted_marks numeric(8,3),
  remarks text,
  source_system text not null default 'new-system',
  legacy_batch_id uuid references public.import_batches(id),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_exam_marks_main
  on public.exam_marks (institution_id, term_id, component_id, subject_id, student_id);

alter table public.exam_marks enable row level security;

create policy "exam_marks_select" on public.exam_marks
  for select to authenticated using (true);

create policy "exam_marks_insert" on public.exam_marks
  for insert to authenticated with check (true);

create policy "exam_marks_update" on public.exam_marks
  for update to authenticated using (true);

create policy "exam_marks_delete" on public.exam_marks
  for delete to authenticated using (true);

create trigger trg_exam_marks_updated_at before update on public.exam_marks
  for each row execute function public.update_updated_at_column();

create table if not exists public.grade_rules (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  name text not null,
  code text not null,
  min_percentage numeric(5,2) not null,
  max_percentage numeric(5,2) not null,
  grade text not null,
  grade_point numeric(4,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_grade_rules_institution_code
  on public.grade_rules (institution_id, code);

alter table public.grade_rules enable row level security;

create policy "grade_rules_select" on public.grade_rules
  for select to authenticated using (true);

create policy "grade_rules_insert" on public.grade_rules
  for insert to authenticated with check (true);

create policy "grade_rules_update" on public.grade_rules
  for update to authenticated using (true);

create trigger trg_grade_rules_updated_at before update on public.grade_rules
  for each row execute function public.update_updated_at_column();
