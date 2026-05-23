export type RubricDimension = 'participation' | 'behavior' | 'academicEffort' | 'socialSkills';

export type RubricWeights = Partial<Record<RubricDimension, number>>;

export interface ScoreBreakdown {
  participation: number;
  behavior: number;
  academicEffort: number;
  socialSkills: number;
}

export interface ScoreResult {
  score: number;
  normalizedScore: number;
  breakdown: ScoreBreakdown;
  phrases: string[];
  matchedKeywords: Record<RubricDimension, string[]>;
}

const defaultRubric: Record<RubricDimension, Array<{ keyword: string; score: number }>> = {
  participation: [
    { keyword: 'participates', score: 9 },
    { keyword: 'engaged', score: 8.5 },
    { keyword: 'answers', score: 8 },
    { keyword: 'asks questions', score: 8.5 },
    { keyword: 'silent', score: 3 },
  ],
  behavior: [
    { keyword: 'respectful', score: 9 },
    { keyword: 'disruptive', score: 2 },
    { keyword: 'follows rules', score: 8.5 },
    { keyword: 'late', score: 4 },
    { keyword: 'inattentive', score: 3 },
  ],
  academicEffort: [
    { keyword: 'homework', score: 8 },
    { keyword: 'studies', score: 8.5 },
    { keyword: 'tries hard', score: 9 },
    { keyword: 'incomplete', score: 4 },
    { keyword: 'needs support', score: 5 },
  ],
  socialSkills: [
    { keyword: 'helps others', score: 9 },
    { keyword: 'cooperates', score: 8.5 },
    { keyword: 'collaborates', score: 8.5 },
    { keyword: 'isolated', score: 3 },
    { keyword: 'kind', score: 8 },
  ],
};

const defaultWeights: Required<RubricWeights> = { participation: 0.25, behavior: 0.25, academicEffort: 0.35, socialSkills: 0.15 };

function tokenizePhrases(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+|;|,|\band\b|\bbut\b/i)
    .map(part => part.trim())
    .filter(Boolean)
    .filter((part, index, list) => list.indexOf(part) === index);
}

function normalizeWeights(weights?: RubricWeights): Required<RubricWeights> {
  const merged = { ...defaultWeights, ...weights };
  const total = Object.values(merged).reduce((sum, value) => sum + value, 0) || 1;
  return {
    participation: merged.participation / total,
    behavior: merged.behavior / total,
    academicEffort: merged.academicEffort / total,
    socialSkills: merged.socialSkills / total,
  };
}

function scorePhrase(phrase: string, rubric: Array<{ keyword: string; score: number }>): { score: number; keyword: string | null } {
  for (const entry of rubric) {
    if (phrase.includes(entry.keyword)) return { score: entry.score, keyword: entry.keyword };
  }
  return { score: 6, keyword: null };
}

export function scoreObservation(text: string, weights?: RubricWeights): ScoreResult {
  const phrases = tokenizePhrases(text);
  const normalizedWeights = normalizeWeights(weights);
  const matchedKeywords: Record<RubricDimension, string[]> = { participation: [], behavior: [], academicEffort: [], socialSkills: [] };
  const breakdown: ScoreBreakdown = { participation: 6, behavior: 6, academicEffort: 6, socialSkills: 6 };

  const dimensionScores: ScoreBreakdown = { participation: 0, behavior: 0, academicEffort: 0, socialSkills: 0 };
  const dimensionHits: Record<RubricDimension, number> = { participation: 0, behavior: 0, academicEffort: 0, socialSkills: 0 };

  for (const phrase of phrases) {
    for (const dimension of Object.keys(defaultRubric) as RubricDimension[]) {
      const { score, keyword } = scorePhrase(phrase, defaultRubric[dimension]);
      if (keyword) {
        dimensionScores[dimension] += score;
        dimensionHits[dimension] += 1;
        matchedKeywords[dimension].push(keyword);
      }
    }
  }

  for (const dimension of Object.keys(defaultRubric) as RubricDimension[]) {
    const hits = dimensionHits[dimension];
    breakdown[dimension] = hits > 0 ? dimensionScores[dimension] / hits : 6;
  }

  const weighted = (breakdown.participation * normalizedWeights.participation) + (breakdown.behavior * normalizedWeights.behavior) + (breakdown.academicEffort * normalizedWeights.academicEffort) + (breakdown.socialSkills * normalizedWeights.socialSkills);
  const normalizedScore = Math.max(1, Math.min(10, Number(weighted.toFixed(1))));
  return { score: normalizedScore, normalizedScore, breakdown, phrases, matchedKeywords };
}

export const subjectiveToScoreDefaults = { defaultRubric, defaultWeights };
