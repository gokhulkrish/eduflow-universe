import { APP_ACCESS_RULES } from "@/lib/global-access-registry";
import { moduleConfigs } from "@/pages/module-configs";
import type { CapabilityLevel } from "@/lib/capability-matrix";

export type GlobalRbacRole =
  | "super_admin"
  | "admin"
  | "principal"
  | "hod"
  | "faculty"
  | "staff"
  | "finance"
  | "scholarship"
  | "certificate"
  | "librarian"
  | "hostel_warden"
  | "transport"
  | "student"
  | "parent";

const HOD_MANAGE_MODULES = new Set([
  "students",
  "studentImport",
  "studentInformation",
  "studentSearch",
  "academics",
  "admissions",
  "attendance",
  "exams",
  "timetable",
  "assignments",
  "homework",
  "quiz",
  "courseInfo",
  "collegeInfo",
  "communication",
  "chat",
  "events",
  "notifications",
  "media",
  "placement",
  "alumni",
  "reports",
  "reportsAnalytics",
  "documents",
  "observation",
  "health",
  "grievances",
  "videoRooms",
  "videoRoomsSystem",
]);

const FACULTY_MANAGE_MODULES = new Set(["attendance", "exams", "timetable", "assignments", "homework", "quiz"]);
const STAFF_MANAGE_MODULES = new Set([
  "administration",
  "administrationSystem",
  "people",
  "reception",
  "tasks",
  "inventory",
  "communication",
  "chat",
  "events",
  "notifications",
  "media",
  "documents",
  "observation",
  "health",
  "grievances",
]);
const FINANCE_MANAGE_MODULES = new Set(["fees", "scholarships", "payroll", "reports", "reportsAnalytics"]);
const SCHOLARSHIP_MANAGE_MODULES = new Set(["scholarships", "certificates", "documents", "reports"]);
const CERTIFICATE_MANAGE_MODULES = new Set(["certificates", "documents", "reports"]);
const LIBRARIAN_MANAGE_MODULES = new Set(["library", "documents", "media"]);
const HOSTEL_MANAGE_MODULES = new Set(["hostel", "documents", "reports"]);
const TRANSPORT_MANAGE_MODULES = new Set(["transport", "documents", "reports"]);
const STUDENT_VIEW_MODULES = new Set([
  "students",
  "admissions",
  "attendance",
  "exams",
  "timetable",
  "assignments",
  "homework",
  "quiz",
  "fees",
  "scholarships",
  "certificates",
  "reports",
  "library",
  "hostel",
  "transport",
  "communication",
  "chat",
  "events",
  "notifications",
  "media",
  "documents",
  "courseInfo",
  "collegeInfo",
  "placement",
  "alumni",
  "videoRooms",
  "videoRoomsSystem",
  "parents",
]);

export function defaultGlobalRolePermissionLevel(role: GlobalRbacRole, moduleKey: string): CapabilityLevel {
  if (role === "super_admin" || role === "admin" || role === "principal") return "manage";
  if (role === "hod") return HOD_MANAGE_MODULES.has(moduleKey) ? "manage" : "view";
  if (role === "faculty") return FACULTY_MANAGE_MODULES.has(moduleKey) ? "edit" : "view";
  if (role === "staff") return STAFF_MANAGE_MODULES.has(moduleKey) ? "manage" : "view";
  if (role === "finance") return FINANCE_MANAGE_MODULES.has(moduleKey) ? "manage" : "view";
  if (role === "scholarship") return SCHOLARSHIP_MANAGE_MODULES.has(moduleKey) ? "manage" : "view";
  if (role === "certificate") return CERTIFICATE_MANAGE_MODULES.has(moduleKey) ? "manage" : "view";
  if (role === "librarian") return LIBRARIAN_MANAGE_MODULES.has(moduleKey) ? "manage" : "view";
  if (role === "hostel_warden") return HOSTEL_MANAGE_MODULES.has(moduleKey) ? "manage" : "view";
  if (role === "transport") return TRANSPORT_MANAGE_MODULES.has(moduleKey) ? "manage" : "view";
  if (role === "student" || role === "parent") return STUDENT_VIEW_MODULES.has(moduleKey) ? "view" : "none";
  return "none";
}

export function getCanonicalRegistryLabel(moduleKey: string): string {
  const direct = moduleConfigs[moduleKey as keyof typeof moduleConfigs];
  if (direct) return direct.title;

  const match = APP_ACCESS_RULES.find((rule) => rule.key === moduleKey);
  if (match) return match.label;

  return moduleKey.replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function getMissingRegistryModuleKeys(permissionKeys: Iterable<string>): string[] {
  const keySet = new Set(permissionKeys);
  return [...new Set(APP_ACCESS_RULES.map((rule) => rule.key))].filter((key) => !keySet.has(key));
}

export function buildMissingPermissionSeeds(moduleKeys: string[]) {
  return moduleKeys.map((moduleKey) => ({
    module_key: moduleKey,
    action: "view",
    label: `View ${getCanonicalRegistryLabel(moduleKey)}`,
  }));
}
