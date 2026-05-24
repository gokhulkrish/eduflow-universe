// Patch 00 — Re-exports from existing /legacy/compat/ implementations.
// These files become the typed wrappers as each subsequent patch matures.

export { legacyFeatureMap } from "../../../legacyFeatureMap";
export type { FeatureTarget } from "../../../legacyFeatureMap";

export {
  legacyFieldValidators,
  legacyNormalizers,
  legacyAllowedValues,
  validateImportRow,
  legacyErrorCodes,
  legacyImportRules,
} from "../../../legacy/compat/importValidation";

export {
  queryLegacyStudentRegister,
  getLegacyStudentById,
} from "../../../legacy/compat/studentReadAdapter";
export type { LegacyStudentQuery, LegacyStudentResponse } from "../../../legacy/compat/studentReadAdapter";

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

export {
  getMessagesLegacyCompatible,
} from "./communications";
export type {
  LegacyMessageFilter,
  LegacyMessageSummary,
} from "./communications";
