
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS meta jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS created_by uuid;

CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TABLE IF NOT EXISTS public.institutions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, code text, meta jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.class_levels (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, code text, sort_order int DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.hostels (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, type text, capacity int, warden text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.admissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), application_no text UNIQUE NOT NULL, full_name text NOT NULL, email text, phone text, dob date, gender text, academic_year text, applied_grade text, status text NOT NULL DEFAULT 'new', documents_status text DEFAULT 'pending', merit_score numeric, meta jsonb NOT NULL DEFAULT '{}'::jsonb, applied_at timestamptz NOT NULL DEFAULT now(), created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.fee_categories (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, code text, description text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.fee_concessions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), invoice_id uuid, student_id uuid, amount numeric NOT NULL DEFAULT 0, reason text, approved_by uuid, type text NOT NULL DEFAULT 'discount', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.fee_reminders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid, sent_at timestamptz NOT NULL DEFAULT now(), channel text NOT NULL DEFAULT 'email', invoice_ids text[] NOT NULL DEFAULT '{}', total_due numeric NOT NULL DEFAULT 0, sent_by uuid, status text NOT NULL DEFAULT 'sent');
CREATE TABLE IF NOT EXISTS public.assignments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, description text, subject_id uuid, class_id uuid, due_date date, max_marks numeric DEFAULT 100, status text NOT NULL DEFAULT 'draft', created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.submissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE, student_id uuid, content text, file_url text, submitted_at timestamptz, status text NOT NULL DEFAULT 'submitted', marks numeric, feedback text, graded_by uuid, graded_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.exam_schedules (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, subject_id uuid, class_id uuid, exam_type text DEFAULT 'midterm', exam_date date, start_time time, end_time time, total_marks numeric DEFAULT 100, passing_marks numeric DEFAULT 35, status text NOT NULL DEFAULT 'draft', room text, instructions text, created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.exam_marks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), exam_id uuid REFERENCES public.exam_schedules(id) ON DELETE CASCADE, student_id uuid, marks_obtained numeric, status text NOT NULL DEFAULT 'pending', remarks text, entered_by uuid, approved_by uuid, approved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.question_banks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), subject_id uuid, question_text text NOT NULL, question_type text DEFAULT 'mcq', difficulty text DEFAULT 'medium', options jsonb NOT NULL DEFAULT '[]'::jsonb, correct_answer text, marks numeric DEFAULT 1, tags text[] DEFAULT '{}', created_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.result_publications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), exam_id uuid REFERENCES public.exam_schedules(id) ON DELETE CASCADE, published_by uuid, published_at timestamptz, status text NOT NULL DEFAULT 'draft', visibility text DEFAULT 'internal', notes text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.transcripts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid, academic_year_id uuid, status text NOT NULL DEFAULT 'draft', body jsonb NOT NULL DEFAULT '{}'::jsonb, issued_at timestamptz, certificate_no text, created_by uuid, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.certificates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), request_id uuid, student_id uuid, certificate_no text, issued_on timestamptz NOT NULL DEFAULT now(), issued_by uuid, verification_code text, qr_token text, status text NOT NULL DEFAULT 'issued', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.chat_threads (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, type text NOT NULL DEFAULT 'direct', meta jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.chat_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE, sender_id uuid, message text NOT NULL, attachments jsonb NOT NULL DEFAULT '[]'::jsonb, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.thread_participants (thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE, user_id uuid NOT NULL, role text DEFAULT 'member', last_read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (thread_id, user_id));
CREATE TABLE IF NOT EXISTS public.notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, title text NOT NULL, body text, type text DEFAULT 'info', link text, is_read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.leave_types (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, code text, days_per_year int DEFAULT 0, carry_forward boolean DEFAULT false, requires_approval boolean DEFAULT true, active boolean DEFAULT true, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.leave_balances (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), staff_id uuid, leave_type_id uuid, year int NOT NULL DEFAULT EXTRACT(year FROM now())::int, total_days numeric DEFAULT 0, used_days numeric DEFAULT 0, carried_days numeric DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.leave_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), staff_id uuid, leave_type_id uuid, start_date date NOT NULL, end_date date NOT NULL, days numeric NOT NULL DEFAULT 1, reason text, status text NOT NULL DEFAULT 'pending', approved_by uuid, approved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.payroll_runs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, period_start date NOT NULL, period_end date NOT NULL, payment_date date, status text NOT NULL DEFAULT 'draft', total_amount numeric NOT NULL DEFAULT 0, employee_count int NOT NULL DEFAULT 0, processed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.appraisals (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), staff_id uuid, reviewer_id uuid, review_period text NOT NULL, overall_rating numeric, comments text, status text NOT NULL DEFAULT 'draft', submitted_at timestamptz, completed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.job_openings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, department text, location text, type text DEFAULT 'full_time', status text NOT NULL DEFAULT 'open', posted_at timestamptz NOT NULL DEFAULT now(), closes_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.candidates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), job_opening_id uuid REFERENCES public.job_openings(id) ON DELETE CASCADE, name text NOT NULL, email text, phone text, status text NOT NULL DEFAULT 'applied', applied_at timestamptz NOT NULL DEFAULT now(), notes text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.time_slots (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, day_of_week int NOT NULL DEFAULT 1, start_time time NOT NULL, end_time time NOT NULL, is_break boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.timetable_entries (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), class_id uuid, subject_id uuid, teacher_id uuid, time_slot_id uuid REFERENCES public.time_slots(id) ON DELETE CASCADE, day_of_week int NOT NULL DEFAULT 1, academic_year_id uuid, room text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.substitutions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), timetable_entry_id uuid REFERENCES public.timetable_entries(id) ON DELETE CASCADE, original_teacher_id uuid, substitute_teacher_id uuid, date date NOT NULL, reason text, status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS public.library_issues (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), book_id uuid, student_id uuid, issued_at timestamptz NOT NULL DEFAULT now(), due_at timestamptz, returned_at timestamptz, status text NOT NULL DEFAULT 'issued', fine numeric DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'institutions','class_levels','hostels','admissions',
    'fee_categories','fee_concessions','fee_reminders',
    'assignments','submissions','exam_schedules','exam_marks',
    'question_banks','result_publications','transcripts','certificates',
    'chat_threads','chat_messages','thread_participants',
    'leave_types','leave_balances','leave_requests',
    'payroll_runs','appraisals','job_openings','candidates',
    'time_slots','timetable_entries','substitutions','library_issues'
  ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "auth_read_%1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "auth_read_%1$s" ON public.%1$I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('DROP POLICY IF EXISTS "staff_write_%1$s" ON public.%1$I', t);
    EXECUTE format('CREATE POLICY "staff_write_%1$s" ON public.%1$I FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))', t);
  END LOOP;
END $$;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notif_own_select" ON public.notifications;
CREATE POLICY "notif_own_select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
DROP POLICY IF EXISTS "notif_own_update" ON public.notifications;
CREATE POLICY "notif_own_update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "notif_staff_insert" ON public.notifications;
CREATE POLICY "notif_staff_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) OR user_id = auth.uid());

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'institutions','admissions','fee_concessions','assignments',
    'exam_schedules','exam_marks','question_banks','result_publications',
    'timetable_entries'
  ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at()', t);
  END LOOP;
END $$;
