import { afterEach, describe, expect, it } from "vitest";
import { setMigrationFlag } from "./featureFlags";
import { isMigrationPatchEnabled, getMigrationRuntimeSnapshot } from "./migrationRuntime";
import { clearRollback, triggerRollback } from "./rollbackRegistry";

describe("migration runtime", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("treats rollbacks as hard stop signals", () => {
    const key = "patch-003-runtime-shell-compatibility";
    setMigrationFlag(key, true);
    expect(isMigrationPatchEnabled(key)).toBe(true);

    triggerRollback(key, "safety check");
    expect(isMigrationPatchEnabled(key)).toBe(false);

    clearRollback(key);
    expect(isMigrationPatchEnabled(key)).toBe(true);
  });

  it("summarizes runtime state", () => {
    const snapshot = getMigrationRuntimeSnapshot();
    expect(snapshot.summary.total).toBeGreaterThan(0);
    expect(snapshot.patches.length).toBe(snapshot.summary.total);
  });
});

