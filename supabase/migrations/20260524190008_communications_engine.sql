-- Patch 09: Communications Engine Migration (Corrected, Strict Upgrade-Only)

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  name text not null,
  code text not null,
  channel text not null check (channel in ('sms','email','push','notice')),
  subject text,
  body text not null,
  variables text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (institution_id, code)
);

-- Add columns if table already existed with legacy schema
alter table public.message_templates add column if not exists code text;
alter table public.message_templates add column if not exists channel text;
alter table public.message_templates add column if not exists is_active boolean not null default true;
alter table public.message_templates add column if not exists deleted_at timestamptz;

alter table public.message_templates enable row level security;
create policy "message_templates_select" on public.message_templates for select to authenticated using (true);
create policy "message_templates_insert" on public.message_templates for insert to authenticated with check (true);
create policy "message_templates_update" on public.message_templates for update to authenticated using (true);
drop trigger if exists trg_message_templates_updated_at on public.message_templates;
create trigger trg_message_templates_updated_at before update on public.message_templates
  for each row execute function public.update_updated_at_column();

create table if not exists public.message_campaigns (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  name text not null,
  template_id uuid not null references public.message_templates(id) on delete restrict,
  audience_query jsonb not null,
  status text not null default 'draft' check (status in ('draft','queued','sending','completed','failed','partial')),
  scheduled_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add columns if table already existed with legacy schema
alter table public.message_campaigns add column if not exists institution_id uuid;
alter table public.message_campaigns add column if not exists audience_query jsonb;

alter table public.message_campaigns enable row level security;
create policy "message_campaigns_select" on public.message_campaigns for select to authenticated using (true);
create policy "message_campaigns_insert" on public.message_campaigns for insert to authenticated with check (true);
create policy "message_campaigns_update" on public.message_campaigns for update to authenticated using (true);
drop trigger if exists trg_message_campaigns_updated_at on public.message_campaigns;
create trigger trg_message_campaigns_updated_at before update on public.message_campaigns
  for each row execute function public.update_updated_at_column();

create table if not exists public.message_queue (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  campaign_id uuid references public.message_campaigns(id) on delete set null,
  template_id uuid references public.message_templates(id) on delete set null,
  channel text not null check (channel in ('sms','email','push','notice')),
  to_address text not null,
  payload jsonb not null,
  status text not null default 'queued' check (status in ('queued','processing','sent','failed','acknowledged')),
  attempts integer not null default 0,
  last_error text,
  scheduled_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.message_queue enable row level security;
create policy "message_queue_select" on public.message_queue for select to authenticated using (true);
create policy "message_queue_insert" on public.message_queue for insert to authenticated with check (true);
create policy "message_queue_update" on public.message_queue for update to authenticated using (true);
drop trigger if exists trg_message_queue_updated_at on public.message_queue;
create trigger trg_message_queue_updated_at before update on public.message_queue
  for each row execute function public.update_updated_at_column();

create table if not exists public.message_logs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  queue_id uuid references public.message_queue(id) on delete set null,
  campaign_id uuid references public.message_campaigns(id) on delete set null,
  template_id uuid references public.message_templates(id) on delete set null,
  channel text not null,
  to_address text not null,
  payload jsonb not null,
  status text not null check (status in ('queued','sent','failed','acknowledged')),
  error_message text,
  created_at timestamptz not null default now()
);

-- Add columns if table already existed with legacy schema
alter table public.message_logs add column if not exists institution_id uuid;
alter table public.message_logs add column if not exists queue_id uuid;
alter table public.message_logs add column if not exists channel text;
alter table public.message_logs add column if not exists to_address text;
alter table public.message_logs add column if not exists payload jsonb;
alter table public.message_logs add column if not exists error_message text;

alter table public.message_logs enable row level security;
create policy "message_logs_select" on public.message_logs for select to authenticated using (true);
create policy "message_logs_insert" on public.message_logs for insert to authenticated with check (true);
