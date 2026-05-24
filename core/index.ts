export { createStudent, updateStudent, deactivateStudent, deleteStudentPermanently, createStudentSchema } from "./students/service";
export type { CreateStudentInput } from "./students/service";

export { markAttendance, bulkUploadAttendance, overrideAttendance, getAttendanceByDate } from "./attendance/service";
export type { AttendanceStatus } from "./attendance/service";

export { evaluateObservation, batchEvaluateObservations, aggregateScores, persistScoringAudit } from "./scoring/subjectiveToStandard";
export type { ObservationEvent, StandardizedScore } from "./scoring/subjectiveToStandard";

export { writeAuditEntry, queryAuditLog } from "./audit/service";
export type { AuditEntry } from "./audit/service";

export { getPromotionRules, savePromotionRule, deletePromotionRule, getPromotionRuns, checkEligibility, executePromotion, nextGrade, DEFAULT_GRADES, DEFAULT_SECTIONS } from "./academics/promotion";
export type { PromotionRule, PromotionRun, StudentEligibility } from "./academics/promotion";

export { getRemarkTemplates, saveRemarkTemplate, deleteRemarkTemplate, generateRemark, findMatchingTemplate, DEFAULT_REMARK_TEMPLATES } from "./academics/remarks";
export type { RemarkTemplate } from "./academics/remarks";

export { getMonitoringOverview, subscribeMonitoringOverview } from "./monitoring/service";
export type { MonitoringOverviewRow, MonitoringFilter } from "./monitoring/service";

export {
  evaluateHealth,
  readDashboardSnapshots,
  readLatestHealthSnapshot,
  refreshMonitoringSnapshot,
} from "./monitoring/snapshot";
export type {
  DashboardMetric,
  MonitoringSnapshot,
  RefreshMonitoringInput,
  MonitoringHealthPolicy,
  MonitoringRefreshResult,
} from "./monitoring/snapshot";

export { getTemplates, createTemplate, expandTemplate } from "./comms/service";
export type { MessageTemplate, MessageType } from "./comms/service";
