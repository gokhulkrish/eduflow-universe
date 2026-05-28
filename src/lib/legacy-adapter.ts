import "@/lib/runtime-storage";
import { emitAppSync, subscribeAppSync } from "./app-sync";
import { runSingletonEffect } from "./module-deduplication";
import {
  normalizeContextState,
  normalizePanelVisibilityState,
  normalizeRegistryState,
  normalizeSettingsState,
  normalizeShellState,
  normalizeWorkspaceState,
  writeStoredJson,
} from "./state-normalization";
import { SHELL_RUNTIME_STORAGE_KEY } from "./shell-runtime";
import { THEME_STORAGE_KEY, LEGACY_THEME_STORAGE_KEY } from "./theme-runtime";
import { MIGRATION_FLAGS_STORAGE_KEY } from "./featureFlags";
import { MIGRATION_ROLLBACK_STORAGE_KEY } from "./rollbackRegistry";
import { GROUP_MODEL_STORAGE_KEY } from "./group-model";
import { RUNTIME_DIAGNOSTICS_STORAGE_KEY } from "./runtime-diagnostics";
import { registryStorageKey, instituteRegistryStorageKey } from "./header-registry";
import { importStorageKeys } from "./student-import";
import { legacyFeatureMap } from "../../legacyFeatureMap";
import { queryLegacyStudentRegister, getLegacyStudentById } from "../../legacy/compat/studentReadAdapter";
import { validateImportRow } from "../../legacy/compat/importValidation";
import { legacyCalculateScore, legacyCalculateOverallGrade } from "../../legacy/compat/scoringEngine";
import { bridgeLegacyCertificates } from "../../legacy/compat/certificates";
import { bridgeLegacyInstituteInfo } from "../../legacy/compat/instituteInfo";

type LegacyRouteAliasEntry = readonly [legacy: string, modern: string];
type LegacyStorageAliasEntry = readonly [legacy: string, modern: string];
type LegacyEventAliasEntry = readonly [legacy: string, modern: string];

const isBrowser = () => typeof window !== "undefined";
export const LEGACY_ADAPTER_SYNC_KEY = "sms.legacy-adapter.v1";
export const LEGACY_ADAPTER_EVENT_SYNC_KEY = "sms.legacy-adapter.events.v1";
export const LEGACY_ADAPTER_EVENT_TYPE = "sms:legacy-adapter-event";

const normalizeToken = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const LEGACY_ROUTE_ALIAS_ENTRIES: LegacyRouteAliasEntry[] = [
  ["/registeredStudents", "/students"],
  ["registered-students", "/students"],
  ["/addStudent", "/students/new"],
  ["add-student", "/students/new"],
  ["/partialStudentsave", "/student-information"],
  ["partial-saved-students", "/student-information"],
  ["/studentCertificates", "/certificates"],
  ["student-certificates", "/certificates"],
  ["/viewCertificates", "/certificates"],
  ["view-certificates", "/certificates"],
  ["/collegeInfo", "/settings/institute"],
  ["college-info", "/settings/institute"],
  ["/courseInfo", "/course-information"],
  ["course-info", "/course-information"],
  ["/taskManagement", "/tasks"],
  ["task-management", "/tasks"],
  ["/reportsAnalytics", "/reports"],
  ["reports-analytics", "/reports"],
  ["/settingsBackup", "/settings"],
  ["settings-backup", "/settings"],
  ["/userManagement", "/user-management"],
  ["user-management", "/user-management"],
  ["/markAttendance", "/attendance"],
  ["mark-attendance", "/attendance"],
  ["/attendanceSheet", "/attendance"],
  ["attendance-sheet", "/attendance"],
  ["/employeeDirectory", "/student-information"],
  ["employee-directory", "/student-information"],
  ["/staffDirectory", "/student-information"],
  ["staff-directory", "/student-information"],
  ["/announcements", "/comms"],
  ["announcements", "/comms"],
  ["/notifications", "/comms"],
  ["notifications", "/comms"],
  ["/hostelRooms", "/hostel"],
  ["hostel-rooms", "/hostel"],
  ["/roomAllotment", "/hostel"],
  ["room-allotment", "/hostel"],
  ["/busRoutes", "/transport"],
  ["bus-routes", "/transport"],
  ["/vehicleManagement", "/transport"],
  ["vehicle-management", "/transport"],
  ["/bookCatalog", "/library"],
  ["book-catalog", "/library"],
  ["/issueBook", "/library"],
  ["issue-book", "/library"],
];

