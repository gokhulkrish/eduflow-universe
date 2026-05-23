import { afterEach, describe, expect, it } from "vitest";
import { clearRollback, loadRollbackSnapshot, resetRollbackRegistry, triggerRollback } from "./rollbackRegistry";

describe("rollback registry", () => {
  afterEach(() => {
    window.localStorage.clear();
    resetRollbackRegistry();
  });

  it("arms and clears a rollback flag", () => {
    const key = "patch-003-runtime-shell-compatibility";
    expect(loadRollbackSnapshot().rollbacks[key].active).toBe(false);

    triggerRollback(key, "test rollback");
    expect(loadRollbackSnapshot().rollbacks[key].active).toBe(true);
    expect(loadRollbackSnapshot().rollbacks[key].reason).toBe("test rollback");

    clearRollback(key);
    expect(loadRollbackSnapshot().rollbacks[key].active).toBe(false);
  });
});

