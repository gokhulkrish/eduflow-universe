-- Patch 1: Batch Import Engine Tables
-- Adds server-side batch import storage alongside client-side IndexedDB store

CREATE TABLE IF NOT EXISTS public.import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name TEXT NOT NULL,
  batch_description TEXT,
  module_id TEXT NOT NULL DEFAULT 'students',
  mode TEXT NOT NULL DEFAULT 'hybrid',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'validated', 'ready_to_apply', 'applied', 'archived')),
  match_strategy TEXT,
  row_count INTEGER DEFAULT 0,
  valid_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  inserted_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  applied_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.import_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  sheet_name TEXT,
  file_size INTEGER,
  storage_path TEXT,
  headers JSONB DEFAULT '[]',
  row_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.import_files(id) ON DELETE SET NULL,
  row_number INTEGER NOT NULL,
  source_data JSONB NOT NULL DEFAULT '{}',
  target_data JSONB DEFAULT '{}',
  decision TEXT DEFAULT 'review'
    CHECK (decision IN ('insert', 'update', 'skip', 'review')),
  match_status TEXT
    CHECK (match_status IN ('exact', 'fuzzy', 'none', 'internal-duplicate')),
  match_score REAL,
  matched_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.import_row_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  row_id UUID NOT NULL REFERENCES public.import_rows(id) ON DELETE CASCADE,
  field TEXT,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'error'
    CHECK (severity IN ('error', 'warning', 'blocker')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON public.import_batches(status);
CREATE INDEX IF NOT EXISTS idx_import_batches_created_by ON public.import_batches(created_by);
CREATE INDEX IF NOT EXISTS idx_import_files_batch_id ON public.import_files(batch_id);
CREATE INDEX IF NOT EXISTS idx_import_rows_batch_id ON public.import_rows(batch_id);
CREATE INDEX IF NOT EXISTS idx_import_rows_matched_student ON public.import_rows(matched_student_id);
CREATE INDEX IF NOT EXISTS idx_import_row_errors_row_id ON public.import_row_errors(row_id);

-- Enable RLS
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_row_errors ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own import batches"
  ON public.import_batches FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert own import batches"
  ON public.import_batches FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own import batches"
  ON public.import_batches FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own import batches"
  ON public.import_batches FOR DELETE
  USING (created_by = auth.uid());

CREATE POLICY "Users can view files in own batches"
  ON public.import_files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.import_batches WHERE id = batch_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can insert files in own batches"
  ON public.import_files FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.import_batches WHERE id = batch_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can view rows in own batches"
  ON public.import_rows FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.import_batches WHERE id = batch_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can insert rows in own batches"
  ON public.import_rows FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.import_batches WHERE id = batch_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can view errors in own batch rows"
  ON public.import_row_errors FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.import_rows r
    JOIN public.import_batches b ON b.id = r.batch_id
    WHERE r.id = row_id AND b.created_by = auth.uid()
  ));
