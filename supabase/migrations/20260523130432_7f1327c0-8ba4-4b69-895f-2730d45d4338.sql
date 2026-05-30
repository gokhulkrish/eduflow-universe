
ALTER TABLE public.certificate_templates ADD COLUMN IF NOT EXISTS variables jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS template_id uuid;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS content_snapshot text;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.question_banks ADD COLUMN IF NOT EXISTS grade text;
ALTER TABLE public.question_banks ADD COLUMN IF NOT EXISTS topic text;
ALTER TABLE public.question_banks ADD COLUMN IF NOT EXISTS explanation text;

ALTER TABLE public.result_publications ADD COLUMN IF NOT EXISTS notify_students boolean NOT NULL DEFAULT false;
ALTER TABLE public.result_publications ADD COLUMN IF NOT EXISTS notify_parents boolean NOT NULL DEFAULT false;

ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS academic_year text;
ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS exam_ids uuid[] DEFAULT '{}';
ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS total_marks numeric;
ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS obtained_marks numeric;
ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS percentage numeric;
ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS gpa numeric;
ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS qr_token text;

ALTER TABLE public.fee_categories ADD COLUMN IF NOT EXISTS institution_id uuid;
ALTER TABLE public.class_levels ADD COLUMN IF NOT EXISTS institution_id uuid;
ALTER TABLE public.academic_years ADD COLUMN IF NOT EXISTS institution_id uuid;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fee_payments' AND column_name = 'amount') THEN
    ALTER TABLE public.fee_payments ALTER COLUMN amount DROP NOT NULL;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fee_payments' AND column_name = 'invoice_id') THEN
    ALTER TABLE public.fee_payments ALTER COLUMN invoice_id DROP NOT NULL;
  END IF;
END $$;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fee_structures' AND column_name = 'name') THEN
    ALTER TABLE public.fee_structures ALTER COLUMN name DROP NOT NULL;
  END IF;
END $$;
