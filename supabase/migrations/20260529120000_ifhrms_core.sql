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
INSERT INTO permissions (key, label, description, category, module_key)
SELECT * FROM (VALUES
  ('ifhrms.view', 'View IFHRMS', 'Access the IFHRMS module', 'ifhrms', 'ifhrms'),
  ('ifhrms.edit', 'Edit IFHRMS', 'Create and modify IFHRMS records', 'ifhrms', 'ifhrms'),
  ('ifhrms.payroll', 'Manage Payroll', 'Process payroll runs', 'ifhrms', 'ifhrms'),
  ('ifhrms.leave', 'Manage Leave', 'Approve and manage leave', 'ifhrms', 'ifhrms'),
  ('ifhrms.appraisal', 'Manage Appraisals', 'Create and complete appraisals', 'ifhrms', 'ifhrms'),
  ('ifhrms.recruit', 'Manage Recruitment', 'Manage job openings and candidates', 'ifhrms', 'ifhrms')
) AS v(key, label, description, category, module_key)
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE key = v.key);
