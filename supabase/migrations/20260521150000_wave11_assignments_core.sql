
-- Wave 11: Assignments & Homework.
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  due_date timestamptz,
  max_marks numeric(6,2) not null default 100,
  attachments jsonb default '[]'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.assignments enable row level security;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  content text,
  file_url text,
  submitted_at timestamptz not null default now(),
  status text not null default 'submitted',
  marks numeric(6,2),
  feedback text,
  graded_by uuid references auth.users(id) on delete set null,
  graded_at timestamptz,
  unique (assignment_id, student_id)
);
alter table public.submissions enable row level security;

create trigger trg_assignments_updated_at before update on public.assignments
  for each row execute function public.update_updated_at_column();

create policy "as read auth" on public.assignments for select to authenticated using (true);
create policy "as staff manage" on public.assignments for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "as staff update" on public.assignments for update to authenticated using (public.is_staff(auth.uid()));
create policy "as admin delete" on public.assignments for delete to authenticated using (public.is_admin(auth.uid()));

create policy "sub read auth" on public.submissions for select to authenticated using (true);
create policy "sub student insert" on public.submissions for insert to authenticated with check (true);
create policy "sub staff update" on public.submissions for update to authenticated using (public.is_staff(auth.uid()));

insert into public.permissions(module_key, action, label) values
  ('assignments','view','View Assignments'),
  ('assignments','create','Create Assignments'),
  ('assignments','grade','Grade Submissions')
on conflict do nothing;
