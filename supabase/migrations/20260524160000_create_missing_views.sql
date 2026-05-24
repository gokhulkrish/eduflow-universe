CREATE OR REPLACE VIEW public.student_register AS
SELECT
  s.id AS student_id,
  s.first_name || ' ' || s.last_name AS student_name,
  s.admission_no,
  s.class_id,
  c.name AS class_name,
  s.status,
  s.enrolled_at
FROM public.students s
LEFT JOIN public.classes c ON c.id = s.class_id;

CREATE OR REPLACE VIEW public.student_analytics_summary AS
SELECT
  s.id AS student_id,
  s.first_name || ' ' || s.last_name AS student_name,
  s.admission_no,
  s.class_id,
  c.name AS class_name,
  COALESCE(a.total_present, 0) AS total_present,
  COALESCE(a.total_absent, 0) AS total_absent,
  COALESCE(a.attendance_pct, 0) AS attendance_pct,
  COALESCE(f.total_fees, 0) AS total_fees,
  COALESCE(f.amount_paid, 0) AS amount_paid,
  COALESCE(f.due_amount, 0) AS due_amount
FROM public.students s
LEFT JOIN public.classes c ON c.id = s.class_id
LEFT JOIN (
  SELECT student_id,
    COUNT(*) FILTER (WHERE status = 'present') AS total_present,
    COUNT(*) FILTER (WHERE status = 'absent') AS total_absent,
    ROUND(COUNT(*) FILTER (WHERE status = 'present')::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS attendance_pct
  FROM public.attendance
  GROUP BY student_id
) a ON a.student_id = s.id
LEFT JOIN (
  SELECT student_id,
    SUM(amount) AS total_fees,
    SUM(amount_paid) AS amount_paid,
    SUM(amount) - SUM(amount_paid) AS due_amount
  FROM public.fee_invoices
  GROUP BY student_id
) f ON f.student_id = s.id;

CREATE OR REPLACE VIEW public.fee_collection_summary AS
SELECT
  fi.id AS invoice_id,
  fi.student_id,
  s.first_name || ' ' || s.last_name AS student_name,
  fi.amount AS invoice_amount,
  fi.amount_paid,
  fi.amount - fi.amount_paid AS due_amount,
  fi.status,
  fi.due_date,
  fi.updated_at AS last_updated,
  COALESCE(SUM(fp.amount_paid), 0) AS total_collected
FROM public.fee_invoices fi
LEFT JOIN public.students s ON s.id = fi.student_id
LEFT JOIN public.fee_payments fp ON fp.student_id = fi.student_id
GROUP BY fi.id, s.first_name, s.last_name, fi.amount, fi.amount_paid, fi.status, fi.due_date, fi.updated_at;
