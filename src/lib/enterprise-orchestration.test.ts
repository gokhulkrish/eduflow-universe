import { describe, expect, it, beforeEach } from "vitest";

import {
  bootstrapEnterpriseOrchestration,
  broadcastEnterpriseOrchestration,
  getEnterpriseOrchestrationSnapshot,
  resetEnterpriseOrchestrationRuntime,
  subscribeEnterpriseOrchestrationEvents,
} from "./enterprise-orchestration";

describe("enterprise orchestration", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetEnterpriseOrchestrationRuntime();
  });

  it("builds a combined orchestration snapshot", () => {
    const snapshot = getEnterpriseOrchestrationSnapshot();
    expect(snapshot.channels.length).toBeGreaterThan(0);
    expect(snapshot.summary.modules).toBeGreaterThan(0);
  });

  it("boots without throwing and returns a snapshot", () => {
    const snapshot = bootstrapEnterpriseOrchestration();
    expect(snapshot.health).toMatch(/healthy|watch|blocked/);
    expect(snapshot.summary.signals).toBeGreaterThan(0);
  });

  it("broadcasts scoped orchestration signals to the runtime bus", () => {
    const seen: string[] = [];
    const unsubscribe = subscribeEnterpriseOrchestrationEvents((event) => {
      seen.push(`${event.scope}:${event.reason}`);
    });

    const snapshot = broadcastEnterpriseOrchestration("registry", "registry sync test");
    unsubscribe();

    expect(seen).toContain("registry:registry sync test");
    expect(snapshot.summary.lastScope).toBe("registry");
    expect(snapshot.summary.lastReason).toBe("registry sync test");
  });
});
