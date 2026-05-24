// Patch 00 — Skeleton. Re-exports from existing scoring engine.
// Later patches may add legacy assessment wrappers here.

export {
  legacyGradeScale,
  legacyExamTypes,
  legacyCalculateScore,
  legacyCalculateGPA,
  legacyGetGradeDistribution,
  legacyGetPassFailStats,
  legacyCalculateOverallGrade,
  legacyRemarkTemplates,
} from "../../../legacy/compat/scoringEngine";
export type { LegacyExamType, LegacyMarkEntry } from "../../../legacy/compat/scoringEngine";
