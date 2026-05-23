
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS section_label text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS roll_number text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS stream text;
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS class_level_id uuid REFERENCES public.class_levels(id);
