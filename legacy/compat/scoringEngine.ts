import { calculateGrade, calculateGPA, getGradeDistribution, getPassFailStats } from "../../src/lib/exams";

export const legacyGradeScale: Record<string, { min: number; points: number }> = {
  "A+": { min: 90, points: 10 },
  "A":  { min: 80, points: 9 },
  "B+": { min: 70, points: 8 },
  "B":  { min: 60, points: 7 },
  "C":  { min: 50, points: 6 },
  "D":  { min: 40, points: 5 },
  "F":  { min: 0, points: 0 },
};

export const legacyExamTypes = [
  "quiz", "unit_test", "midterm", "final", "preboard", "other",
] as const;

export type LegacyExamType = typeof legacyExamTypes[number];

export interface LegacyMarkEntry {
  studentId: string;
  marksObtained: number | null;
  maxMarks: number;
  grade: string | null;
  remarks?: string;
}

export function legacyCalculateScore(marksObtained: number | null, maxMarks: number): {
  percentage: number | null;
  grade: string;
  points: number;
} {
  if (marksObtained === null || maxMarks <= 0) {
    return { percentage: null, grade: "\u2014", points: 0 };
  }

  const percentage = (marksObtained / maxMarks) * 100;
  const grade = calculateGrade(percentage);

  const points = Object.entries(legacyGradeScale).find(([key]) => key === grade)?.[1]?.points ?? 0;

  return {
    percentage: Math.round(percentage * 100) / 100,
    grade,
    points,
  };
}

export function legacyCalculateGPA(grades: string[]): number {
  return calculateGPA(grades);
}

export function legacyGetGradeDistribution(
  marks: { marksObtained: number | null; grade: string | null }[],
  maxMarks: number,
) {
  return getGradeDistribution(
    marks.map((m) => ({ marks_obtained: m.marksObtained, grade: m.grade })),
    maxMarks,
  );
}

export function legacyGetPassFailStats(
  marks: { marksObtained: number | null }[],
  passMarks: number,
) {
  return getPassFailStats(
    marks.map((m) => ({ marks_obtained: m.marksObtained })),
    passMarks,
  );
}

export function legacyCalculateOverallGrade(
  entries: LegacyMarkEntry[],
): { percentage: number; grade: string; gpa: number } {
  let totalObtained = 0;
  let totalMax = 0;

  for (const entry of entries) {
    if (entry.marksObtained !== null && entry.maxMarks > 0) {
      totalObtained += entry.marksObtained;
      totalMax += entry.maxMarks;
    }
  }

  const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
  const grade = calculateGrade(percentage);
  const gpa = calculateGPA(entries.map((e) => e.grade ?? calculateGrade(
    e.marksObtained !== null && e.maxMarks > 0 ? (e.marksObtained / e.maxMarks) * 100 : null,
  )));

  return {
    percentage: Math.round(percentage * 100) / 100,
    grade,
    gpa: Math.round(gpa * 100) / 100,
  };
}

export const legacyRemarkTemplates: Record<string, string> = {
  excellent: "Excellent performance. Keep up the great work!",
  good: "Good performance. Room for improvement in certain areas.",
  average: "Average performance. Needs more focus and practice.",
  poor: "Needs significant improvement. Please seek additional support.",
  fail: "Did not meet the passing criteria. Remedial attention required.",
};
