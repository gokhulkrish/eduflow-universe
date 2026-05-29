/**
 * Bridge & State Contract Index
 * 
 * Central registry for all bridge compatibility layers and state contracts.
 * This enables the migration system to easily reference and activate implementations.
 */

// Certificates Bridge
export * from "./certificates";
export { bridgeLegacyCertificates, getCertificateBridgeStats, validateCertificateTemplate } from "@/legacy/compat/certificates";

// Institute Info Bridge
export * from "./instituteInfo";
export { bridgeLegacyInstituteInfo, parseInstituteProfile, validateInstituteProfile } from "@/legacy/compat/instituteInfo";

// User Management State Contract
export * from "./user-management-state";

// Academics State Contract
export * from "./academics-state";

// Timetable State Contract
export * from "./timetable-state";

// Homework State Contract
export * from "./homework-state";

// Registry of all deferred modules and their state contracts
export const DEFERRED_MODULE_CONTRACTS = {
  userManagement: {
    key: "userManagement",
    label: "User Management",
    stateModule: "user-management-state",
    persistence: { storageKeys: ["eduflow.user-management.users.v1", "eduflow.user-management.roles.v1"] },
  },
  academics: {
    key: "academics",
    label: "Academic Management",
    stateModule: "academics-state",
    persistence: { storageKeys: ["eduflow.academics.classes.v1", "eduflow.academics.subjects.v1", "eduflow.academics.mappings.v1"] },
  },
  timetable: {
    key: "timetable",
    label: "Timetable",
    stateModule: "timetable-state",
    persistence: { storageKeys: ["eduflow.timetable.slots.v1", "eduflow.timetable.entries.v1", "eduflow.timetable.substitutions.v1", "eduflow.timetable.conflicts.v1"] },
  },
  homework: {
    key: "homework",
    label: "Homework",
    stateModule: "homework-state",
    persistence: { storageKeys: ["eduflow.homework.assignments.v1", "eduflow.homework.submissions.v1", "eduflow.homework.approvals.v1"] },
  },
};

// Registry of all bridge-required modules
export const BRIDGE_REQUIRED_MODULES = {
  certificates: {
    key: "certificates",
    label: "Certificates",
    bridgeModule: "@/legacy/compat/certificates",
    patchKey: "patch-023-certificates-bridge-wiring",
    bridgeFunctions: ["bridgeLegacyCertificates", "getCertificateBridgeStats", "validateCertificateTemplate", "bridgeLegacyCertificatesWorkflow", "bridgeCertificatesFromLegacyDb", "readLegacyCertificatesFromIndexedDB", "patchLegacyCertificatesFunctions"],
    storageAliases: ["sms.certificate.log", "eduflow.certificates.v1", "sms.certificate.bridge.v1"],
    routeAliases: ["/studentCertificates", "/viewCertificates", "/certificates"],
    dbTable: "certificate_requests",
    apiRoutes: ["/api/certificates/requests", "/api/certificates/templates", "/api/certificates/verify"],
  },
  collegeInfo: {
    key: "collegeInfo",
    label: "Institute Information",
    bridgeModule: "@/legacy/compat/instituteInfo",
    patchKey: "patch-024-collegeinfo-bridge-wiring",
    bridgeFunctions: ["bridgeLegacyInstituteInfo", "parseInstituteProfile", "validateInstituteProfile"],
    storageAliases: ["sms.institute.record", "eduflow.institute.profile", "sms.collegeInfo.v1"],
    routeAliases: ["/collegeInfo", "college-info"],
    dbTable: "institute_profile",
    apiRoutes: ["/api/institute/profile", "/api/institute/headers", "/api/institute/settings/history"],
  },
};
