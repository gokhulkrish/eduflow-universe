-- Seed the remaining non-route system domains so the global RBAC registry can
-- represent administration, data, health, and platform domains alongside routes.
insert into public.permissions (module_key, action, label) values
  ('administration', 'view', 'View Administration'),
  ('communication', 'view', 'View Communication'),
  ('documents', 'view', 'View Documents'),
  ('health', 'view', 'View Health'),
  ('payroll', 'view', 'View Payroll'),
  ('people', 'view', 'View People'),
  ('reportsAnalytics', 'view', 'View Reports Analytics'),
  ('settingsBackup', 'view', 'View Settings Backup'),
  ('videoRooms', 'view', 'View Video Rooms')
on conflict do nothing;

insert into public.role_permissions (role, permission_id, level)
select
  rr.app_role,
  p.id,
  public.default_role_permission_level(rr.app_role, p.module_key)
from public.permissions p
cross join unnest(enum_range(null::public.app_role)) as rr(app_role)
where p.module_key in (
  'administration',
  'communication',
  'documents',
  'health',
  'payroll',
  'people',
  'reportsAnalytics',
  'settingsBackup',
  'videoRooms'
)
on conflict (role, permission_id) do nothing;
