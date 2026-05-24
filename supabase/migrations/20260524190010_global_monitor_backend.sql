-- Patch 11: Global Monitor Backend — unified monitoring projection views

-- Fee risk aggregation (rank-based, not text-order)
create or replace view public.fee_student_summary as
select
  institution_id,
  student_id,
  sum(due_amount + adjustment_amount - concession_amount) as net_due,
  sum(paid_amount) as paid_amount,
  sum(greatest(0, due_amount + adjustment_amount - concession_amount - paid_amount)) as outstanding_amount,
  max(
    case risk_state
      when 'normal' then 1
      when 'warning' then 2
      when 'critical' then 3
      else 0
    end
  ) as fee_risk_rank
from public.fee_ledgers
group by institution_id, student_id;

-- Assessment summary from exam_marks
create or replace view public.assessment_student_summary as
select
  institution_id,
  student_id,
  term_id,
  round(avg((raw_marks / nullif(max_marks, 0)) * 100)::numeric, 2) as term_percentage
from public.exam_marks
group by institution_id, student_id, term_id;

-- Daily attendance aggregation (handles multiple periods per day)
create or replace view public.attendance_daily as
select
  student_id,
  date,
  case
    when bool_or(status = 'absent') then 'absent'
    when bool_or(status = 'late') then 'late'
    when bool_or(status = 'half_day') then 'half_day'
    else max(status)
  end as status
from public.attendance
group by student_id, date;

-- Unified monitoring projection
create or replace view public.monitoring_daily as
select
  s.institution_id,
  s.id as student_id,
  concat_ws(' ', s.first_name, s.last_name) as full_name,
  s.admission_no,
  cl.label as class_name,
  sec.label as section_name,
  ad.date as day,
  ad.status as attendance_status,
  coalesce(fs.net_due, 0) as fee_net_due,
  coalesce(fs.paid_amount, 0) as fee_paid_amount,
  coalesce(fs.outstanding_amount, 0) as fee_outstanding_amount,
  coalesce(fs.fee_risk_rank, 1) as fee_risk_rank,
  coalesce(ss.composite_score, 0) as subjective_index,
  asm.term_percentage
from public.students s
left join public.enrollments e on e.student_id = s.id and e.status = 'active'
left join public.class_levels cl on cl.id = e.class_level_id
left join public.sections sec on sec.id = e.section_id
left join public.attendance_daily ad on ad.student_id = s.id
left join public.fee_student_summary fs on fs.student_id = s.id and fs.institution_id = s.institution_id
left join public.subjective_scores ss
  on ss.student_id = s.id and ss.institution_id = s.institution_id
  and ss.period_start = ad.date and ss.period_end = ad.date
left join public.assessment_student_summary asm
  on asm.student_id = s.id and asm.institution_id = s.institution_id;
