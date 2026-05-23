import { describe, expect, it } from 'vitest';
import { scoreObservation } from './subjectiveToScore';

describe("scoreObservation", () => {
  it("scores positive engagement highly", () => {
    const result = scoreObservation("The student participates actively, is respectful, and helps others.");
    expect(result.score).toBeGreaterThan(7);
    expect(result.breakdown.behavior).toBeGreaterThan(7);
  });

  it("penalizes disruptive language", () => {
    const result = scoreObservation("The learner is disruptive, late, and inattentive in class.");
    expect(result.score).toBeLessThan(5);
    expect(result.breakdown.behavior).toBeLessThan(5);
  });

  it("handles mixed observations", () => {
    const result = scoreObservation("Good homework completion but sometimes silent and needs support.");
    expect(result.score).toBeGreaterThan(4);
    expect(result.score).toBeLessThan(8);
  });

  it("honors custom weights", () => {
    const result = scoreObservation("Respectful and cooperative, but incomplete homework.", { behavior: 0.5, academicEffort: 0.5 });
    expect(result.score).toBeGreaterThan(5);
    expect(result.matchedKeywords.behavior.length).toBeGreaterThan(0);
  });

  it("returns a normalized decimal score", () => {
    const result = scoreObservation("Engaged, answers questions, and collaborates with peers.");
    expect(Number.isFinite(result.score)).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeLessThanOrEqual(10);
  });
});
