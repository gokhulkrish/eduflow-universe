import { supabase } from '../../integrations/supabase/client';
import { subjectiveToStandardized, type RubricConfig } from './subjectiveToStandard';

export interface RecordObservationInput {
  tenantId: string;
  studentId: string;
  teacherId: string;
  rubricCode: string;
  observedOn: string;
  comment?: string;
  rawPayload: Record<string, unknown>;
}

async function loadRubricConfig(institutionId: string, rubricCode: string): Promise<RubricConfig> {
  const { data, error } = await (supabase as any)
    .from('subjective_rubrics')
    .select('config')
    .eq('institution_id', institutionId)
    .eq('code', rubricCode)
    .eq('is_active', true)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error(`Rubric not found: ${rubricCode}`);
  return data.config as RubricConfig;
}

export async function recordObservation(input: RecordObservationInput): Promise<void> {
  const { tenantId, studentId, teacherId, rubricCode, observedOn, comment, rawPayload } = input;

  const { error: insertError } = await (supabase as any).from('subjective_observations').insert({
    institution_id: tenantId,
    student_id: studentId,
    teacher_id: teacherId,
    observed_on: observedOn,
    rubric_code: rubricCode,
    comment: comment ?? null,
    raw_payload: rawPayload,
  });

  if (insertError) throw insertError;

  const rubricConfig = await loadRubricConfig(tenantId, rubricCode);
  const { scores, composite } = subjectiveToStandardized({
    rubric: rubricConfig,
    comment,
    rawPayload,
  });

  const { error: upsertError } = await (supabase as any).from('subjective_scores').upsert(
    {
      institution_id: tenantId,
      student_id: studentId,
      rubric_code: rubricCode,
      period_start: observedOn,
      period_end: observedOn,
      scores,
      composite_score: composite,
    },
    {
      onConflict: 'institution_id,student_id,rubric_code,period_start,period_end',
      ignoreDuplicates: false,
    },
  );

  if (upsertError) throw upsertError;
}

export interface ScoreRow {
  rubricCode: string;
  scores: Record<string, number>;
  compositeScore: number;
}

export async function getScoresForStudent(
  institutionId: string,
  studentId: string,
  date: string,
): Promise<ScoreRow[]> {
  const { data, error } = await (supabase as any)
    .from('subjective_scores')
    .select('rubric_code, scores, composite_score')
    .eq('institution_id', institutionId)
    .eq('student_id', studentId)
    .eq('period_start', date)
    .eq('period_end', date);

  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    rubricCode: r.rubric_code,
    scores: r.scores,
    compositeScore: Number(r.composite_score),
  }));
}
