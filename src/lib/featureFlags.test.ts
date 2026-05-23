import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  MIGRATION_PATCH_FLAGS,
  loadMigrationFlagSnapshot,
  resetMigrationFlags,
  setMigrationFlag,
  toggleMigrationFlag,
} from "./featureFlags";

describe("migration feature flags", () => {
  const originalEnv = process.env.VITE_MIGRATION_FLAGS;

  beforeEach(() => {
    window.localStorage.clear();
    delete process.env.VITE_MIGRATION_FLAGS;
  });

  afterEach(() => {
    window.localStorage.clear();
    if (originalEnv === undefined) {
      delete process.env.VITE_MIGRATION_FLAGS;
    } else {
      process.env.VITE_MIGRATION_FLAGS = originalEnv;
    }
  });

  it("uses declared defaults when nothing is stored", () => {
    const snapshot = loadMigrationFlagSnapshot();
    expect(snapshot.flags[MIGRATION_PATCH_FLAGS[0].key].enabled).toBe(true);
    expect(snapshot.flags[MIGRATION_PATCH_FLAGS[2].key].enabled).toBe(false);
  });

  it("persists toggles to local storage", () => {
    const key = MIGRATION_PATCH_FLAGS[2].key;
    expect(loadMigrationFlagSnapshot().flags[key].enabled).toBe(false);

    toggleMigrationFlag(key);
    expect(loadMigrationFlagSnapshot().flags[key].enabled).toBe(true);

    setMigrationFlag(key, false);
    expect(loadMigrationFlagSnapshot().flags[key].enabled).toBe(false);
  });

  it("respects environment overrides", () => {
    process.env.VITE_MIGRATION_FLAGS = `${MIGRATION_PATCH_FLAGS[2].key}=true`;
    const snapshot = loadMigrationFlagSnapshot();
    expect(snapshot.flags[MIGRATION_PATCH_FLAGS[2].key].enabled).toBe(true);
    expect(snapshot.flags[MIGRATION_PATCH_FLAGS[2].key].source).toBe("environment");
  });

  it("resets to defaults", () => {
    const key = MIGRATION_PATCH_FLAGS[2].key;
    toggleMigrationFlag(key);
    expect(loadMigrationFlagSnapshot().flags[key].enabled).toBe(true);
    resetMigrationFlags();
    expect(loadMigrationFlagSnapshot().flags[key].enabled).toBe(false);
  });
});

