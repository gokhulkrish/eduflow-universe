-- Ensure RBAC tables are published to Supabase Realtime so permission changes
-- propagate to connected clients.
do $$
declare
  publication_exists boolean;
begin
  select exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) into publication_exists;

  if publication_exists then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'permissions'
    ) then
      execute 'alter publication supabase_realtime add table public.permissions';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'role_permissions'
    ) then
      execute 'alter publication supabase_realtime add table public.role_permissions';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'user_roles'
    ) then
      execute 'alter publication supabase_realtime add table public.user_roles';
    end if;
  end if;
end $$;
