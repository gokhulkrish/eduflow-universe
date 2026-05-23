
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS roll_number text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS grade text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS section text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS stream text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS academic_year text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS fee_status text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS attendance_percent numeric;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS enrollment_status text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS guardian_name text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS guardian_occupation text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS guardian_email text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS guardian_annual_income numeric;

ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS grade_label text;

DROP VIEW IF EXISTS public.student_register;
CREATE VIEW public.student_register
WITH (security_invoker = true)
AS SELECT s.*, s.id AS student_id FROM public.students s;
GRANT SELECT ON public.student_register TO authenticated, anon;
