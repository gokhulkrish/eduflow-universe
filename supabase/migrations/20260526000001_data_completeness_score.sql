-- Add data_completeness_score column to students table
-- Used by the scoring engine to track record completeness (1-10)

alter table public.students
  add column if not exists data_completeness_score numeric(4,1) default 1.0;

-- Update existing students with a baseline score
-- (compute based on filled fields)
-- This is a best-effort migration; scores will be recomputed on next write
update public.students
set data_completeness_score = 1.0
where data_completeness_score is null;

-- Add index for filtering/sorting by completeness
create index if not exists idx_students_data_completeness_score
  on public.students (data_completeness_score);
