-- Fill the RBAC matrix with module-level permissions for every live module.
-- These entries ensure the permission console can represent each module at least once.
insert into public.permissions (module_key, action, label) values
  ('administration', 'view', 'View Administration'),
  ('alumni', 'view', 'View Alumni'),
  ('collegeInfo', 'view', 'View College Info'),
  ('communication', 'view', 'View Communication'),
  ('courseInfo', 'view', 'View Course Info'),
  ('events', 'view', 'View Events'),
  ('homework', 'view', 'View Homework'),
  ('inventory', 'view', 'View Inventory'),
  ('media', 'view', 'View Media'),
  ('payroll', 'view', 'View Payroll'),
  ('placement', 'view', 'View Placement'),
  ('quiz', 'view', 'View Quiz'),
  ('reception', 'view', 'View Reception'),
  ('reportsAnalytics', 'view', 'View Reports Analytics'),
  ('settingsBackup', 'view', 'View Settings Backup'),
  ('system', 'view', 'View System'),
  ('taskManagement', 'view', 'View Task Management'),
  ('userManagement', 'view', 'View User Management'),
  ('videoRooms', 'view', 'View Video Rooms')
on conflict do nothing;
