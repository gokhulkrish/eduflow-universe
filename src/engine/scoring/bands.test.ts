import { describe, it, expect } from 'vitest';
import { getScoreBand, getScoreLabel, SCORE_BANDS } from './bands';

describe('SCORE_BANDS', () => {
  it('has 5 defined bands', () => {
    expect(SCORE_BANDS.length).toBe(5);
  });

  it('covers the full 1-10 range', () => {
    const min = Math.min(...SCORE_BANDS.map((b) => b.min));
    const max = Math.max(...SCORE_BANDS.map((b) => b.max));
    expect(min).toBe(1);
    expect(max).toBe(10);
  });

  it('has no gaps between bands', () => {
    const sorted = [...SCORE_BANDS].sort((a, b) => b.min - a.min);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].max).toBeCloseTo(sorted[i - 1].min - 0.1, 1);
    }
  });
});

describe('getScoreBand', () => {
  it('returns excellent for 10', () => {
    expect(getScoreBand(10).band).toBe('excellent');
  });

  it('returns excellent for 9', () => {
    expect(getScoreBand(9).band).toBe('excellent');
  });

  it('returns good for 8', () => {
    expect(getScoreBand(8).band).toBe('good');
  });

  it('returns average for 6', () => {
    expect(getScoreBand(6).band).toBe('average');
  });

  it('returns needsAttention for 4', () => {
    expect(getScoreBand(4).band).toBe('needsAttention');
  });

  it('returns critical for 1', () => {
    expect(getScoreBand(1).band).toBe('critical');
  });

  it('returns critical for sub-1 score', () => {
    expect(getScoreBand(0.5).band).toBe('critical');
  });
});

describe('getScoreLabel', () => {
  it('returns correct labels for each band', () => {
    expect(getScoreLabel(10)).toBe('Excellent');
    expect(getScoreLabel(7)).toBe('Good');
    expect(getScoreLabel(5)).toBe('Average');
    expect(getScoreLabel(3)).toBe('Needs Attention');
    expect(getScoreLabel(1)).toBe('Critical');
  });
});
