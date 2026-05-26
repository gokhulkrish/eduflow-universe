import { describe, it, expect } from 'vitest';
import { computePerformanceScore } from './performance';

describe('computePerformanceScore', () => {
  it('returns 10 for perfect scores across all dimensions', () => {
    const score = computePerformanceScore({
      completeness: 10,
      attendance: 10,
      academic: 10,
      behavior: 10,
    });
    expect(score).toBe(10);
  });

  it('returns 1 for minimum scores across all dimensions', () => {
    const score = computePerformanceScore({
      completeness: 1,
      attendance: 1,
      academic: 1,
      behavior: 1,
    });
    expect(score).toBe(1);
  });

  it('computes weighted average correctly', () => {
    const score = computePerformanceScore({
      completeness: 10,
      attendance: 10,
      academic: 10,
      behavior: 10,
    });
    expect(score).toBe(10);
  });

  it('clamps input values to min/max range', () => {
    const score = computePerformanceScore({
      completeness: 0,
      attendance: 11,
      academic: 10,
      behavior: 10,
    });
    expect(score).toBeGreaterThanOrEqual(1);
    expect(score).toBeLessThanOrEqual(10);
  });

  it('uses custom config when provided', () => {
    const score = computePerformanceScore(
      { completeness: 10, attendance: 10, academic: 10, behavior: 10 },
      { completenessWeight: 0.5, attendanceWeight: 0.5, academicWeight: 0, behaviorWeight: 0 },
    );
    expect(score).toBe(10);
  });

  it('returns minScore when total weight is 0', () => {
    const score = computePerformanceScore(
      { completeness: 10, attendance: 10, academic: 10, behavior: 10 },
      { completenessWeight: 0, attendanceWeight: 0, academicWeight: 0, behaviorWeight: 0 },
    );
    expect(score).toBe(1);
  });

  it('handles mixed partial scores', () => {
    const score = computePerformanceScore({
      completeness: 5,
      attendance: 8,
      academic: 6,
      behavior: 7,
    });
    expect(score).toBeGreaterThanOrEqual(1);
    expect(score).toBeLessThanOrEqual(10);
    expect(Number.isFinite(score)).toBe(true);
  });
});
