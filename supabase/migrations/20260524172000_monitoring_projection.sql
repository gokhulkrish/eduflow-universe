-- Patch 11: Global Monitor Dashboard Projection

CREATE OR REPLACE VIEW public.monitoring_overview AS
SELECT
  s.id AS student_id,
  s.admission_no,
  s.first_name || ' ' || COALESCE(s.last_name, '') AS display_name,
  e.grade_label,
  e.section_label,
  e.roll_number,
  e.status AS enrollment_status,
  COALESCE(att.total_days, 0) AS total_days,
  COALESCE(att.present_days, 0) AS present_days,
  CASE WHEN COALESCE(att.total_days, 0) > 0
    THEN ROUND((att.present_days::numeric / att.total_days) * 100, 1)
    ELSE NULL
  END AS attendance_percent,
  em.marks_obtained,
  em.max_marks,
  CASE WHEN em.max_marks > 0
    THEN ROUND((em.marks_obtained::numeric / em.max_marks) * 100, 1)
    ELSE NULL
  END AS exam_percent,
  ss.composite_index AS subjective_score,
  ss.dimension_scores
FROM students s
JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS total_days,
    COUNT(*) FILTER (WHERE status = 'present') AS present_days
  FROM attendance a
  WHERE a.student_id = s.id
    AND a.date >= CURRENT_DATE - INTERVAL '30 days'
) att ON true
LEFT JOIN LATERAL (
  SELECT em.marks_obtained, es.max_marks
  FROM exam_marks em
  JOIN exam_schedules es ON es.id = em.exam_id
  WHERE em.student_id = s.id
  ORDER BY es.date DESC
  LIMIT 1
) em ON true
LEFT JOIN LATERAL (
  SELECT
    (metadata->>'compositeIndex')::numeric AS composite_index,
    metadata->>'dimensionScores' AS dimension_scores
  FROM audit_log
  WHERE entity = 'scoring'
    AND entity_id = s.id
  ORDER BY created_at DESC
  LIMIT 1
) ss ON true;

COMMENT ON VIEW public.monitoring_overview IS
  'Unified monitoring projection joining students, attendance, exams, and subjective scores';

-- Grant access
GRANT SELECT ON public.monitoring_overview TO authenticated;
