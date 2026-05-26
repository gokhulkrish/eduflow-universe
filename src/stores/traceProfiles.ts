import type { TraceCategory } from "./activityTrace";

export interface TraceProfileConfig {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
  startExpanded: boolean;
  autoCollapse: boolean;
  autoCollapseDelayMs: number;
  showUnreadBadge: boolean;
  retainMaxEvents: number;
  categories: TraceCategory[];
}

export interface UserTracePreferences {
  userId: string;
  activeProfileId: string;
}

const PROFILES_KEY = "sms.traceProfiles";
const PREFERENCES_KEY = "sms.tracePreferences";
const CONFIG_KEY = "sms.traceConfig";

const DEFAULT_PROFILES: TraceProfileConfig[] = [
  {
    id: "admin",
    label: "Admin Trace",
    description: "Full visibility across all categories with high retention",
    enabled: true,
    startExpanded: true,
    autoCollapse: true,
    autoCollapseDelayMs: 7000,
    showUnreadBadge: true,
    retainMaxEvents: 280,
    categories: ["system", "navigation", "action", "field", "persistence", "sync", "alert"],
  },
  {
    id: "developer",
    label: "Developer Trace",
    description: "Full visibility with the highest retention for debugging",
    enabled: true,
    startExpanded: true,
    autoCollapse: true,
    autoCollapseDelayMs: 8000,
    showUnreadBadge: true,
    retainMaxEvents: 320,
    categories: ["system", "navigation", "action", "field", "persistence", "sync", "alert"],
  },
  {
    id: "operator",
    label: "Operator Trace",
    description: "Focused on persistence, sync, and alerts for office staff",
    enabled: true,
    startExpanded: false,
    autoCollapse: true,
    autoCollapseDelayMs: 5000,
    showUnreadBadge: true,
    retainMaxEvents: 200,
    categories: ["persistence", "sync", "alert"],
  },
  {
    id: "teacher",
    label: "Teacher Trace",
    description: "Minimal — alerts only",
    enabled: true,
    startExpanded: false,
    autoCollapse: true,
    autoCollapseDelayMs: 4000,
    showUnreadBadge: true,
    retainMaxEvents: 150,
    categories: ["alert"],
  },
];

function loadProfiles(): TraceProfileConfig[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return DEFAULT_PROFILES.map((p) => ({ ...p }));
    const parsed = JSON.parse(raw) as TraceProfileConfig[];
    return parsed.length ? parsed : DEFAULT_PROFILES.map((p) => ({ ...p }));
  } catch {
    return DEFAULT_PROFILES.map((p) => ({ ...p }));
  }
}

function saveProfiles(profiles: TraceProfileConfig[]) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch { /* quota */ }
}

function loadPreferences(): UserTracePreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return { userId: "default", activeProfileId: "admin" };
    return JSON.parse(raw) as UserTracePreferences;
  } catch {
    return { userId: "default", activeProfileId: "admin" };
  }
}

function savePreferences(prefs: UserTracePreferences) {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch { /* quota */ }
}

export function profileToTraceConfig(profile: TraceProfileConfig) {
  return {
    enabled: profile.enabled,
    startExpanded: profile.startExpanded,
    autoCollapse: profile.autoCollapse,
    showBadge: profile.showUnreadBadge,
    autoCollapseDelay: profile.autoCollapseDelayMs,
    maxEvents: profile.retainMaxEvents,
    captureCategories: profile.categories,
  };
}

function syncTraceConfig(profile: TraceProfileConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(profileToTraceConfig(profile)));
  } catch { /* quota */ }
}

let cachedProfiles: TraceProfileConfig[] | null = null;
let cachedPrefs: UserTracePreferences | null = null;

function getProfiles(): TraceProfileConfig[] {
  if (!cachedProfiles) cachedProfiles = loadProfiles();
  return cachedProfiles;
}

function getPrefs(): UserTracePreferences {
  if (!cachedPrefs) cachedPrefs = loadPreferences();
  return cachedPrefs;
}

