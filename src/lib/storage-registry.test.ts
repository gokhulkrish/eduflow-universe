import { afterEach, describe, expect, it } from "vitest";
import {
  buildStorageOwnershipReport,
  clearOwnedRuntimeStorage,
  clearStorageNamespace,
  STORAGE_OWNERSHIP_REGISTRY,
} from "./storage-registry";
import { SHELL_RUNTIME_STORAGE_KEY } from "./shell-runtime";
import { THEME_STORAGE_KEY } from "./theme-runtime";
import { registryStorageKey } from "./header-registry";

describe("storage registry", () => {
  afterEach(() => {
    window.localStorage.clear();
    clearOwnedRuntimeStorage();
  });

  it("describes owned runtime storage namespaces", () => {
    window.localStorage.setItem(SHELL_RUNTIME_STORAGE_KEY, JSON.stringify({ theme: "dark" }));
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify("dark"));
    window.localStorage.setItem(registryStorageKey, JSON.stringify({ version: 1 }));
    const report = buildStorageOwnershipReport();
    const shell = report.find((entry) => entry.namespace === "shell");
    const settings = report.find((entry) => entry.namespace === "settings");
    const registry = report.find((entry) => entry.namespace === "registry");
    expect(shell?.presentKeys).toContain(SHELL_RUNTIME_STORAGE_KEY);
    expect(settings?.presentKeys).toContain(THEME_STORAGE_KEY);
    expect(registry?.presentKeys).toContain(registryStorageKey);
    expect(shell?.byteSize ?? 0).toBeGreaterThan(0);
    expect(STORAGE_OWNERSHIP_REGISTRY.length).toBeGreaterThan(0);
  });

  it("clears a named namespace safely", () => {
    window.localStorage.setItem(SHELL_RUNTIME_STORAGE_KEY, JSON.stringify({ theme: "dark" }));
    clearStorageNamespace("shell");
    expect(window.localStorage.getItem(SHELL_RUNTIME_STORAGE_KEY)).toBeNull();
  });
});
