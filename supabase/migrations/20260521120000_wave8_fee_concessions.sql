
-- Wave 8: Fee Concessions & Enhanced Finance.
-- Adds concession tracking, discounting on invoices, reminder tracking.

create table if not exists public.fee_concessions (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.fee_invoices(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric(12,2) not null default 0,
  reason text not null default '',
  approved_by uuid references auth.users(id) on delete set null,
  type text not null default 'scholarship', -- 'scholarship', 'merit', 'need_based', 'staff', 'other'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.fee_concessions enable row level security;

create table if not exists public.fee_reminders (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  sent_at timestamptz not null default now(),
  channel text not null default 'email', -- 'email', 'sms', 'push'
  invoice_ids uuid[] not null default '{}',
  total_due numeric(12,2) not null default 0,
  sent_by uuid references auth.users(id) on delete set null,
  status text not null default 'sent' -- 'sent', 'failed', 'read'
);
alter table public.fee_reminders enable row level security;

-- Updated_at triggers
create trigger trg_fee_concessions_updated_at before update on public.fee_concessions
  for each row execute function public.update_updated_at_column();

-- RLS policies
create policy "fc read auth" on public.fee_concessions for select to authenticated using (true);
create policy "fc staff manage" on public.fee_concessions for insert to authenticated
  with check (public.is_staff(auth.uid()));
create policy "fc staff update" on public.fee_concessions for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "fc admin delete" on public.fee_concessions for delete to authenticated
  using (public.is_admin(auth.uid()));

create policy "fr read auth" on public.fee_reminders for select to authenticated using (true);
create policy "fr staff manage" on public.fee_reminders for insert to authenticated
  with check (public.is_staff(auth.uid()));
create policy "fr staff update" on public.fee_reminders for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- Additional permissions
insert into public.permissions(module_key, action, label) values
  ('fees','concession','Manage Concessions'),
  ('fees','remind','Send Fee Reminders')
on conflict do nothing;
