-- Patch continuation: Promotion engine tables

CREATE TABLE IF NOT EXISTS public.promotion_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  from_grade TEXT NOT NULL,
  to_grade TEXT NOT NULL,
  from_section TEXT,
  to_section TEXT,
  min_attendance REAL NOT NULL DEFAULT 75,
  min_gpa REAL NOT NULL DEFAULT 2.0,
  auto_promote BOOLEAN NOT NULL DEFAULT false,
  reset_roll BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  academic_year_id UUID REFERENCES public.academic_years(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promotion_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.promotion_rules(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  promoted INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'rolled_back')),
  run_by UUID REFERENCES auth.users(id),
  run_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.promotion_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.promotion_runs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id),
  from_grade TEXT NOT NULL,
  to_grade TEXT NOT NULL,
  from_section TEXT,
  to_section TEXT,
  attendance_percent REAL,
  gpa REAL,
  eligible BOOLEAN NOT NULL DEFAULT false,
  promoted BOOLEAN NOT NULL DEFAULT false,
  reasons JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promotion_rules_from_grade ON public.promotion_rules(from_grade);
CREATE INDEX IF NOT EXISTS idx_promotion_runs_rule ON public.promotion_runs(rule_id);
CREATE INDEX IF NOT EXISTS idx_promotion_results_run ON public.promotion_results(run_id);
CREATE INDEX IF NOT EXISTS idx_promotion_results_student ON public.promotion_results(student_id);

-- RLS
ALTER TABLE public.promotion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view promotion rules"
  ON public.promotion_rules FOR SELECT USING (true);

CREATE POLICY "Users can manage promotion rules"
  ON public.promotion_rules FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own rules"
  ON public.promotion_rules FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own rules"
  ON public.promotion_rules FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "Users can view promotion runs"
  ON public.promotion_runs FOR SELECT USING (true);

CREATE POLICY "Users can insert promotion runs"
  ON public.promotion_runs FOR INSERT WITH CHECK (run_by = auth.uid());

CREATE POLICY "Users can view promotion results"
  ON public.promotion_results FOR SELECT USING (true);

CREATE POLICY "Users can insert promotion results"
  ON public.promotion_results FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.promotion_runs WHERE id = run_id AND run_by = auth.uid()
  ));
