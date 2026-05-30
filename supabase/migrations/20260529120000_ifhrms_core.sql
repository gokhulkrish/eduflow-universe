-- IFHRMS: Integrated Financial & Human Resource Management
-- Extends existing HR tables with IFHRMS-specific columns

-- Add IFHRMS-specific columns to staff table
ALTER TABLE IF EXISTS staff ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS staff ADD COLUMN IF NOT EXISTS ifhrms_enrolled BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS staff ADD COLUMN IF NOT EXISTS ifhrms_enrolled_at TIMESTAMPTZ;

-- Create IFHRMS audit view for easier activity log queries
CREATE OR REPLACE VIEW ifhrms_activity AS
SELECT
  id,
  actor,
  action,
  entity,
  entity_id,
  metadata,
  created_at
FROM audit_log
WHERE entity = 'ifhrms'
ORDER BY created_at DESC;

-- Ensure RLS on staff table allows admin access
DROP POLICY IF EXISTS "staff_admin_all" ON staff;
CREATE POLICY "staff_admin_all" ON staff
  FOR ALL USING (auth.role() = 'authenticated');

-- Create IFHRMS permissions
INSERT INTO permissions (module_key, action, label)
SELECT module_key, action, label FROM (VALUES
  ('ifhrms'::text, 'view'::text, 'View IFHRMS'::text),
  ('ifhrms', 'edit', 'Edit IFHRMS'),
  ('ifhrms', 'payroll', 'Manage Payroll'),
  ('ifhrms', 'leave', 'Manage Leave'),
  ('ifhrms', 'appraisal', 'Manage Appraisals'),
  ('ifhrms', 'recruit', 'Manage Recruitment')
) AS v(module_key, action, label)
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE module_key = v.module_key AND action = v.action
);
