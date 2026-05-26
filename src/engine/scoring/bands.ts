export type ScoreBand =
  | 'excellent'
  | 'good'
  | 'average'
  | 'needsAttention'
  | 'critical';

export interface ScoreBandInfo {
  band: ScoreBand;
  label: string;
  min: number;
  max: number;
}

export const SCORE_BANDS: ScoreBandInfo[] = [
  { band: 'excellent', label: 'Excellent', min: 9, max: 10 },
  { band: 'good', label: 'Good', min: 7, max: 8.9 },
  { band: 'average', label: 'Average', min: 5, max: 6.9 },
  { band: 'needsAttention', label: 'Needs Attention', min: 3, max: 4.9 },
  { band: 'critical', label: 'Critical', min: 1, max: 2.9 },
];

export function getScoreBand(score: number): ScoreBandInfo {
  for (const band of SCORE_BANDS) {
    if (score >= band.min && score <= band.max) return band;
  }
  return SCORE_BANDS[SCORE_BANDS.length - 1];
}

export function getScoreLabel(score: number): string {
  return getScoreBand(score).label;
}