export function getTraceProfiles(): TraceProfileConfig[] {
  return getProfiles();
}

export function getActiveProfile(): TraceProfileConfig | undefined {
  const profiles = getProfiles();
  const prefs = getPrefs();
  return profiles.find((p) => p.id === prefs.activeProfileId) || profiles[0];
}

export function setActiveProfile(profileId: string) {
  const profiles = getProfiles();
  const profile = profiles.find((p) => p.id === profileId);
  if (!profile) return;
  const prefs = getPrefs();
  const updated: UserTracePreferences = { ...prefs, activeProfileId: profileId };
  cachedPrefs = updated;
  savePreferences(updated);
  syncTraceConfig(profile);
  window.dispatchEvent(new CustomEvent("sms:trace-config-changed", { detail: profileToTraceConfig(profile) }));
}

export function updateProfile(profileId: string, patch: Partial<TraceProfileConfig>) {
  const profiles = getProfiles();
  const idx = profiles.findIndex((p) => p.id === profileId);
  if (idx === -1) return;
  const updated = { ...profiles[idx], ...patch, id: profileId };
  const next = [...profiles];
  next[idx] = updated;
  cachedProfiles = next;
  saveProfiles(next);
  const prefs = getPrefs();
  if (prefs.activeProfileId === profileId) {
    syncTraceConfig(updated);
    window.dispatchEvent(new CustomEvent("sms:trace-config-changed", { detail: profileToTraceConfig(updated) }));
  }
}

export function resetProfileToDefaults(profileId: string) {
  const def = DEFAULT_PROFILES.find((p) => p.id === profileId);
  if (!def) return;
  updateProfile(profileId, { ...def, id: profileId });
}

export function getDefaultProfiles(): TraceProfileConfig[] {
  return DEFAULT_PROFILES.map((p) => ({ ...p }));
}

export function initializeTraceProfiles(): ReturnType<typeof profileToTraceConfig> | null {
  const raw = localStorage.getItem(PROFILES_KEY);
  let profiles: TraceProfileConfig[];

  if (!raw) {
    // First ever run — try to migrate from old single sms.traceConfig
    const oldRaw = localStorage.getItem(CONFIG_KEY);
    if (oldRaw) {
      try {
        const old = JSON.parse(oldRaw);
        const base = DEFAULT_PROFILES.find((p) => p.id === "admin")!;
        const migrated: TraceProfileConfig = {
          ...base,
          enabled: old.enabled ?? base.enabled,
          startExpanded: old.startExpanded ?? base.startExpanded,
          autoCollapse: old.autoCollapse ?? base.autoCollapse,
          autoCollapseDelayMs: old.autoCollapseDelay ?? base.autoCollapseDelayMs,
          showUnreadBadge: old.showBadge ?? base.showUnreadBadge,
          retainMaxEvents: old.maxEvents ?? base.retainMaxEvents,
          categories: old.captureCategories ?? base.categories,
        };
        profiles = [migrated, ...DEFAULT_PROFILES.filter((p) => p.id !== "admin").map((p) => ({ ...p }))];
        saveProfiles(profiles);
      } catch {
        profiles = DEFAULT_PROFILES.map((p) => ({ ...p }));
      }
    } else {
      profiles = DEFAULT_PROFILES.map((p) => ({ ...p }));
    }
  } else {
    profiles = loadProfiles();
  }

  // Merge any missing default profiles
  const existingIds = new Set(profiles.map((p) => p.id));
  const missing = DEFAULT_PROFILES.filter((p) => !existingIds.has(p.id)).map((p) => ({ ...p }));
  if (missing.length) {
    profiles = [...profiles, ...missing];
    saveProfiles(profiles);
  }

  cachedProfiles = profiles;

  // Sync active profile to trace config
  const prefs = loadPreferences();
  cachedPrefs = prefs;
  const active = profiles.find((p) => p.id === prefs.activeProfileId) || profiles[0];
  if (active) {
    syncTraceConfig(active);
    return profileToTraceConfig(active);
  }
  return null;
}
