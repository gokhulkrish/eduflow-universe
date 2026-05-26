import { setupDatabase } from "./batch";
import { loadInitialModules } from "./module-registry";
import { parseImportFile } from "./parser";
import type { ParsedImportFile } from "./types";

export interface ImportEngineRuntimeSnapshot {
  initialized: boolean;
  initializing: boolean;
  initError: string | null;
  sessionId: string;
  activeFileSignature: string | null;
  activeBatchId: string | null;
  lastParseSignature: string | null;
  lastParseAt: string | null;
  cacheSize: number;
}

type ImportParseOptions = {
  csvDelimiter?: string;
};

const runtime = {
  initialized: false,
  initializing: false,
  initError: null as string | null,
  sessionId: createSessionId(),
  activeFileSignature: null as string | null,
  activeBatchId: null as string | null,
  lastParseSignature: null as string | null,
  lastParseAt: null as string | null,
};

const listeners = new Set<() => void>();
const parseCache = new Map<string, ParsedImportFile>();
const parseRequests = new Map<string, Promise<ParsedImportFile>>();

let initPromise: Promise<void> | null = null;

function createSessionId(): string {
  return `import_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function setActiveSessionValues(updater: Partial<typeof runtime>): void {
  Object.assign(runtime, updater);
  emit();
}

export function getImportEngineRuntimeSnapshot(): ImportEngineRuntimeSnapshot {
  return {
    initialized: runtime.initialized,
    initializing: runtime.initializing,
    initError: runtime.initError,
    sessionId: runtime.sessionId,
    activeFileSignature: runtime.activeFileSignature,
    activeBatchId: runtime.activeBatchId,
    lastParseSignature: runtime.lastParseSignature,
    lastParseAt: runtime.lastParseAt,
    cacheSize: parseCache.size,
  };
}

export function subscribeImportEngineRuntime(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function bootstrapImportEngine(): Promise<void> {
  if (runtime.initialized) return;
  if (initPromise) return initPromise;

  const promise = (async () => {
    await setupDatabase();
    await loadInitialModules();
    runtime.initialized = true;
    runtime.initError = null;
  })()
    .catch((error: unknown) => {
      runtime.initError = error instanceof Error ? error.message : "Failed to bootstrap import engine";
      throw error;
    })
    .finally(() => {
      runtime.initializing = false;
      initPromise = null;
      emit();
    });

  runtime.initializing = true;
  runtime.initError = null;
  initPromise = promise;
  emit();

  return initPromise;
}

export function getImportFileSignature(
  file: File,
  options: ImportParseOptions = {},
): string {
  return [
    file.name,
    file.size,
    file.lastModified,
    file.type || "",
    options.csvDelimiter || "",
  ].join("|");
}

export function resetImportEngineSession(reason = "manual-reset"): void {
  setActiveSessionValues({
    sessionId: createSessionId(),
    activeFileSignature: null,
    activeBatchId: null,
    lastParseSignature: null,
    lastParseAt: null,
    initError: null,
  });
  void reason;
}

export function setImportRuntimeActiveBatch(batchId: string | null): void {
  setActiveSessionValues({ activeBatchId: batchId });
}

export function setActiveImportFileSignature(signature: string | null): void {
  setActiveSessionValues({ activeFileSignature: signature });
}

export async function parseImportFileCached(
  file: File,
  options: ImportParseOptions = {},
): Promise<ParsedImportFile> {
  const signature = getImportFileSignature(file, options);
  runtime.activeFileSignature = signature;
  emit();

  const cached = parseCache.get(signature);
  if (cached) {
    runtime.lastParseSignature = signature;
    runtime.lastParseAt = new Date().toISOString();
    emit();
    return cached;
  }

  const pending = parseRequests.get(signature);
  if (pending) {
    const parsed = await pending;
    runtime.lastParseSignature = signature;
    runtime.lastParseAt = new Date().toISOString();
    emit();
    return parsed;
  }

  const request = parseImportFile(file, options).then((parsed) => {
    parseCache.set(signature, parsed);
    runtime.lastParseSignature = signature;
    runtime.lastParseAt = new Date().toISOString();
    emit();
    return parsed;
  });

  parseRequests.set(signature, request);

  try {
    return await request;
  } finally {
    parseRequests.delete(signature);
  }
}

export function clearImportParseCache(): void {
  parseCache.clear();
  parseRequests.clear();
  emit();
}
