import { calculateGrade } from '../../lib/exams';

export interface ComponentMarkInput {
  componentId: string;
  subjectId: string;
  maxMarks: number;
  obtainedMarks: number;
  weight: number;
}

export interface TermScoreInput {
  tenantId: string;
  studentId: string;
  termId: string;
  gradeSchemeCode: string;
  components: ComponentMarkInput[];
}

export interface TermScoreOutput {
  totalMaxMarks: number;
  totalObtainedMarks: number;
  percentage: number;
  grade: string;
  gradePoint?: number;
}

export function legacyRound(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function getGradeForPercentage(
  institutionId: string,
  gradeSchemeCode: string,
  percentage: number,
): Promise<{ grade: string; gradePoint?: number }> {
  const { supabase } = await import('../../integrations/supabase/client');
  const { data } = await (supabase as any)
    .from('grade_rules')
    .select('grade, grade_point')
    .eq('institution_id', institutionId)
    .eq('code', gradeSchemeCode)
    .lte('min_percentage', percentage)
    .gte('max_percentage', percentage)
    .limit(1)
    .maybeSingle();

  if (!data) {
    return { grade: 'NA' };
  }
  return { grade: data.grade, gradePoint: data.grade_point ?? undefined };
}

export const defaultGradeScale: Record<string, { min: number; points: number }> = {
  'A+': { min: 90, points: 10 },
  'A': { min: 80, points: 9 },
  'B+': { min: 70, points: 8 },
  'B': { min: 60, points: 7 },
  'C': { min: 50, points: 6 },
  'D': { min: 40, points: 5 },
  'F': { min: 0, points: 0 },
};

export async function calculateTermScore(input: TermScoreInput): Promise<TermScoreOutput> {
  const { tenantId, gradeSchemeCode, components } = input;

  let totalMaxMarks = 0;
  let totalObtainedMarks = 0;
  let weightedSum = 0;
  let weightTotal = 0;

  for (const c of components) {
    totalMaxMarks += c.maxMarks;
    totalObtainedMarks += c.obtainedMarks;
    weightedSum += (c.obtainedMarks / c.maxMarks) * c.weight;
    weightTotal += c.weight;
  }

  const percentage = weightTotal > 0 ? (weightedSum / weightTotal) * 100 : 0;
  const roundedPct = legacyRound(percentage);

  let grade: string;
  let gradePoint: number | undefined;

  try {
    const result = await getGradeForPercentage(tenantId, gradeSchemeCode, roundedPct);
    grade = result.grade;
    gradePoint = result.gradePoint;
  } catch {
    grade = calculateGrade(roundedPct);
    const points = Object.entries(defaultGradeScale).find(([k]) => k === grade)?.[1]?.points;
    gradePoint = points;
  }

  return {
    totalMaxMarks,
    totalObtainedMarks,
    percentage: roundedPct,
    grade,
    gradePoint,
  };
}
