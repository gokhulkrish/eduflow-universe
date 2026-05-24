import { moduleConfigs } from "@/pages/module-configs";

export interface AccessRule {
  path?: string;
  key: string;
  label: string;
}

const buildLabel = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

const moduleRules: AccessRule[] = Object.entries(moduleConfigs).map(([key, config]) => ({
  path: `/${key}`,
  key,
  label: config.title,
}));

const extraRules: AccessRule[] = [
  { path: "/homework", key: "homework", label: "Homework" },
  { path: "/video-rooms", key: "videoRooms", label: "Video Rooms" },
  { path: "/administration", key: "administration", label: "Administration" },
  { path: "/system", key: "system", label: "System" },
  { path: "/students", key: "students", label: "Students" },
  { path: "/import", key: "studentImport", label: "Import" },
  { path: "/automation", key: "automation", label: "Automation" },
  { path: "/migration", key: "migration", label: "Migration Center" },
  { path: "/permissions", key: "roles", label: "Permission Matrix" },
  { path: "/settings/institute", key: "collegeInfo", label: "Institute Identity" },
  { path: "/settings/headers", key: "settingsHeaders", label: "Headers & Fields" },
  { path: "/holidays", key: "holidays", label: "Holidays" },
  { path: "/leave-master", key: "leave-master", label: "Leave Master" },
  { path: "/class-mgmt", key: "class-mgmt", label: "Class Management" },
  { path: "/subjects", key: "subjects", label: "Subject Management" },
  { path: "/lessons", key: "lessons", label: "Lesson Management" },
  { path: "/notice-board", key: "notice-board", label: "Notice Board" },
  { path: "/media", key: "media", label: "Media Files" },
  { path: "/discipline", key: "discipline", label: "Discipline Record" },
  { path: "/telephone", key: "telephone", label: "Telephone Directory" },
  { path: "/class-wall", key: "class-wall", label: "Class Wall" },
  { path: "/activity-log", key: "activity-log", label: "Activity Log" },
  { path: "/reception", key: "reception", label: "Reception" },
  { path: "/tasks", key: "taskManagement", label: "Task Management" },
  { path: "/alumni", key: "alumni", label: "Alumni" },
  { path: "/quiz", key: "quiz", label: "Quiz" },
  { path: "/inventory", key: "inventory", label: "Inventory" },
  { path: "/accounts", key: "accounts", label: "Accounts" },
  { path: "/course-information", key: "courseInfo", label: "Course Information" },
  { path: "/student-information", key: "studentInformation", label: "Student Information" },
  { path: "/user-management", key: "userManagement", label: "User Management" },
  { path: "/student-search", key: "studentSearch", label: "Student Search" },
  { path: "/scholarship", key: "scholarships", label: "Scholarship" },
  { path: "/grievance", key: "grievances", label: "Grievance" },
  { path: "/monitor", key: "monitoring", label: "Monitoring Dashboard" },
  { path: "/scoring", key: "scoring", label: "Scoring Workspace" },
];

const systemRules: AccessRule[] = [
  { key: "administrationSystem", label: "Administration" },
  { key: "communication", label: "Communication" },
  { key: "documentsSystem", label: "Documents" },
  { key: "healthSystem", label: "Health" },
  { key: "payroll", label: "Payroll" },
  { key: "people", label: "People" },
  { key: "reportsAnalytics", label: "Reports Analytics" },
  { key: "settingsBackup", label: "Settings Backup" },
  { key: "videoRoomsSystem", label: "Video Rooms" },
];

export const APP_ACCESS_RULES: AccessRule[] = [...moduleRules, ...extraRules, ...systemRules]
  .map((rule) => ({ ...rule, label: rule.label || buildLabel(rule.key) }))
  .sort((left, right) => (right.path?.length ?? 0) - (left.path?.length ?? 0));

export function resolveAccessKeyForPathname(pathname: string): string | null {
  const normalized = pathname.trim() || "/";
  const path = normalized.endsWith("/") && normalized !== "/" ? normalized.replace(/\/+$/, "") : normalized;

  for (const rule of APP_ACCESS_RULES) {
    if (!rule.path) continue;
    if (rule.path === "/") {
      if (path === "/") return rule.key;
      continue;
    }

    if (path === rule.path || path.startsWith(`${rule.path}/`)) {
      return rule.key;
    }
  }

  return null;
}

export function getAccessCoverage(permissionKeys: Iterable<string>) {
  const keySet = new Set(permissionKeys);
  const coveredRules = APP_ACCESS_RULES.filter((rule) => keySet.has(rule.key));
  const missingRules = APP_ACCESS_RULES.filter((rule) => !keySet.has(rule.key));
  const uniqueCoveredKeys = new Set(coveredRules.map((rule) => rule.key));

  return {
    totalRules: APP_ACCESS_RULES.length,
    coveredRules: coveredRules.length,
    missingRules: missingRules.length,
    coveredKeys: uniqueCoveredKeys.size,
    missingExamples: missingRules.slice(0, 8),
  };
}
