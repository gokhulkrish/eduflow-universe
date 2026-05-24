-- Patch 19: Communications, Notices, and Audit Messaging Parity (Corrected, Strict Upgrade-Only)

create table if not exists public.workspace_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  channel text not null check (channel in (
    'notice',
    'internal_note',
    'counselor_note',
    'principal_note',
    'parent_request',
    'subscription',
    'audit',
    'system_event'
  )),
  title text not null,
  body text not null,
  source_module text,
  source_workspace text,
  row_ids jsonb,
  created_by uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_workspace_messages_tenant_channel_created
  on public.workspace_messages (tenant_id, channel, created_at desc);

alter table public.workspace_messages enable row level security;

create policy "workspace_messages_select" on public.workspace_messages
  for select to authenticated using (true);

create policy "workspace_messages_insert" on public.workspace_messages
  for insert to authenticated with check (true);

create table if not exists public.workspace_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid,
  scope text not null,
  target_key text,
  enabled boolean not null default true,
  delivery text not null default 'in_app',
  meta jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id, scope, target_key)
);

create index if not exists idx_workspace_subscriptions_tenant_scope
  on public.workspace_subscriptions (tenant_id, scope, target_key);

alter table public.workspace_subscriptions enable row level security;

create policy "workspace_subscriptions_select" on public.workspace_subscriptions
  for select to authenticated using (true);

create policy "workspace_subscriptions_insert" on public.workspace_subscriptions
  for insert to authenticated with check (true);

create policy "workspace_subscriptions_update" on public.workspace_subscriptions
  for update to authenticated using (true);

create trigger trg_workspace_subscriptions_updated_at before update on public.workspace_subscriptions
  for each row execute function public.update_updated_at_column();

create table if not exists public.workspace_audit_trail (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid,
  action text not null,
  subject_type text,
  subject_id text,
  message_id uuid references public.workspace_messages(id) on delete set null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_workspace_audit_trail_tenant_created
  on public.workspace_audit_trail (tenant_id, created_at desc);

create index if not exists idx_workspace_audit_trail_subject
  on public.workspace_audit_trail (tenant_id, subject_type, subject_id, created_at desc);

alter table public.workspace_audit_trail enable row level security;

create policy "workspace_audit_trail_select" on public.workspace_audit_trail
  for select to authenticated using (true);

create policy "workspace_audit_trail_insert" on public.workspace_audit_trail
  for insert to authenticated with check (true);

