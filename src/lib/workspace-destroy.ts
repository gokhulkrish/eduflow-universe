import { useActivityTrace } from "@/stores/activityTrace";

export type DestroySection = "students" | "settings" | "batches" | "headers" | "erp" | "local";

export const ALL_STORAGE_PREFIXES = [
  "sms.header-registry.",
  "sms.header-groups.",
  "sms.header-group-fields.",
  "sms.canonical-fields.",
  "sms.registry-ai-state.",
  "sms.import.",
  "sms.shell.",
  "sms.migration.",
  "sms.erp.",
  "sms.monitoring.",
  "sms.runtime.",
  "sms.import-batches.",
  "sms.storage-normalization.",
  "sms.student-register.",
  "sms.student-records.",
  "sms.focus-mode.",
  "sms.theme.",
  "sms.subject-mgmt.",
  "sms.placement.",
  "sms.attendance.",
  "sms.fee-payments.",
  "sms.exam-marks.",
  "sms.admissions.",
  "sms.assignments.",
  "sms.hostel.",
  "sms.staff.",
  "sms.transport.",
  "sms.library.",
];

export const STORAGE_KEY_MAP: Record<DestroySection, string[]> = {
  students: ["sms.student-register.v1"],
  settings: ["sms.shell.runtime.v1", "sms.focus-mode.v1", "sms.theme.v1"],
  batches: ["sms.import-batches.v1"],
  headers: [
    "sms.header-registry.settings.v1",
    "sms.header-registry.institute.v1",
    "sms.header-registry.overrides.v1",
    "sms.header-registry.snapshot.v1",
    "sms.header-registry.fetched-headers.v1",
    "sms.header-registry.fetched-meta.v1",
    "sms.header-registry.column-settings.v1",
    "sms.header-registry.filter-presets.v1",
    "sms.header-groups.student.v1",
    "sms.header-group-fields.student.v1",
    "sms.canonical-fields.student.v1",
    "sms.registry-ai-state.v1",
  ],
  erp: [
    "sms.erp.workspace.v1",
    "sms.import.custom-fields.v1",
    "sms.import-profiles.v1",
  ],
  local: [],
};

export function clearAllData(): void {
  if (typeof window === "undefined") return;
  if (!window.confirm("This will clear all students, settings, import batches, headers, and locally saved data. Continue?")) return;
  openDestroyModal();
}

function openDestroyModal(): void {
  const event = new CustomEvent("sms:open-destroy-modal");
  window.dispatchEvent(event);
}

export function getDestroyableKeys(sections: DestroySection[]): string[] {
  const keys: string[] = [];
  for (const section of sections) {
    if (section === "local") continue;
    keys.push(...(STORAGE_KEY_MAP[section] ?? []));
  }
  return [...new Set(keys)];
}

export function performDestroy(sections: DestroySection[]): void {
  if (typeof window === "undefined") return;

  const cleared: string[] = [];

  for (const section of sections) {
    if (section === "local") {
      localStorage.clear();
      cleared.push("localStorage");
      continue;
    }
    const keys = STORAGE_KEY_MAP[section] ?? [];
    for (const key of keys) {
      try { localStorage.removeItem(key); cleared.push(key); } catch {}
    }
    if (section === "headers") {
      try {
        const allKeys = Object.keys(localStorage);
        for (const k of allKeys) {
          if (k.startsWith("sms.header-groups.student.") || k.startsWith("sms.header-group-fields.student.")) {
            localStorage.removeItem(k);
            cleared.push(k);
          }
        }
      } catch {}
    }
  }

  const sectionsDetail = sections.map(s => `${s}: ✓`).join(", ");
  useActivityTrace.getState().push({
    category: "alert",
    title: "Workspace data destroyed",
    detail: `cleared stores cleared. ${sectionsDetail}`,
    section: "system",
  });

  setTimeout(() => location.reload(), 300);
}
