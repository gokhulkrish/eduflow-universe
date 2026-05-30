do $$
declare
  publication_exists boolean;
  tbl text;
  tables text[] := array[
    'events', 'event_rsvps', 'event_ticket_types', 'event_photos',
    'placement_companies', 'placement_registrations', 'interview_stages',
    'homework_assignments', 'video_rooms', 'quizzes',
    'admin_tasks', 'admin_notices', 'visitors', 'media_files',
    'inventory_items', 'alumni', 'classes', 'staff'
  ];
begin
  select exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) into publication_exists;

  if publication_exists then
    foreach tbl in array tables
    loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = tbl
      ) then
        execute format('alter publication supabase_realtime add table public.%I', tbl);
      end if;
    end loop;
  end if;
end $$;
