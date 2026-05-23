
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.certificate_templates ALTER COLUMN body DROP NOT NULL;
ALTER TABLE public.certificate_templates ALTER COLUMN code DROP NOT NULL;

ALTER TABLE public.hostel_rooms ADD COLUMN IF NOT EXISTS hostel_id uuid REFERENCES public.hostels(id);
ALTER TABLE public.hostel_rooms ADD COLUMN IF NOT EXISTS room_number text;

ALTER TABLE public.transport_routes ADD COLUMN IF NOT EXISTS route_name text;

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS umis_id text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS emis_id text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS first_graduate boolean DEFAULT false;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS scholarship_notes text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS income_verification_status text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS guardian_id uuid;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS enrollment_id uuid;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS display_name text;

CREATE OR REPLACE VIEW public.student_register AS
  SELECT s.*, s.id AS student_id FROM public.students s;
GRANT SELECT ON public.student_register TO authenticated, anon;
