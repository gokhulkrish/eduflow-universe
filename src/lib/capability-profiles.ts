export type CapabilityKey = "view" | "edit" | "print" | "export" | "report";

export const CAPABILITY_KEYS: CapabilityKey[] = ["view", "edit", "print", "export", "report"];

export const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  view: "View",
  edit: "Edit",
  print: "Print",
  export: "Export",
  report: "Report",
};

export const CAPABILITY_ICONS: Record<CapabilityKey, string> = {
  view: "Eye",
  edit: "Pencil",
  print: "Printer",
  export: "Download",
  report: "BarChart3",
};

export type ProfileId = "admin" | "office" | "teacher" | "viewer";

export interface ModuleCapability {
  module: string;
  capabilities: Record<CapabilityKey, boolean>;
}

export interface ProfileCapabilities {
  id: ProfileId;
  label: string;
  description?: string;
  isSystem: boolean;
  modules: ModuleCapability[];
  createdAt: string;
  updatedAt: string;
}

export type CapabilityMatrix = ProfileCapabilities[];

const STORAGE_KEY = "sms.capability-profiles.v1";

const CORE_MODULES = [
  { key: "students", label: "Student" },
  { key: "collegeInfo", label: "Institute" },
  { key: "attendance", label: "Attendance" },
  { key: "fees", label: "Fees" },
  { key: "exams", label: "Examinations" },
  { key: "library", label: "Library" },
  { key: "hostel", label: "Hostel" },
  { key: "transport", label: "Transport" },
  { key: "hr", label: "HR / Staff" },
  { key: "reports", label: "Reports" },
  { key: "certificates", label: "Certificates" },
  { key: "admissions", label: "Admissions" },
  { key: "timetable", label: "Timetable" },
  { key: "notifications", label: "Notifications" },
  { key: "scholarships", label: "Scholarship" },
];

function mod(mod: string, caps: Partial<Record<CapabilityKey, boolean>>): ModuleCapability {
  return { module: mod, capabilities: { view: false, edit: false, print: false, export: false, report: false, ...caps } };
}

function allTrue(): Partial<Record<CapabilityKey, boolean>> {
  return { view: true, edit: true, print: true, export: true, report: true };
}

function onlyView(): Partial<Record<CapabilityKey, boolean>> {
  return { view: true };
}

function viewEdit(): Partial<Record<CapabilityKey, boolean>> {
  return { view: true, edit: true };
}

function viewPrint(): Partial<Record<CapabilityKey, boolean>> {
  return { view: true, print: true };
}

const ALL_MODULES = CORE_MODULES.map((m) => m.key);

const DEFAULT_PROFILES: ProfileCapabilities[] = [
  {
    id: "admin", label: "Administrator", description: "Full access to all modules and capabilities", isSystem: true,
    modules: ALL_MODULES.map((m) => mod(m, allTrue())),
    createdAt: "", updatedAt: "",
  },
  {
    id: "office", label: "Office Staff", description: "Day-to-day operations with restricted export", isSystem: true,
    modules: ALL_MODULES.map((m) => {
      if (m === "collegeInfo") return mod(m, { view: true, edit: false, print: true, export: false, report: true });
      return mod(m, allTrue());
    }),
    createdAt: "", updatedAt: "",
  },
  {
    id: "teacher", label: "Teacher", description: "Classroom-focused access, no bulk export", isSystem: true,
    modules: ALL_MODULES.map((m) => {
      if (m === "students") return mod(m, viewEdit());
      if (m === "attendance") return mod(m, viewEdit());
      if (m === "exams") return mod(m, viewEdit());
      if (m === "timetable") return mod(m, viewEdit());
      if (m === "reports") return mod(m, { view: true, print: true, export: false, report: true });
      if (m === "notifications") return mod(m, viewEdit());
      return mod(m, onlyView());
    }),
    createdAt: "", updatedAt: "",
  },
  {
    id: "viewer", label: "Viewer", description: "Read-only access across modules", isSystem: true,
    modules: ALL_MODULES.map((m) => {
      if (m === "reports") return mod(m, onlyView());
      return mod(m, { view: true, print: true, export: false, report: false });
    }),
    createdAt: "", updatedAt: "",
  },
];

export function getDefaultProfiles(): CapabilityMatrix {
  return DEFAULT_PROFILES.map((p) => ({
    ...p,
    modules: p.modules.map((m) => ({ ...m, capabilities: { ...m.capabilities } })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function loadCapabilityProfiles(): CapabilityMatrix {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultProfiles();
    const parsed: CapabilityMatrix = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return getDefaultProfiles();
    return parsed;
  } catch {
    return getDefaultProfiles();
  }
}

export function saveCapabilityProfiles(profiles: CapabilityMatrix) {
  const stamped = profiles.map((p) => ({
    ...p,
    updatedAt: new Date().toISOString(),
    modules: p.modules.map((m) => ({ ...m, capabilities: { ...m.capabilities } })),
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
}

export function resetCapabilityProfiles(): CapabilityMatrix {
  const defaults = getDefaultProfiles();
  saveCapabilityProfiles(defaults);
  return defaults;
}

export function resolveModuleLabel(moduleKey: string): string {
  return CORE_MODULES.find((m) => m.key === moduleKey)?.label ?? moduleKey;
}

export function can(
  profiles: CapabilityMatrix,
  profileId: ProfileId,
  moduleKey: string,
  capability: CapabilityKey,
): boolean {
  const profile = profiles.find((p) => p.id === profileId);
  if (!profile) return false;
  const mod = profile.modules.find((m) => m.module === moduleKey);
  return !!mod?.capabilities[capability];
}

export function getCapabilityProfiles(): CapabilityMatrix {
  return loadCapabilityProfiles();
}

export interface ProfileWarning {
  profileId: ProfileId;
  profileLabel: string;
  message: string;
  severity: "warning" | "error";
}

export function diagnoseProfiles(profiles: CapabilityMatrix): ProfileWarning[] {
  const warnings: ProfileWarning[] = [];
  for (const profile of profiles) {
    for (const mod of profile.modules) {
      const caps = mod.capabilities;
      if (caps.edit && !caps.view) {
        warnings.push({
          profileId: profile.id,
          profileLabel: profile.label,
          message: `"${resolveModuleLabel(mod.module)}": edit enabled but view disabled`,
          severity: "error",
        });
      }
      if (caps.export && !caps.view) {
        warnings.push({
          profileId: profile.id,
          profileLabel: profile.label,
          message: `"${resolveModuleLabel(mod.module)}": export enabled but view disabled`,
          severity: "warning",
        });
      }
      if (caps.report && !caps.view) {
        warnings.push({
          profileId: profile.id,
          profileLabel: profile.label,
          message: `"${resolveModuleLabel(mod.module)}": report enabled but view disabled`,
          severity: "warning",
        });
      }
      if (caps.print && !caps.view) {
        warnings.push({
          profileId: profile.id,
          profileLabel: profile.label,
          message: `"${resolveModuleLabel(mod.module)}": print enabled but view disabled`,
          severity: "warning",
        });
      }
      if (caps.export && !caps.edit) {
        warnings.push({
          profileId: profile.id,
          profileLabel: profile.label,
          message: `"${resolveModuleLabel(mod.module)}": export enabled without edit — possible data leakage`,
          severity: "warning",
        });
      }
    }
  }
  return warnings;
}
