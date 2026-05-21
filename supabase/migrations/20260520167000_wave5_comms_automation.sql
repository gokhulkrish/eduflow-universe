-- Wave 5: Communications & Automation.
-- Defines schemas for Realtime Chat, Notification Center, and Automation Rules.

-- 1. Chat Threads
create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  title text,
  type text not null default 'direct', -- 'direct', 'channel', 'group'
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Thread Participants
create table if not exists public.thread_participants (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (thread_id, user_id)
);

-- 3. Chat Messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'alert', -- 'alert', 'email', 'sms', 'push'
  is_read boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Automation Rules
create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  event_trigger text not null, -- 'attendance_marked', 'fee_overdue', 'exam_published'
  conditions jsonb not null default '{}'::jsonb,
  actions jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, name)
);

-- Indexes
create index if not exists thread_participants_user_idx on public.thread_participants(user_id);
create index if not exists chat_messages_thread_time_idx on public.chat_messages(thread_id, created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications(user_id, is_read) where not is_read;
create index if not exists automation_rules_trigger_idx on public.automation_rules(institution_id, event_trigger) where is_active;

-- Enable Row Level Security (RLS)
alter table public.chat_threads enable row level security;
alter table public.thread_participants enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.automation_rules enable row level security;

-- Drop existing policies if any
drop policy if exists "chat_threads select policy" on public.chat_threads;
drop policy if exists "chat_threads insert policy" on public.chat_threads;
drop policy if exists "chat_threads update policy" on public.chat_threads;

drop policy if exists "thread_participants select policy" on public.thread_participants;
drop policy if exists "thread_participants insert policy" on public.thread_participants;
drop policy if exists "thread_participants delete policy" on public.thread_participants;

drop policy if exists "chat_messages select policy" on public.chat_messages;
drop policy if exists "chat_messages insert policy" on public.chat_messages;
drop policy if exists "chat_messages update policy" on public.chat_messages;

drop policy if exists "notifications select policy" on public.notifications;
drop policy if exists "notifications insert policy" on public.notifications;
drop policy if exists "notifications update policy" on public.notifications;

drop policy if exists "automation_rules manage policy" on public.automation_rules;
drop policy if exists "automation_rules select policy" on public.automation_rules;

-- Chat Threads Policies
create policy "chat_threads select policy" on public.chat_threads
  for select to authenticated
  using (
    exists (
      select 1 from public.thread_participants
      where thread_id = id and user_id = auth.uid()
    ) or public.can_manage_people_academics(auth.uid())
  );

create policy "chat_threads insert policy" on public.chat_threads
  for insert to authenticated
  with check (true);

create policy "chat_threads update policy" on public.chat_threads
  for update to authenticated
  using (
    exists (
      select 1 from public.thread_participants
      where thread_id = id and user_id = auth.uid()
    ) or public.can_manage_people_academics(auth.uid())
  )
  with check (true);

-- Thread Participants Policies
create policy "thread_participants select policy" on public.thread_participants
  for select to authenticated
  using (
    exists (
      select 1 from public.thread_participants tp
      where tp.thread_id = thread_id and tp.user_id = auth.uid()
    ) or public.can_manage_people_academics(auth.uid())
  );

create policy "thread_participants insert policy" on public.thread_participants
  for insert to authenticated
  with check (true);

create policy "thread_participants delete policy" on public.thread_participants
  for delete to authenticated
  using (
    user_id = auth.uid() or public.can_manage_people_academics(auth.uid())
  );

-- Chat Messages Policies
create policy "chat_messages select policy" on public.chat_messages
  for select to authenticated
  using (
    exists (
      select 1 from public.thread_participants
      where thread_id = chat_messages.thread_id and user_id = auth.uid()
    ) or public.can_manage_people_academics(auth.uid())
  );

create policy "chat_messages insert policy" on public.chat_messages
  for insert to authenticated
  with check (
    exists (
      select 1 from public.thread_participants
      where thread_id = chat_messages.thread_id and user_id = auth.uid()
    ) and sender_id = auth.uid()
  );

create policy "chat_messages update policy" on public.chat_messages
  for update to authenticated
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());

-- Notifications Policies
create policy "notifications select policy" on public.notifications
  for select to authenticated
  using (user_id = auth.uid() or public.can_manage_people_academics(auth.uid()));

create policy "notifications insert policy" on public.notifications
  for insert to authenticated
  with check (true);

create policy "notifications update policy" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Automation Rules Policies
create policy "automation_rules manage policy" on public.automation_rules
  for all to authenticated
  using (public.can_manage_people_academics(auth.uid()))
  with check (public.can_manage_people_academics(auth.uid()));

create policy "automation_rules select policy" on public.automation_rules
  for select to authenticated
  using (true);

-- Triggers for updated_at
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'chat_threads','chat_messages','notifications','automation_rules'
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
  ('chat', 'view', 'View Class Channels & DMs'),
  ('chat', 'create', 'Send Chat Messages'),
  ('chat', 'edit', 'Moderate Class Channels'),
  ('notifications', 'view', 'View and Read Notifications'),
  ('notifications', 'create', 'Broadcast notifications & Campaigns'),
  ('automation', 'manage', 'Configure Automation Triggers & Rules')
on conflict do nothing;
