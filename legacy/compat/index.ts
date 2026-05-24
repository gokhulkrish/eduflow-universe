export { legacyFeatureMap } from "../../legacyFeatureMap";
export type { FeatureTarget } from "../../legacyFeatureMap";

export {
  legacyFieldValidators,
  legacyNormalizers,
  legacyAllowedValues,
  validateImportRow,
  legacyErrorCodes,
  legacyImportRules,
} from "./importValidation";

export {
  queryLegacyStudentRegister,
  getLegacyStudentById,
} from "./studentReadAdapter";
export type { LegacyStudentQuery, LegacyStudentResponse } from "./studentReadAdapter";

export {
  legacyGradeScale,
  legacyExamTypes,
  legacyCalculateScore,
  legacyCalculateGPA,
  legacyGetGradeDistribution,
  legacyGetPassFailStats,
  legacyCalculateOverallGrade,
  legacyRemarkTemplates,
} from "./scoringEngine";
export type { LegacyExamType, LegacyMarkEntry } from "./scoringEngine";
