-- Backfill default role_permissions rows so the RBAC matrix is populated from day one.
-- Existing custom rows are preserved.

create or replace function public.default_role_permission_level(_role public.app_role, _module_key text)
returns public.access_level
language plpgsql
stable
as $$
declare
  hod_manage_modules text[] := array[
    'students', 'academics', 'admissions', 'attendance', 'exams', 'timetable',
    'assignments', 'homework', 'quiz', 'courseInfo', 'collegeInfo', 'communication',
    'chat', 'events', 'notifications', 'media', 'placement', 'alumni', 'reports',
    'reportsAnalytics', 'documents', 'observation', 'health', 'grievances', 'videoRooms'
  ];
  faculty_manage_modules text[] := array[
    'attendance', 'exams', 'timetable', 'assignments', 'homework', 'quiz'
  ];
  staff_manage_modules text[] := array[
    'administration', 'people', 'reception', 'tasks', 'inventory', 'communication',
    'chat', 'events', 'notifications', 'media', 'documents', 'observation', 'health',
    'grievances'
  ];
  finance_manage_modules text[] := array[
    'fees', 'scholarships', 'payroll', 'reports', 'reportsAnalytics'
  ];
  scholarship_manage_modules text[] := array[
    'scholarships', 'certificates', 'documents', 'reports'
  ];
  certificate_manage_modules text[] := array[
    'certificates', 'documents', 'reports'
  ];
  librarian_manage_modules text[] := array[
    'library', 'documents', 'media'
  ];
  hostel_manage_modules text[] := array[
    'hostel', 'documents', 'reports'
  ];
  transport_manage_modules text[] := array[
    'transport', 'documents', 'reports'
  ];
  student_view_modules text[] := array[
    'students', 'admissions', 'attendance', 'exams', 'timetable', 'assignments',
    'homework', 'quiz', 'fees', 'scholarships', 'certificates', 'reports', 'library',
    'hostel', 'transport', 'communication', 'chat', 'events', 'notifications',
    'media', 'documents', 'courseInfo', 'collegeInfo', 'placement', 'alumni',
    'videoRooms', 'parents'
  ];
begin
  if _role in ('super_admin', 'admin', 'principal') then
    return 'manage';
  end if;

  if _role = 'hod' then
    if _module_key = any(hod_manage_modules) then return 'manage'; end if;
    return 'view';
  end if;

  if _role = 'faculty' then
    if _module_key = any(faculty_manage_modules) then return 'edit'; end if;
    return 'view';
  end if;

  if _role = 'staff' then
    if _module_key = any(staff_manage_modules) then return 'manage'; end if;
    return 'view';
  end if;

  if _role = 'finance' then
    if _module_key = any(finance_manage_modules) then return 'manage'; end if;
    return 'view';
  end if;

  if _role = 'scholarship' then
    if _module_key = any(scholarship_manage_modules) then return 'manage'; end if;
    return 'view';
  end if;

  if _role = 'certificate' then
    if _module_key = any(certificate_manage_modules) then return 'manage'; end if;
    return 'view';
  end if;

  if _role = 'librarian' then
    if _module_key = any(librarian_manage_modules) then return 'manage'; end if;
    return 'view';
  end if;

  if _role = 'hostel_warden' then
    if _module_key = any(hostel_manage_modules) then return 'manage'; end if;
    return 'view';
  end if;

  if _role = 'transport' then
    if _module_key = any(transport_manage_modules) then return 'manage'; end if;
    return 'view';
  end if;

  if _role in ('student', 'parent') then
    if _module_key = any(student_view_modules) then return 'view'; end if;
    return 'none';
  end if;

  return 'none';
end;
$$;

insert into public.role_permissions (role, permission_id, level)
select
  r.role,
  p.id,
  public.default_role_permission_level(r.role, p.module_key)
from public.permissions p
cross join (
  values
    ('super_admin'::public.app_role),
    ('admin'::public.app_role),
    ('principal'::public.app_role),
    ('hod'::public.app_role),
    ('faculty'::public.app_role),
    ('staff'::public.app_role),
    ('finance'::public.app_role),
    ('scholarship'::public.app_role),
    ('certificate'::public.app_role),
    ('librarian'::public.app_role),
    ('hostel_warden'::public.app_role),
    ('transport'::public.app_role),
    ('student'::public.app_role),
    ('parent'::public.app_role)
) as r(role)
on conflict (role, permission_id) do nothing;