const LEGACY_STORAGE_ALIAS_ENTRIES: LegacyStorageAliasEntry[] = [
  ["eduflow.theme.mode", THEME_STORAGE_KEY],
  ["eduflow.theme.legacy", LEGACY_THEME_STORAGE_KEY],
  ["sms.shell.v1", SHELL_RUNTIME_STORAGE_KEY],
  ["sms.feature-flags", MIGRATION_FLAGS_STORAGE_KEY],
  ["sms.rollback-registry", MIGRATION_ROLLBACK_STORAGE_KEY],
  ["sms.group-visibility", GROUP_MODEL_STORAGE_KEY],
  ["sms.runtime.errors", RUNTIME_DIAGNOSTICS_STORAGE_KEY],
  ["sms.registry.settings", registryStorageKey],
  ["sms.registry.institute", instituteRegistryStorageKey],
  ["sms.import.custom-fields", importStorageKeys.customFields],
  ["sms.import.profiles", importStorageKeys.profiles],
  ["sms.feature-toggles", "sms.feature-toggles.v1"],
  ["sms.legacy-feature-map", "sms.legacy-feature-map.v1"],
];

const LEGACY_EVENT_ALIAS_ENTRIES: LegacyEventAliasEntry[] = [
  ["legacy:route-change", "route"],
  ["legacy:storage-change", "storage"],
  ["legacy:state-change", "state"],
  ["legacy:registry-change", "registry"],
  ["legacy:settings-change", "settings"],
  ["legacy:context-change", "context"],
];

const LEGACY_ROUTE_ALIAS_LOOKUP = new Map(LEGACY_ROUTE_ALIAS_ENTRIES.map(([legacy, modern]) => [normalizeToken(legacy), modern]));
const LEGACY_STORAGE_ALIAS_LOOKUP = new Map(LEGACY_STORAGE_ALIAS_ENTRIES.map(([legacy, modern]) => [normalizeToken(legacy), modern]));
const LEGACY_EVENT_ALIAS_LOOKUP = new Map(LEGACY_EVENT_ALIAS_ENTRIES.map(([legacy, modern]) => [normalizeToken(legacy), modern]));

let lastSeededStorageAliases = 0;
let mirroredStorageEvents = 0;
let mirroredLegacyEvents = 0;
let lastBridgeCount = 0;

const markBridgeUse = () => {
  lastBridgeCount += 1;
};

const readLegacyStorageValue = (key: string): unknown | null => {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
};

function copyLegacyStorageEntry(legacyKey: string, modernKey: string): boolean {
  if (!isBrowser()) return false;
  const modernCurrent = window.localStorage.getItem(modernKey);
  if (modernCurrent != null) return false;

  const legacyValue = readLegacyStorageValue(legacyKey);
  if (legacyValue == null) return false;

  writeStoredJson(modernKey, legacyValue);
  emitAppSync(modernKey);
  return true;
}

export const LEGACY_ROUTE_ALIASES: Record<string, string> = Object.fromEntries(LEGACY_ROUTE_ALIAS_ENTRIES);
export const LEGACY_STORAGE_ALIASES: Record<string, string> = Object.fromEntries(LEGACY_STORAGE_ALIAS_ENTRIES);

export interface LegacyAdapterReport {
  generatedAt: string;
  routeAliases: number;
  storageAliases: number;
  stateAdapters: number;
  eventAdapters: number;
  apiBridges: number;
  seededStorageAliases: number;
  mirroredStorageEvents: number;
  mirroredLegacyEvents: number;
}

export function translateLegacyRoute(path: string): string {
  markBridgeUse();
  const cleaned = path.trim();
  if (!cleaned) return "/";
  const normalized = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  const translated = LEGACY_ROUTE_ALIAS_LOOKUP.get(normalizeToken(normalized));
  return translated ?? normalized;
}

export function translateLegacyStorageKey(key: string): string {
  markBridgeUse();
  const normalized = normalizeToken(key);
  return LEGACY_STORAGE_ALIAS_LOOKUP.get(normalized) ?? key;
}

export function translateLegacyShellSnapshot(input: Record<string, unknown> = {}) {
  markBridgeUse();
  return normalizeShellState(input);
}

export function translateLegacyWorkspaceSnapshot(input: Record<string, unknown> = {}) {
  markBridgeUse();
  return normalizeWorkspaceState(input);
}

export function translateLegacyRegistrySnapshot(input: Record<string, unknown> = {}) {
  markBridgeUse();
  return normalizeRegistryState(input);
}

export function translateLegacyContextSnapshot(input: Record<string, unknown> = {}) {
  markBridgeUse();
  return normalizeContextState(input);
}

export function translateLegacySettingsSnapshot(input: Record<string, unknown> = {}) {
  markBridgeUse();
  return normalizeSettingsState(input);
}

export function translateLegacyPanelSnapshot(input: Record<string, unknown> = {}) {
  markBridgeUse();
  return normalizePanelVisibilityState(input);
}

export function translateLegacyEventName(name: string): string {
  markBridgeUse();
  const normalized = normalizeToken(name);
  return LEGACY_EVENT_ALIAS_LOOKUP.get(normalized) ?? name.trim();
}

export function resolveLegacyFeatureTarget(feature: string, group?: string) {
  if (group) {
    const targets = legacyFeatureMap[group];
    if (!targets) return null;
    return targets.find((t) => t.feature === feature) ?? null;
  }
  for (const entries of Object.values(legacyFeatureMap)) {
    const found = entries.find((t) => t.feature === feature);
    if (found) return found;
  }
  return null;
}

