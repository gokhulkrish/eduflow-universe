import { describe, it, expect } from "vitest";
import {
  legacyCalculateScore,
  legacyCalculateGPA,
  legacyGetGradeDistribution,
  legacyGetPassFailStats,
  legacyCalculateOverallGrade,
  legacyGradeScale,
  legacyRemarkTemplates,
} from "./scoringEngine";

describe("legacyCalculateScore", () => {
  it("calculates A+ grade", () => {
    const result = legacyCalculateScore(95, 100);
    expect(result.percentage).toBe(95);
    expect(result.grade).toBe("A+");
    expect(result.points).toBe(10);
  });

  it("calculates F grade", () => {
    const result = legacyCalculateScore(20, 100);
    expect(result.grade).toBe("F");
    expect(result.points).toBe(0);
  });

  it("returns dash for null marks", () => {
    const result = legacyCalculateScore(null, 100);
    expect(result.percentage).toBeNull();
    expect(result.grade).toBe("\u2014");
    expect(result.points).toBe(0);
  });

  it("returns dash for zero max marks", () => {
    const result = legacyCalculateScore(50, 0);
    expect(result.grade).toBe("\u2014");
  });

  it("handles boundary grades", () => {
    expect(legacyCalculateScore(90, 100).grade).toBe("A+");
    expect(legacyCalculateScore(89, 100).grade).toBe("A");
    expect(legacyCalculateScore(80, 100).grade).toBe("A");
    expect(legacyCalculateScore(79, 100).grade).toBe("B+");
    expect(legacyCalculateScore(70, 100).grade).toBe("B+");
    expect(legacyCalculateScore(60, 100).grade).toBe("B");
    expect(legacyCalculateScore(50, 100).grade).toBe("C");
    expect(legacyCalculateScore(40, 100).grade).toBe("D");
  });
});

describe("legacyCalculateGPA", () => {
  it("calculates GPA for grades", () => {
    const gpa = legacyCalculateGPA(["A+", "A", "B+"]);
    expect(gpa).toBeGreaterThan(0);
    expect(gpa).toBeLessThanOrEqual(10);
  });

  it("returns 0 for empty array", () => {
    expect(legacyCalculateGPA([])).toBe(0);
  });
});

describe("legacyGetGradeDistribution", () => {
  it("returns correct distribution", () => {
    const marks = [
      { marksObtained: 95, grade: null },
      { marksObtained: 45, grade: null },
    ];
    const dist = legacyGetGradeDistribution(marks, 100);
    expect(dist).toHaveLength(2);
    expect(dist[0].grade).toBe("A+");
    expect(dist[1].grade).toBe("D");
  });

  it("returns empty for empty marks", () => {
    expect(legacyGetGradeDistribution([], 100)).toHaveLength(0);
  });
});

describe("legacyGetPassFailStats", () => {
  it("calculates pass rate", () => {
    const marks = [
      { marksObtained: 80 },
      { marksObtained: 30 },
      { marksObtained: 60 },
    ];
    const stats = legacyGetPassFailStats(marks, 40);
    expect(stats.total).toBe(3);
    expect(stats.passed).toBe(2);
    expect(stats.failed).toBe(1);
    expect(stats.passRate).toBe(67);
  });
});

describe("legacyCalculateOverallGrade", () => {
  it("calculates overall from multiple entries", () => {
    const entries = [
      { studentId: "1", marksObtained: 90, maxMarks: 100, grade: null },
      { studentId: "1", marksObtained: 70, maxMarks: 100, grade: null },
    ];
    const result = legacyCalculateOverallGrade(entries);
    expect(result.percentage).toBe(80);
    expect(result.grade).toBe("A");
    expect(result.gpa).toBeGreaterThan(0);
  });
});

describe("legacyGradeScale", () => {
  it("has all expected grades", () => {
    expect(legacyGradeScale["A+"].points).toBe(10);
    expect(legacyGradeScale["F"].points).toBe(0);
    expect(legacyGradeScale["C"].min).toBe(50);
  });
});

describe("legacyRemarkTemplates", () => {
  it("has all remark templates", () => {
    expect(legacyRemarkTemplates.excellent).toContain("Excellent");
    expect(legacyRemarkTemplates.fail).toContain("Remedial");
  });
});
