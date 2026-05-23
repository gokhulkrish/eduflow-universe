
-- Wave 7: Exams & Results Core.
-- Exam schedules, marks, question banks, transcripts, grade schemes, result publications.

do $$ begin
  create type public.exam_status as enum ('draft','published','completed','cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.exam_type as enum ('quiz','unit_test','midterm','final','preboard','other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.question_difficulty as enum ('easy','medium','hard');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.question_type as enum ('mcq','short_answer','long_answer','true_false','fill_blank');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.mark_status as enum ('pending','approved','rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.transcript_status as enum ('draft','issued','revoked');
exception when duplicate_object then null;
end $$;

-- 1. Exam Schedules
create table if not exists public.exam_schedules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  exam_type public.exam_type not null default 'unit_test',
  grade text not null,
  section text not null default 'A',
  subject text not null,
  subject_id uuid references public.subjects(id) on delete set null,
  max_marks int not null default 100,
  pass_marks int not null default 35,
  date date not null,
  start_time time not null default '09:00',
  end_time time not null default '10:30',
  description text not null default '',
  status public.exam_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.exam_schedules enable row level security;

-- 2. Exam Marks
create table if not exists public.exam_marks (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exam_schedules(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  marks_obtained numeric(6,2),
  grade text,
  remarks text not null default '',
  status public.mark_status not null default 'pending',
  entered_by uuid references auth.users(id) on delete set null,
  moderated_by uuid references auth.users(id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(exam_id, student_id)
);
alter table public.exam_marks enable row level security;

-- 3. Question Banks
create table if not exists public.question_banks (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  grade text not null,
  topic text not null default '',
  difficulty public.question_difficulty not null default 'medium',
  question_type public.question_type not null default 'mcq',
  question_text text not null,
  options jsonb,
  correct_answer text not null default '',
  marks numeric(5,2) not null default 1,
  explanation text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.question_banks enable row level security;

-- 4. Grade Schemes
create table if not exists public.grade_schemes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  min_percentage numeric(5,2) not null,
  max_percentage numeric(5,2) not null,
  grade_label text not null,
  grade_point numeric(4,2) not null,
  remarks text not null default '',
  created_at timestamptz not null default now()
);
alter table public.grade_schemes enable row level security;

-- 5. Transcripts
create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  academic_year text not null,
  exam_ids uuid[] not null default '{}',
  total_marks numeric(8,2),
  obtained_marks numeric(8,2),
  percentage numeric(5,2),
  gpa numeric(3,2),
  status public.transcript_status not null default 'draft',
  issued_at timestamptz,
  pdf_url text,
  qr_token text unique,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.transcripts enable row level security;

-- 6. Result Publications
create table if not exists public.result_publications (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exam_schedules(id) on delete cascade,
  published_by uuid references auth.users(id) on delete set null,
  published_at timestamptz not null default now(),
  notify_students boolean not null default false,
  notify_parents boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  unique(exam_id)
);
alter table public.result_publications enable row level security;

-- Updated_at triggers
create trigger trg_exam_schedules_updated_at before update on public.exam_schedules
  for each row execute function public.update_updated_at_column();
create trigger trg_exam_marks_updated_at before update on public.exam_marks
  for each row execute function public.update_updated_at_column();
create trigger trg_question_banks_updated_at before update on public.question_banks
  for each row execute function public.update_updated_at_column();
create trigger trg_transcripts_updated_at before update on public.transcripts
  for each row execute function public.update_updated_at_column();

-- RLS: exam_schedules
create policy "schedules read auth" on public.exam_schedules for select to authenticated using (true);
create policy "schedules staff manage" on public.exam_schedules for insert to authenticated
  with check (public.is_staff(auth.uid()));
create policy "schedules staff update" on public.exam_schedules for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "schedules admin delete" on public.exam_schedules for delete to authenticated
  using (public.is_admin(auth.uid()));

-- RLS: exam_marks
create policy "marks read own" on public.exam_marks for select to authenticated
  using (exists(select 1 from public.students s where s.id = student_id and s.user_id = auth.uid())
         or public.is_staff(auth.uid()));
create policy "marks staff manage" on public.exam_marks for insert to authenticated
  with check (public.is_staff(auth.uid()));
create policy "marks staff update" on public.exam_marks for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "marks admin delete" on public.exam_marks for delete to authenticated
  using (public.is_admin(auth.uid()));

-- RLS: question_banks
create policy "qb read auth" on public.question_banks for select to authenticated using (true);
create policy "qb staff manage" on public.question_banks for insert to authenticated
  with check (public.is_staff(auth.uid()));
create policy "qb staff update" on public.question_banks for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "qb admin delete" on public.question_banks for delete to authenticated
  using (public.is_admin(auth.uid()));

-- RLS: grade_schemes
create policy "gs read auth" on public.grade_schemes for select to authenticated using (true);
create policy "gs admin manage" on public.grade_schemes for all to authenticated
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- RLS: transcripts
create policy "tr read own" on public.transcripts for select to authenticated
  using (exists(select 1 from public.students s where s.id = student_id and s.user_id = auth.uid())
         or public.is_staff(auth.uid()));
create policy "tr staff manage" on public.transcripts for insert to authenticated
  with check (public.is_staff(auth.uid()));
create policy "tr staff update" on public.transcripts for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "tr admin delete" on public.transcripts for delete to authenticated
  using (public.is_admin(auth.uid()));

-- RLS: result_publications
create policy "rp read auth" on public.result_publications for select to authenticated using (true);
create policy "rp staff manage" on public.result_publications for insert to authenticated
  with check (public.is_staff(auth.uid()));
create policy "rp staff update" on public.result_publications for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "rp admin delete" on public.result_publications for delete to authenticated
  using (public.is_admin(auth.uid()));

-- Additional permissions for exams module
insert into public.permissions(module_key, action, label) values
  ('exams','question_bank','Manage Question Bank'),
  ('exams','marks_approve','Approve Marks'),
  ('exams','publish','Publish Results'),
  ('exams','transcript','Issue Transcripts')
on conflict do nothing;

-- Default grade scheme
insert into public.grade_schemes(name, min_percentage, max_percentage, grade_label, grade_point, remarks) values
  ('Standard', 90, 100, 'A+', 10.0, 'Outstanding'),
  ('Standard', 80, 89.99, 'A', 9.0, 'Excellent'),
  ('Standard', 70, 79.99, 'B+', 8.0, 'Very Good'),
  ('Standard', 60, 69.99, 'B', 7.0, 'Good'),
  ('Standard', 50, 59.99, 'C', 6.0, 'Average'),
  ('Standard', 40, 49.99, 'D', 5.0, 'Below Average'),
  ('Standard', 0, 39.99, 'F', 0.0, 'Fail')
on conflict do nothing;
