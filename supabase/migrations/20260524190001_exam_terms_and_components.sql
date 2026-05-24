-- Patch 01: Assessment Shell — exam_terms and exam_components
-- Adds structured term and component tables for exam organisation.

CREATE TABLE IF NOT EXISTS public.exam_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(institution_id, code)
);

CREATE TABLE IF NOT EXISTS public.exam_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  term_id UUID NOT NULL REFERENCES public.exam_terms(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  max_marks NUMERIC(6,2) NOT NULL,
  weight NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(term_id, subject_id, code)
);

CREATE INDEX IF NOT EXISTS idx_exam_terms_institution ON public.exam_terms(institution_id);
CREATE INDEX IF NOT EXISTS idx_exam_components_term ON public.exam_components(term_id);
CREATE INDEX IF NOT EXISTS idx_exam_components_subject ON public.exam_components(subject_id);

ALTER TABLE public.exam_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exam_terms_select" ON public.exam_terms FOR SELECT TO authenticated USING (true);
CREATE POLICY "exam_terms_insert" ON public.exam_terms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "exam_terms_update" ON public.exam_terms FOR UPDATE TO authenticated USING (true);
CREATE POLICY "exam_terms_delete" ON public.exam_terms FOR DELETE TO authenticated USING (true);

CREATE POLICY "exam_components_select" ON public.exam_components FOR SELECT TO authenticated USING (true);
CREATE POLICY "exam_components_insert" ON public.exam_components FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "exam_components_update" ON public.exam_components FOR UPDATE TO authenticated USING (true);
CREATE POLICY "exam_components_delete" ON public.exam_components FOR DELETE TO authenticated USING (true);

CREATE TRIGGER trg_exam_terms_updated_at BEFORE UPDATE ON public.exam_terms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_exam_components_updated_at BEFORE UPDATE ON public.exam_components
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
