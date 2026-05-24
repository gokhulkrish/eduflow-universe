import { scoreObservation } from "../../lib/scoring/subjectiveToScore";
import type { RubricWeights, ScoreBreakdown } from "../../lib/scoring/subjectiveToScore";
import { writeAuditEntry } from "../audit/service";

export interface ObservationEvent {
  studentId: string;
  teacherId: string;
  text: string;
  date: string;
  context?: {
    subject?: string;
    classLevel?: string;
    period?: string;
  };
}

export interface StandardizedScore {
  studentId: string;
  score: number;
  normalizedScore: number;
  breakdown: ScoreBreakdown;
  compositeIndex: number;
  matchedKeywords: Record<string, string[]>;
  dimensions: {
    participation: { score: number; level: string };
    behavior: { score: number; level: string };
    academicEffort: { score: number; level: string };
    socialSkills: { score: number; level: string };
  };
}

function scoreLevel(score: number): string {
  if (score >= 9) return "excellent";
  if (score >= 7.5) return "good";
  if (score >= 6) return "satisfactory";
  if (score >= 4) return "needs_improvement";
  return "concern";
}

export async function persistScoringAudit(
  result: StandardizedScore,
  event: ObservationEvent,
  teacherId?: string,
): Promise<void> {
  await writeAuditEntry({
    actorId: teacherId ?? event.teacherId,
    action: "scoring.observation.evaluated",
    entity: "scoring",
    entityId: event.studentId,
    source: "native",
    metadata: {
      compositeIndex: result.compositeIndex,
      score: result.score,
      breakdown: result.breakdown,
      dimensions: result.dimensions,
      observationText: event.text.substring(0, 500),
      date: event.date,
      subject: event.context?.subject ?? null,
    },
  });
}

export function evaluateObservation(
  event: ObservationEvent,
  weights?: RubricWeights,
): StandardizedScore {
  const result = scoreObservation(event.text, weights);

  return {
    studentId: event.studentId,
    score: result.score,
    normalizedScore: result.normalizedScore,
    breakdown: result.breakdown,
    compositeIndex: Math.round(
      (result.breakdown.participation * 0.25 +
       result.breakdown.behavior * 0.25 +
       result.breakdown.academicEffort * 0.35 +
       result.breakdown.socialSkills * 0.15) * 10,
    ) / 10,
    matchedKeywords: result.matchedKeywords,
    dimensions: {
      participation: { score: result.breakdown.participation, level: scoreLevel(result.breakdown.participation) },
      behavior: { score: result.breakdown.behavior, level: scoreLevel(result.breakdown.behavior) },
      academicEffort: { score: result.breakdown.academicEffort, level: scoreLevel(result.breakdown.academicEffort) },
      socialSkills: { score: result.breakdown.socialSkills, level: scoreLevel(result.breakdown.socialSkills) },
    },
  };
}

export function batchEvaluateObservations(
  events: ObservationEvent[],
  weights?: RubricWeights,
): StandardizedScore[] {
  return events.map((event) => evaluateObservation(event, weights));
}

export function aggregateScores(scores: StandardizedScore[]): {
  count: number;
  averageComposite: number;
  dimensionAverages: ScoreBreakdown;
  distribution: Record<string, number>;
} {
  if (scores.length === 0) {
    return {
      count: 0,
      averageComposite: 0,
      dimensionAverages: { participation: 0, behavior: 0, academicEffort: 0, socialSkills: 0 },
      distribution: {},
    };
  }

  const sum = scores.reduce(
    (acc, s) => ({
      participation: acc.participation + s.breakdown.participation,
      behavior: acc.behavior + s.breakdown.behavior,
      academicEffort: acc.academicEffort + s.breakdown.academicEffort,
      socialSkills: acc.socialSkills + s.breakdown.socialSkills,
    }),
    { participation: 0, behavior: 0, academicEffort: 0, socialSkills: 0 },
  );

  const distribution: Record<string, number> = {};
  for (const s of scores) {
    const level = scoreLevel(s.compositeIndex);
    distribution[level] = (distribution[level] ?? 0) + 1;
  }

  return {
    count: scores.length,
    averageComposite: Math.round((scores.reduce((a, s) => a + s.compositeIndex, 0) / scores.length) * 100) / 100,
    dimensionAverages: {
      participation: Math.round((sum.participation / scores.length) * 100) / 100,
      behavior: Math.round((sum.behavior / scores.length) * 100) / 100,
      academicEffort: Math.round((sum.academicEffort / scores.length) * 100) / 100,
      socialSkills: Math.round((sum.socialSkills / scores.length) * 100) / 100,
    },
    distribution,
  };
}
