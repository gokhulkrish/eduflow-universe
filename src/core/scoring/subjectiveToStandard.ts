export interface RubricDimensionAnchor {
  score: number;
  keywords?: string[];
  flagKey?: string;
}

export interface RubricDimension {
  key: string;
  label: string;
  weight: number;
  anchors: RubricDimensionAnchor[];
}

export interface RubricConfig {
  dimensions: RubricDimension[];
}

export interface SubjectiveInput {
  rubric: RubricConfig;
  comment?: string;
  rawPayload: Record<string, unknown>;
}

export interface StandardizedScores {
  scores: Record<string, number>;
  composite: number;
}

function clampScore(score: number): number {
  return Math.max(1, Math.min(10, score));
}

function scoreDimensionFromPayload(
  dim: RubricDimension,
  comment: string | undefined,
  rawPayload: Record<string, unknown>,
): number {
  let bestScore: number | null = null;
  const lowerComment = (comment ?? '').toLowerCase();

  for (const anchor of dim.anchors) {
    let matched = false;

    if (anchor.keywords && anchor.keywords.length > 0) {
      for (const kw of anchor.keywords) {
        if (lowerComment.includes(kw.toLowerCase())) {
          matched = true;
          break;
        }
      }
    }

    if (!matched && anchor.flagKey) {
      const val = rawPayload[anchor.flagKey];
      if (val === true || val === 1 || val === '1' || val === 'true') {
        matched = true;
      }
    }

    if (matched) {
      bestScore = bestScore === null ? anchor.score : Math.min(bestScore, anchor.score);
    }
  }

  if (bestScore === null) {
    return 5;
  }

  return clampScore(bestScore);
}

export function subjectiveToStandardized(input: SubjectiveInput): StandardizedScores {
  const { rubric, comment, rawPayload } = input;

  const scores: Record<string, number> = {};
  let weightedSum = 0;
  let weightTotal = 0;

  for (const dim of rubric.dimensions) {
    const score = scoreDimensionFromPayload(dim, comment, rawPayload);
    scores[dim.key] = score;
    weightedSum += score * dim.weight;
    weightTotal += dim.weight;
  }

  const composite = weightTotal > 0 ? weightedSum / weightTotal : 0;

  return {
    scores,
    composite: clampScore(composite),
  };
}
