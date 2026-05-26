import { getScoringWeights } from '../registry';

export interface CompletenessConfig {
  fields: { key: string; weight: number; required: boolean }[];
  minScore: number;
  maxScore: number;
}

export function computeDataCompleteness(
  student: Record<string, unknown>,
  config?: CompletenessConfig,
): number {
  const cfg = config ?? {
    fields: getScoringWeights().fields,
    minScore: 1,
    maxScore: 10,
  };

  let totalWeight = 0;
  let filledWeight = 0;

  for (const field of cfg.fields) {
    totalWeight += field.weight;
    const value = student[field.key];
    if (value !== undefined && value !== null && value !== '') {
      filledWeight += field.weight;
    }
  }

  if (totalWeight === 0) return cfg.minScore;

  const raw =
    (filledWeight / totalWeight) * (cfg.maxScore - cfg.minScore) + cfg.minScore;
  return Math.round(raw * 10) / 10;
}