export async function bridgeLegacyStudentQuery(filters: {
  class?: string; section?: string; status?: string; search?: string;
}) {
  return queryLegacyStudentRegister(filters);
}

export function bridgeLegacyScoreCalculation(marksObtained: number | null, maxMarks: number) {
  return legacyCalculateScore(marksObtained, maxMarks);
}

export function bridgeLegacyImportValidation(row: Record<string, string>, fieldMap: Record<string, string>) {
  return validateImportRow(row, fieldMap);
}

export function bridgeLegacyCertificatesQuery(filters?: {
  status?: string; student_id?: string; template_id?: string;
}) {
  return bridgeLegacyCertificates(filters);
}

export function bridgeLegacyInstituteSettings(filters?: Record<string, unknown>) {
  return bridgeLegacyInstituteInfo(filters);
}

export function translateLegacyRegistryPayload(input: Record<string, unknown> = {}) {
  markBridgeUse();
  return {
    shell: translateLegacyShellSnapshot(input.shell && typeof input.shell === "object" ? (input.shell as Record<string, unknown>) : {}),
    workspace: translateLegacyWorkspaceSnapshot(input.workspace && typeof input.workspace === "object" ? (input.workspace as Record<string, unknown>) : {}),
    registry: translateLegacyRegistrySnapshot(input.registry && typeof input.registry === "object" ? (input.registry as Record<string, unknown>) : {}),
    settings: translateLegacySettingsSnapshot(input.settings && typeof input.settings === "object" ? (input.settings as Record<string, unknown>) : {}),
    context: translateLegacyContextSnapshot(input.context && typeof input.context === "object" ? (input.context as Record<string, unknown>) : {}),
    panel: translateLegacyPanelSnapshot(input.panel && typeof input.panel === "object" ? (input.panel as Record<string, unknown>) : {}),
  };
}

export function emitLegacyAdapterEvent(name: string, detail: Record<string, unknown> = {}) {
  if (!isBrowser()) return;
  const translatedName = translateLegacyEventName(name);
  window.dispatchEvent(new CustomEvent(LEGACY_ADAPTER_EVENT_TYPE, { detail: { name, translatedName, detail } }));
  emitAppSync(LEGACY_ADAPTER_EVENT_SYNC_KEY);
}

export function subscribeLegacyAdapterEvents(listener: () => void) {
  return subscribeAppSync([LEGACY_ADAPTER_EVENT_SYNC_KEY, LEGACY_ADAPTER_SYNC_KEY], listener);
}

export function bridgeLegacyRegistryPayload(input: Record<string, unknown> = {}) {
  const payload = translateLegacyRegistryPayload(input);
  emitLegacyAdapterEvent("legacy:registry-change", { keys: Object.keys(input) });
  return payload;
}

export function seedLegacyStorageTranslations(): number {
  if (!isBrowser()) return 0;
  let copied = 0;
  for (const [legacyKey, modernKey] of LEGACY_STORAGE_ALIAS_ENTRIES) {
    if (copyLegacyStorageEntry(legacyKey, modernKey)) copied += 1;
  }
  lastSeededStorageAliases = copied;
  return copied;
}

export function buildLegacyAdapterReport(): LegacyAdapterReport {
  return {
    generatedAt: new Date().toISOString(),
    routeAliases: LEGACY_ROUTE_ALIAS_ENTRIES.length,
    storageAliases: LEGACY_STORAGE_ALIAS_ENTRIES.length,
    stateAdapters: 6,
    eventAdapters: LEGACY_EVENT_ALIAS_ENTRIES.length,
    apiBridges: lastBridgeCount,
    seededStorageAliases: lastSeededStorageAliases,
    mirroredStorageEvents,
    mirroredLegacyEvents,
  };
}

function handleStorageEvent(event: StorageEvent) {
  if (!event.key) return;
  const translatedKey = translateLegacyStorageKey(event.key);
  if (translatedKey !== event.key) {
    mirroredStorageEvents += 1;
    emitAppSync(translatedKey);
  }
}

export function bootstrapLegacyAdapterLayer() {
  if (!isBrowser()) return buildLegacyAdapterReport();

  runSingletonEffect("bootstrap:legacy-adapter", "Legacy adapter listener", "registry", () => {
    seedLegacyStorageTranslations();
    window.addEventListener("storage", handleStorageEvent);
    window.addEventListener(LEGACY_ADAPTER_EVENT_TYPE, () => {
      mirroredLegacyEvents += 1;
      emitAppSync(LEGACY_ADAPTER_EVENT_SYNC_KEY);
    });
  });

  emitAppSync(LEGACY_ADAPTER_SYNC_KEY);
  return buildLegacyAdapterReport();
}

export function resetLegacyAdapterRuntime() {
  lastSeededStorageAliases = 0;
  mirroredStorageEvents = 0;
  mirroredLegacyEvents = 0;
  lastBridgeCount = 0;
}
