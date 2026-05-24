-- Patch 02: Add template_version and schema_version to import_batches
ALTER TABLE public.import_batches
  ADD COLUMN IF NOT EXISTS template_version TEXT DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS schema_version TEXT DEFAULT 'v1';
