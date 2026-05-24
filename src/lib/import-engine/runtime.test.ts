import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./batch", () => ({
  setupDatabase: vi.fn(async () => ({} as IDBDatabase)),
}));

vi.mock("./module-registry", () => ({
  loadInitialModules: vi.fn(async () => undefined),
}));

vi.mock("./parser", () => ({
  parseImportFile: vi.fn(async (file: File) => ({
    fileName: file.name,
    sourceType: "csv",
    sheetName: "Sheet1",
    headers: ["name"],
    rows: [{ name: "Alice" }],
  })),
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("import engine runtime", () => {
  it("bootstraps the import engine once per session", async () => {
    const runtime = await import("./runtime");
    const batchModule = await import("./batch");
    const moduleRegistry = await import("./module-registry");

    await Promise.all([runtime.bootstrapImportEngine(), runtime.bootstrapImportEngine()]);

    expect(batchModule.setupDatabase).toHaveBeenCalledTimes(1);
    expect(moduleRegistry.loadInitialModules).toHaveBeenCalledTimes(1);
    expect(runtime.getImportEngineRuntimeSnapshot().initialized).toBe(true);
  });

  it("caches parsed files by signature", async () => {
    const runtime = await import("./runtime");
    const parserModule = await import("./parser");

    const file = new File(["name\nAlice"], "students.csv", {
      type: "text/csv",
      lastModified: 1700000000000,
    });

    const first = await runtime.parseImportFileCached(file);
    const second = await runtime.parseImportFileCached(file);
    const third = await runtime.parseImportFileCached(file);

    expect(first).toEqual(second);
    expect(second).toEqual(third);
    expect(parserModule.parseImportFile).toHaveBeenCalledTimes(1);
    expect(runtime.getImportEngineRuntimeSnapshot().lastParseSignature).toBe(
      runtime.getImportFileSignature(file),
    );
  });

  it("resets the active import session without clearing the parse cache", async () => {
    const runtime = await import("./runtime");
    const parserModule = await import("./parser");

    const file = new File(["name\nAlice"], "students.csv", {
      type: "text/csv",
      lastModified: 1700000000000,
    });

    await runtime.parseImportFileCached(file);
    runtime.setImportRuntimeActiveBatch("batch-123");
    runtime.resetImportEngineSession();

    expect(runtime.getImportEngineRuntimeSnapshot().activeBatchId).toBeNull();
    expect(runtime.getImportEngineRuntimeSnapshot().activeFileSignature).toBeNull();

    await runtime.parseImportFileCached(file);
    expect(parserModule.parseImportFile).toHaveBeenCalledTimes(1);
  });
});
