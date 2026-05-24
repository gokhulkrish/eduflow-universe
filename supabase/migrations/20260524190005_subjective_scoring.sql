-- Patch 07: Subjective → Standardized Score Engine (Behavior → 1–10 Index)

create table if not exists public.subjective_rubrics (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  name text not null,
  code text not null,
  description text,
  config jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists ux_subjective_rubrics_inst_code
  on public.subjective_rubrics (institution_id, code);

alter table public.subjective_rubrics enable row level security;

create policy "subjective_rubrics_select" on public.subjective_rubrics
  for select to authenticated using (true);

create policy "subjective_rubrics_insert" on public.subjective_rubrics
  for insert to authenticated with check (true);

create policy "subjective_rubrics_update" on public.subjective_rubrics
  for update to authenticated using (true);

create trigger trg_subjective_rubrics_updated_at before update on public.subjective_rubrics
  for each row execute function public.update_updated_at_column();

create table if not exists public.subjective_observations (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null,
  observed_on date not null,
  rubric_code text not null,
  comment text,
  raw_payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subjective_observations_student
  on public.subjective_observations (institution_id, student_id, observed_on);

alter table public.subjective_observations enable row level security;

create policy "subjective_observations_select" on public.subjective_observations
  for select to authenticated using (true);

create policy "subjective_observations_insert" on public.subjective_observations
  for insert to authenticated with check (true);

create trigger trg_subjective_observations_updated_at before update on public.subjective_observations
  for each row execute function public.update_updated_at_column();

create table if not exists public.subjective_scores (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  student_id uuid not null references public.students(id) on delete cascade,
  rubric_code text not null,
  period_start date not null,
  period_end date not null,
  scores jsonb not null,
  composite_score numeric(4,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subjective_scores_student_period
  on public.subjective_scores (institution_id, student_id, period_start, period_end);

alter table public.subjective_scores enable row level security;

create policy "subjective_scores_select" on public.subjective_scores
  for select to authenticated using (true);

create policy "subjective_scores_insert" on public.subjective_scores
  for insert to authenticated with check (true);

create policy "subjective_scores_update" on public.subjective_scores
  for update to authenticated using (true);

create trigger trg_subjective_scores_updated_at before update on public.subjective_scores
  for each row execute function public.update_updated_at_column();
