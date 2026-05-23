import { describe, expect, it } from "vitest";
import { buildMigrationRegistrySnapshot, getMigrationModule, getMigrationModulesByDomain } from "./migration-registry";

describe("migration registry", () => {
  it("builds a populated snapshot from the module inventory", () => {
    const snapshot = buildMigrationRegistrySnapshot();
    expect(snapshot.summary.totalModules).toBeGreaterThan(0);
    expect(snapshot.modules.length).toBe(snapshot.summary.totalModules);
    expect(snapshot.summary.domains).toBeGreaterThan(0);
  });

  it("indexes known modules", () => {
    const module = getMigrationModule("import-create");
    expect(module).toBeDefined();
    expect(module?.label).toContain("Import");
    expect(module?.compatibility).toBe("compatible");
  });

  it("groups modules by domain", () => {
    const domains = getMigrationModulesByDomain();
    expect(domains.length).toBeGreaterThan(0);
    expect(domains.some((domain) => domain.domainLabel === "Import & Data Quality")).toBe(true);
  });
});

