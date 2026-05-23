
-- Wave 9: Timetable Scheduler.
-- Adds time slots, timetable entries, and substitution management.

create table if not exists public.time_slots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_break boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.time_slots enable row level security;

create table if not exists public.timetable_entries (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.staff(id) on delete cascade,
  time_slot_id uuid not null references public.time_slots(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  academic_year_id uuid references public.academic_years(id) on delete set null,
  room text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, time_slot_id, day_of_week)
);
alter table public.timetable_entries enable row level security;

create table if not exists public.substitutions (
  id uuid primary key default gen_random_uuid(),
  timetable_entry_id uuid not null references public.timetable_entries(id) on delete cascade,
  original_teacher_id uuid not null references public.staff(id) on delete cascade,
  substitute_teacher_id uuid not null references public.staff(id) on delete cascade,
  date date not null,
  reason text,
  status text not null default 'requested',
  created_at timestamptz not null default now()
);
alter table public.substitutions enable row level security;

-- Updated_at trigger for timetable_entries
create trigger trg_timetable_entries_updated_at before update on public.timetable_entries
  for each row execute function public.update_updated_at_column();

-- RLS policies
create policy "ts read auth" on public.time_slots for select to authenticated using (true);
create policy "ts staff manage" on public.time_slots for insert to authenticated
  with check (public.is_staff(auth.uid()));
create policy "ts staff update" on public.time_slots for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "ts admin delete" on public.time_slots for delete to authenticated
  using (public.is_admin(auth.uid()));

create policy "te read auth" on public.timetable_entries for select to authenticated using (true);
create policy "te staff manage" on public.timetable_entries for insert to authenticated
  with check (public.is_staff(auth.uid()));
create policy "te staff update" on public.timetable_entries for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "te admin delete" on public.timetable_entries for delete to authenticated
  using (public.is_admin(auth.uid()));

create policy "sub read auth" on public.substitutions for select to authenticated using (true);
create policy "sub staff manage" on public.substitutions for insert to authenticated
  with check (public.is_staff(auth.uid()));
create policy "sub staff update" on public.substitutions for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Permissions
insert into public.permissions(module_key, action, label) values
  ('timetable','view','View Timetable'),
  ('timetable','edit','Edit Timetable'),
  ('timetable','substitute','Manage Substitutions')
on conflict do nothing;

-- Default time slots (Mon-Fri, 8 periods)
insert into public.time_slots(name, day_of_week, start_time, end_time, is_break) values
  ('Period 1', 1, '08:00', '08:45', false),
  ('Period 2', 1, '08:45', '09:30', false),
  ('Morning Break', 1, '09:30', '09:45', true),
  ('Period 3', 1, '09:45', '10:30', false),
  ('Period 4', 1, '10:30', '11:15', false),
  ('Lunch Break', 1, '11:15', '12:00', true),
  ('Period 5', 1, '12:00', '12:45', false),
  ('Period 6', 1, '12:45', '13:30', false),

  ('Period 1', 2, '08:00', '08:45', false),
  ('Period 2', 2, '08:45', '09:30', false),
  ('Morning Break', 2, '09:30', '09:45', true),
  ('Period 3', 2, '09:45', '10:30', false),
  ('Period 4', 2, '10:30', '11:15', false),
  ('Lunch Break', 2, '11:15', '12:00', true),
  ('Period 5', 2, '12:00', '12:45', false),
  ('Period 6', 2, '12:45', '13:30', false),

  ('Period 1', 3, '08:00', '08:45', false),
  ('Period 2', 3, '08:45', '09:30', false),
  ('Morning Break', 3, '09:30', '09:45', true),
  ('Period 3', 3, '09:45', '10:30', false),
  ('Period 4', 3, '10:30', '11:15', false),
  ('Lunch Break', 3, '11:15', '12:00', true),
  ('Period 5', 3, '12:00', '12:45', false),
  ('Period 6', 3, '12:45', '13:30', false),

  ('Period 1', 4, '08:00', '08:45', false),
  ('Period 2', 4, '08:45', '09:30', false),
  ('Morning Break', 4, '09:30', '09:45', true),
  ('Period 3', 4, '09:45', '10:30', false),
  ('Period 4', 4, '10:30', '11:15', false),
  ('Lunch Break', 4, '11:15', '12:00', true),
  ('Period 5', 4, '12:00', '12:45', false),
  ('Period 6', 4, '12:45', '13:30', false),

  ('Period 1', 5, '08:00', '08:45', false),
  ('Period 2', 5, '08:45', '09:30', false),
  ('Morning Break', 5, '09:30', '09:45', true),
  ('Period 3', 5, '09:45', '10:30', false),
  ('Period 4', 5, '10:30', '11:15', false),
  ('Lunch Break', 5, '11:15', '12:00', true),
  ('Period 5', 5, '12:00', '12:45', false),
  ('Period 6', 5, '12:45', '13:30', false)
on conflict do nothing;
