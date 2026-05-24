import { supabase } from '../../integrations/supabase/client';

export interface UpsertMarkInput {
  tenantId: string;
  termId: string;
  componentId: string;
  subjectId: string;
  studentId: string;
  rawMarks: number;
  maxMarks: number;
  weightedMarks?: number;
  remarks?: string;
  actorId: string;
}

export async function upsertMark(input: UpsertMarkInput): Promise<void> {
  const {
    tenantId,
    termId,
    componentId,
    subjectId,
    studentId,
    rawMarks,
    maxMarks,
    weightedMarks,
    remarks,
    actorId,
  } = input;

  const { error } = await (supabase as any).from('exam_marks').upsert(
    {
      institution_id: tenantId,
      term_id: termId,
      component_id: componentId,
      subject_id: subjectId,
      student_id: studentId,
      raw_marks: rawMarks,
      max_marks: maxMarks,
      weighted_marks: weightedMarks ?? null,
      remarks: remarks ?? null,
      source_system: 'new-system',
      created_by: actorId,
    },
    {
      onConflict: 'institution_id,term_id,component_id,subject_id,student_id',
      ignoreDuplicates: false,
    },
  );

  if (error) throw error;
}

export interface TermScoreQueryInput {
  tenantId: string;
  termId: string;
  studentId: string;
}

export interface MarkRow {
  componentId: string;
  subjectId: string;
  maxMarks: number;
  rawMarks: number;
}

export async function getMarksForTerm(
  input: TermScoreQueryInput,
): Promise<MarkRow[]> {
  const { data, error } = await (supabase as any)
    .from('exam_marks')
    .select('component_id, subject_id, max_marks, raw_marks')
    .eq('institution_id', input.tenantId)
    .eq('term_id', input.termId)
    .eq('student_id', input.studentId);

  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    componentId: r.component_id,
    subjectId: r.subject_id,
    maxMarks: Number(r.max_marks),
    rawMarks: Number(r.raw_marks),
  }));
}
