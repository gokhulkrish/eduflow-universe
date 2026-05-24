import { describe, it, expect } from "vitest";
import { evaluateObservation, batchEvaluateObservations, aggregateScores } from "./subjectiveToStandard";

describe("evaluateObservation", () => {
  it("returns a standardized score for positive observation", () => {
    const result = evaluateObservation({
      studentId: "s1",
      teacherId: "t1",
      text: "Student participates actively, is respectful, completes homework on time, and helps others.",
      date: "2026-05-24",
    });

    expect(result.studentId).toBe("s1");
    expect(result.score).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.normalizedScore).toBeGreaterThanOrEqual(1);
    expect(result.compositeIndex).toBeGreaterThanOrEqual(1);
    expect(result.breakdown).toHaveProperty("participation");
    expect(result.breakdown).toHaveProperty("behavior");
    expect(result.breakdown).toHaveProperty("academicEffort");
    expect(result.breakdown).toHaveProperty("socialSkills");
    expect(result.dimensions.participation.level).toBeTruthy();
    expect(result.dimensions.behavior.level).toBeTruthy();
  });

  it("returns lower scores for negative observation", () => {
    const positive = evaluateObservation({
      studentId: "s1", teacherId: "t1",
      text: "Student participates actively, is respectful, and completes homework.",
      date: "2026-05-24",
    });

    const negative = evaluateObservation({
      studentId: "s2", teacherId: "t1",
      text: "Student is disruptive, silent, inattentive, and isolated.",
      date: "2026-05-24",
    });

    expect(negative.score).toBeLessThan(positive.score);
  });

  it("applies custom weights", () => {
    const result = evaluateObservation({
      studentId: "s1",
      teacherId: "t1",
      text: "Student participates actively and is respectful.",
      date: "2026-05-24",
    }, { participation: 0.5, behavior: 0.5, academicEffort: 0, socialSkills: 0 });

    expect(result.compositeIndex).toBeGreaterThanOrEqual(1);
  });

  it("handles empty text", () => {
    const result = evaluateObservation({
      studentId: "s1", teacherId: "t1", text: "", date: "2026-05-24",
    });
    expect(result.score).toBe(6);
    expect(result.normalizedScore).toBe(6);
  });
});

describe("batchEvaluateObservations", () => {
  it("evaluates multiple observations", () => {
    const events = [
      { studentId: "s1", teacherId: "t1", text: "Good student", date: "2026-05-24" },
      { studentId: "s2", teacherId: "t1", text: "Needs improvement", date: "2026-05-24" },
    ];
    const results = batchEvaluateObservations(events);
    expect(results).toHaveLength(2);
    expect(results[0].studentId).toBe("s1");
    expect(results[1].studentId).toBe("s2");
  });
});

describe("aggregateScores", () => {
  it("aggregates multiple scores", () => {
    const scores = [
      evaluateObservation({ studentId: "s1", teacherId: "t1", text: "Excellent student participates and helps others", date: "2026-05-24" }),
      evaluateObservation({ studentId: "s2", teacherId: "t1", text: "Good effort but needs behavioral improvement", date: "2026-05-24" }),
    ];
    const agg = aggregateScores(scores);
    expect(agg.count).toBe(2);
    expect(agg.averageComposite).toBeGreaterThan(0);
    expect(agg.dimensionAverages.participation).toBeGreaterThan(0);
    expect(agg.distribution).toBeTruthy();
  });

  it("returns zeros for empty array", () => {
    const agg = aggregateScores([]);
    expect(agg.count).toBe(0);
    expect(agg.averageComposite).toBe(0);
  });
});
