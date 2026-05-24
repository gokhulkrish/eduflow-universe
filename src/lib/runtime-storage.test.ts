import { afterEach, describe, expect, it, vi } from "vitest";

describe("runtime storage shim", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("installs a memory-backed localStorage when the host does not provide one", async () => {
    vi.stubGlobal("localStorage", undefined);

    const { getRuntimeStorage } = await import("./runtime-storage");
    const storage = getRuntimeStorage();

    storage.setItem("shim-check", "ok");

    expect(storage.getItem("shim-check")).toBe("ok");
    expect((globalThis as typeof globalThis & { localStorage: Storage }).localStorage.getItem("shim-check")).toBe("ok");
  });
});
