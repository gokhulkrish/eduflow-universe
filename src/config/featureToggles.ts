import {
  isFeatureEnabled as isRuntimeEnabled,
  setFeatureToggle as setRuntimeToggle,
  resetFeatureToggles as resetAllToggles,
} from "../lib/featureToggles";

export interface FeatureToggles {
  useNewStudentWrites: boolean;
  useNewAttendanceEngine: boolean;
  useNewAssessmentEngine: boolean;
  useNewImportEngine: boolean;
  useNewFeesEngine: boolean;
  useNewFeeReceipts: boolean;
  useLegacyFeeReads: boolean;
  useMonitoringProjectionApi: boolean;
  useNewCommunicationsEngine: boolean;
}

export const defaultFeatureToggles: FeatureToggles = {
  useNewStudentWrites: true,
  useNewAttendanceEngine: true,
  useNewAssessmentEngine: true,
  useNewImportEngine: true,
  useNewFeesEngine: false,
  useNewFeeReceipts: false,
  useLegacyFeeReads: true,
  useMonitoringProjectionApi: false,
  useNewCommunicationsEngine: false,
};

function mapKey(key: keyof FeatureToggles): string {
  const mapping: Record<keyof FeatureToggles, string> = {
    useNewStudentWrites: "useNewStudentWrites",
    useNewAttendanceEngine: "useNewAttendance",
    useNewAssessmentEngine: "useNewScoring",
    useNewImportEngine: "useNewImport",
    useNewFeesEngine: "useNewFees",
    useNewFeeReceipts: "useNewFeeReceipts",
    useLegacyFeeReads: "useLegacyFeeReads",
    useMonitoringProjectionApi: "useMonitoringProjectionApi",
    useNewCommunicationsEngine: "useNewComms",
  };
  return mapping[key];
}

export function isFeatureEnabled(key: keyof FeatureToggles): boolean {
  const runtimeKey = mapKey(key);
  try {
    return isRuntimeEnabled(runtimeKey as any);
  } catch {
    return defaultFeatureToggles[key];
  }
}

export function setFeature(key: keyof FeatureToggles, enabled: boolean): void {
  const runtimeKey = mapKey(key);
  setRuntimeToggle(runtimeKey as any, enabled);
}

export function resetToggles(): void {
  resetAllToggles();
}
