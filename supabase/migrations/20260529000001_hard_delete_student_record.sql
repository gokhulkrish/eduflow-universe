create or replace function public.hard_delete_student_record(student_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_admin(auth.uid()) then
    raise exception using
      errcode = '42501',
      message = 'Only administrators can permanently delete student records.';
  end if;

  delete from public.students
  where id = student_id;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'Student record not found.';
  end if;
end;
$$;

grant execute on function public.hard_delete_student_record(uuid) to authenticated;
