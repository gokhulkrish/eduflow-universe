-- Fix recursive chat RLS policies that caused Supabase REST 500s on head/select probes.

create or replace function public.is_chat_thread_member(p_thread_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.thread_participants tp
    where tp.thread_id = p_thread_id
      and tp.user_id = p_user_id
  );
$$;

revoke all on function public.is_chat_thread_member(uuid, uuid) from public, anon;
grant execute on function public.is_chat_thread_member(uuid, uuid) to authenticated, service_role;

drop policy if exists "chat_threads select policy" on public.chat_threads;
drop policy if exists "chat_threads insert policy" on public.chat_threads;
drop policy if exists "chat_threads update policy" on public.chat_threads;

drop policy if exists "thread_participants select policy" on public.thread_participants;
drop policy if exists "thread_participants insert policy" on public.thread_participants;
drop policy if exists "thread_participants delete policy" on public.thread_participants;

drop policy if exists "chat_messages select policy" on public.chat_messages;
drop policy if exists "chat_messages insert policy" on public.chat_messages;
drop policy if exists "chat_messages update policy" on public.chat_messages;

create policy "chat_threads select policy" on public.chat_threads
  for select to authenticated
  using (
    public.is_chat_thread_member(id, auth.uid())
    or public.can_manage_people_academics(auth.uid())
  );

create policy "chat_threads insert policy" on public.chat_threads
  for insert to authenticated
  with check (true);

create policy "chat_threads update policy" on public.chat_threads
  for update to authenticated
  using (
    public.is_chat_thread_member(id, auth.uid())
    or public.can_manage_people_academics(auth.uid())
  )
  with check (true);

create policy "thread_participants select policy" on public.thread_participants
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.can_manage_people_academics(auth.uid())
  );

create policy "thread_participants insert policy" on public.thread_participants
  for insert to authenticated
  with check (true);

create policy "thread_participants delete policy" on public.thread_participants
  for delete to authenticated
  using (
    user_id = auth.uid()
    or public.can_manage_people_academics(auth.uid())
  );

create policy "chat_messages select policy" on public.chat_messages
  for select to authenticated
  using (
    public.is_chat_thread_member(thread_id, auth.uid())
    or public.can_manage_people_academics(auth.uid())
  );

create policy "chat_messages insert policy" on public.chat_messages
  for insert to authenticated
  with check (
    public.is_chat_thread_member(thread_id, auth.uid())
    and sender_id = auth.uid()
  );

create policy "chat_messages update policy" on public.chat_messages
  for update to authenticated
  using (sender_id = auth.uid())
  with check (sender_id = auth.uid());
