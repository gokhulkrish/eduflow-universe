-- Seed the remaining global route access keys so the app-wide RBAC gate can
-- evaluate every shell route consistently.
insert into public.permissions (module_key, action, label) values
  ('accounts', 'view', 'View Accounts'),
  ('activity-log', 'view', 'View Activity Log'),
  ('class-mgmt', 'view', 'View Class Management'),
  ('class-wall', 'view', 'View Class Wall'),
  ('discipline', 'view', 'View Discipline'),
  ('holidays', 'view', 'View Holidays'),
  ('leave-master', 'view', 'View Leave Master'),
  ('lessons', 'view', 'View Lessons'),
  ('notice-board', 'view', 'View Notice Board'),
  ('subjects', 'view', 'View Subjects'),
  ('telephone', 'view', 'View Telephone')
on conflict do nothing;

insert into public.role_permissions (role, permission_id, level)
select
  rr.app_role,
  p.id,
  public.default_role_permission_level(rr.app_role, p.module_key)
from public.permissions p
cross join unnest(enum_range(null::public.app_role)) as rr(app_role)
where p.module_key in (
  'accounts',
  'activity-log',
  'class-mgmt',
  'class-wall',
  'discipline',
  'holidays',
  'leave-master',
  'lessons',
  'notice-board',
  'subjects',
  'telephone'
)
on conflict (role, permission_id) do nothing;
