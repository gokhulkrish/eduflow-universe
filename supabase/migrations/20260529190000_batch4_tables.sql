create table if not exists public.comms_automation (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  trigger_event text default '',
  trigger_params jsonb default '{}',
  action_action text default '',
  action_params jsonb default '{}',
  active boolean default true,
  run_count integer default 0,
  last_run text default '',
  created_at timestamptz not null default now()
);
create table if not exists public.comms_class_wall (
  id uuid primary key default gen_random_uuid(),
  class_id text default '',
  class_name text default '',
  title text default '',
  body text not null,
  author text default '',
  priority text default 'normal',
  pinned boolean default false,
  attachments jsonb default '[]',
  broadcast_to_comms boolean default false,
  created_at timestamptz not null default now()
);
create table if not exists public.comms_feedback (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  questions jsonb default '[]',
  audience text default '',
  channel text default 'email',
  status text default 'draft',
  response_count integer default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.comms_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  priority text default 'normal',
  pinned boolean default false,
  audience text default '',
  schedule text default '',
  status text default 'published',
  attachments jsonb default '[]',
  created_at timestamptz not null default now()
);
alter publication supabase_realtime add table public.comms_automation;
alter publication supabase_realtime add table public.comms_class_wall;
alter publication supabase_realtime add table public.comms_feedback;
alter publication supabase_realtime add table public.comms_notices;
