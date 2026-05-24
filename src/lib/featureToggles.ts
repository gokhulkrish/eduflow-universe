import { isMigrationFlagEnabled } from "./featureFlags";

export type FeatureToggleKey =
  | "useNewStudentWrites"
  | "useNewAttendance"
  | "useNewScoring"
  | "useNewComms"
  | "useNewPromotion"
  | "useNewMonitoring"
  | "useNewImport"
  | "useDualWrite"
  | "useNewFees"
  | "useNewFeeReceipts"
  | "useLegacyFeeReads"
  | "useMonitoringProjectionApi";

export const FEATURE_TOGGLE_DEFAULTS: Record<FeatureToggleKey, boolean> = {
  useNewStudentWrites: true,
  useNewAttendance: true,
  useNewScoring: true,
  useNewComms: false,
  useNewPromotion: false,
  useNewMonitoring: true,
  useNewImport: true,
  useDualWrite: true,
  useNewFees: false,
  useNewFeeReceipts: false,
  useLegacyFeeReads: true,
  useMonitoringProjectionApi: false,
};

const TOGGLE_STORAGE_KEY = "sms.feature-toggles.v1";

function loadOverrides(): Partial<Record<FeatureToggleKey, boolean>> {
  try {
    const raw = localStorage.getItem(TOGGLE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides: Partial<Record<FeatureToggleKey, boolean>>): void {
  localStorage.setItem(TOGGLE_STORAGE_KEY, JSON.stringify(overrides));
}

export function isFeatureEnabled(key: FeatureToggleKey): boolean {
  const overrides = loadOverrides();
  if (key in overrides) return overrides[key]!;
  return FEATURE_TOGGLE_DEFAULTS[key];
}

export function setFeatureToggle(key: FeatureToggleKey, enabled: boolean): void {
  const overrides = loadOverrides();
  overrides[key] = enabled;
  saveOverrides(overrides);
}

export function resetFeatureToggles(): void {
  localStorage.removeItem(TOGGLE_STORAGE_KEY);
}

export function getFeatureToggleDefaults(): Record<FeatureToggleKey, boolean> {
  return { ...FEATURE_TOGGLE_DEFAULTS };
}
