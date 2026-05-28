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

export {
  bridgeLegacyCertificates,
} from "../../../legacy/compat/certificates";
export type {
  LegacyCertificatesResult,
} from "../../../legacy/compat/certificates";

export {
  bridgeLegacyInstituteInfo,
} from "../../../legacy/compat/instituteInfo";
export type {
  LegacyInstituteInfo,
} from "../../../legacy/compat/instituteInfo";

export {
  listAttendanceLegacyCompatible,
} from "../../../legacy/compat/attendance";
export type {
  LegacyAttendanceFilter,
  LegacyAttendanceRecord,
} from "../../../legacy/compat/attendance";

export {
  listHostelRoomsLegacy,
} from "../../../legacy/compat/hostel";
export type {
  LegacyHostelRoom,
  LegacyHostelFilter,
} from "../../../legacy/compat/hostel";

export {
  listTransportRoutesLegacy,
} from "../../../legacy/compat/transport";
export type {
  LegacyTransportRoute,
  LegacyTransportFilter,
} from "../../../legacy/compat/transport";

export {
  listLibraryCatalogLegacy,
  listLibraryLoansLegacy,
} from "../../../legacy/compat/library";
export type {
  LegacyLibraryCatalogItem,
  LegacyLibraryLoan,
  LegacyLibraryFilter,
} from "../../../legacy/compat/library";

export {
  listPeopleLegacy,
} from "../../../legacy/compat/people";
export type {
  LegacyPeopleFilter,
} from "../../../legacy/compat/people";

export {
  listCommsLegacy,
  getDeliveryStats,
} from "../../../legacy/compat/communication";
export type {
  LegacyCommsFilter,
  LegacyCommsResult,
} from "../../../legacy/compat/communication";
