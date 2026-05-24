import { describe, it, expect, beforeEach } from "vitest";
import {
  isFeatureEnabled,
  setFeatureToggle,
  resetFeatureToggles,
  FEATURE_TOGGLE_DEFAULTS,
} from "./featureToggles";

describe("featureToggles", () => {
  beforeEach(() => {
    resetFeatureToggles();
  });

  it("returns default values when no overrides set", () => {
    expect(isFeatureEnabled("useNewStudentWrites")).toBe(FEATURE_TOGGLE_DEFAULTS.useNewStudentWrites);
    expect(isFeatureEnabled("useNewAttendance")).toBe(FEATURE_TOGGLE_DEFAULTS.useNewAttendance);
    expect(isFeatureEnabled("useNewComms")).toBe(FEATURE_TOGGLE_DEFAULTS.useNewComms);
  });

  it("allows setting overrides", () => {
    setFeatureToggle("useNewComms", true);
    expect(isFeatureEnabled("useNewComms")).toBe(true);
  });

  it("allows disabling features", () => {
    setFeatureToggle("useNewStudentWrites", false);
    expect(isFeatureEnabled("useNewStudentWrites")).toBe(false);
  });

  it("resets all toggles", () => {
    setFeatureToggle("useNewAttendance", false);
    resetFeatureToggles();
    expect(isFeatureEnabled("useNewAttendance")).toBe(FEATURE_TOGGLE_DEFAULTS.useNewAttendance);
  });
});
