
-- class_levels
ALTER TABLE public.class_levels ADD COLUMN IF NOT EXISTS label text;

-- fee_structures
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS institution_id uuid;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS fee_category_id uuid REFERENCES public.fee_categories(id);
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS class_level_id uuid REFERENCES public.class_levels(id);
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.fee_structures ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb;

-- fee_payments
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS institution_id uuid;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS student_id uuid;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS academic_year_id uuid;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS fee_category_id uuid;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS amount_paid numeric;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS payment_date timestamptz;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS transaction_reference text;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS receipt_no text;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed';
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- exam_schedules: legacy aliases
ALTER TABLE public.exam_schedules ADD COLUMN IF NOT EXISTS grade text;
ALTER TABLE public.exam_schedules ADD COLUMN IF NOT EXISTS section text;
ALTER TABLE public.exam_schedules ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.exam_schedules ADD COLUMN IF NOT EXISTS max_marks numeric;
ALTER TABLE public.exam_schedules ADD COLUMN IF NOT EXISTS pass_marks numeric;
ALTER TABLE public.exam_schedules ADD COLUMN IF NOT EXISTS date date;
ALTER TABLE public.exam_schedules ADD COLUMN IF NOT EXISTS description text;

-- exam_marks: additional fields
ALTER TABLE public.exam_marks ADD COLUMN IF NOT EXISTS grade text;
ALTER TABLE public.exam_marks ADD COLUMN IF NOT EXISTS moderated_by uuid;
ALTER TABLE public.exam_marks ADD COLUMN IF NOT EXISTS moderated_at timestamptz;

-- certificate_templates
ALTER TABLE public.certificate_templates ADD COLUMN IF NOT EXISTS template_html text;
ALTER TABLE public.certificate_templates ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.certificate_templates ADD COLUMN IF NOT EXISTS institution_id uuid;

-- certificate_requests
ALTER TABLE public.certificate_requests ADD COLUMN IF NOT EXISTS comments text;
