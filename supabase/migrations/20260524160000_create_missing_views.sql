create or replace view public.student_register
with (security_invoker = true)
as
select
  s.id as student_id,
  s.admission_no,
  s.first_name,
  s.last_name,
  trim(concat_ws(' ', s.first_name, s.last_name)) as display_name,
  s.dob,
  s.gender,
  s.blood_group,
  s.nationality,
  s.email,
  s.phone,
  s.alternate_phone,
  s.address,
  s.umis_id,
  s.emis_id,
  s.community,
  s.first_graduate,
  s.income_verification_status,
  s.scholarship_notes,
  s.fee_status,
  s.attendance_percent,
  s.status,
  s.created_at,
  s.updated_at,
  e.id as enrollment_id,
  coalesce(e.academic_year_label, ay.label) as academic_year,
  coalesce(e.grade_label, cl.label) as grade,
  coalesce(e.section_label, sec.label) as section,
  e.roll_number,
  e.stream,
  e.house,
  e.status as enrollment_status,
  g.id as guardian_id,
  g.full_name as guardian_name,
  g.occupation as guardian_occupation,
  g.phone as guardian_phone,
  g.email as guardian_email,
  g.annual_income as guardian_annual_income
from public.students s
left join lateral (
  select *
  from public.enrollments e1
  where e1.student_id = s.id
  order by case when e1.status = 'active' then 0 else 1 end, e1.updated_at desc
  limit 1
) e on true
left join public.academic_years ay on ay.id = e.academic_year_id
left join public.class_levels cl on cl.id = e.class_level_id
left join public.sections sec on sec.id = e.section_id
left join lateral (
  select g1.*
  from public.student_guardians sg
  join public.guardians g1 on g1.id = sg.guardian_id
  where sg.student_id = s.id
  order by sg.is_primary desc, sg.updated_at desc
  limit 1
) g on true;

grant select on public.student_register to authenticated;

create or replace view public.student_analytics_summary
with (security_invoker = true)
as
select
  s.institution_id,
  s.id as student_id,
  s.first_name,
  s.last_name,
  trim(concat_ws(' ', s.first_name, s.last_name)) as display_name,
  s.gender,
  s.status as student_status,
  s.attendance_percent,
  s.fee_status,
  e.id as enrollment_id,
  e.academic_year_id,
  e.class_level_id,
  e.section_id,
  e.roll_number,
  e.status as enrollment_status,
  (
    select coalesce(sum(fp.amount_paid), 0)
    from public.fee_payments fp
    where fp.student_id = s.id
  ) as total_fees_paid
from public.students s
left join lateral (
  select *
  from public.enrollments e1
  where e1.student_id = s.id
  order by case when e1.status = 'active' then 0 else 1 end, e1.updated_at desc
  limit 1
) e on true;

grant select on public.student_analytics_summary to authenticated;

create or replace view public.fee_collection_summary
with (security_invoker = true)
as
select
  institution_id,
  academic_year_id,
  fee_category_id,
  payment_method,
  status,
  count(*) as payment_count,
  sum(amount_paid) as total_collected,
  avg(amount_paid) as average_payment,
  min(amount_paid) as min_payment,
  max(amount_paid) as max_payment
from public.fee_payments
group by institution_id, academic_year_id, fee_category_id, payment_method, status;

grant select on public.fee_collection_summary to authenticated;
