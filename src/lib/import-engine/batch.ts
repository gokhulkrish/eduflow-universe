import type { ImportBatch, ImportMode } from "./types";
import { makeBatchId, nowIso, normalizeText, normalizeImportDefaultType, cloneImportMatchConfig, normalizeImportMatchConfig, buildDefaultImportMatchConfig } from "./core";
import { extractImportHeadersFromRows } from "./parser";
import { buildDefaultImportMapping } from "./mapping";
import { emitAppSync } from "@/lib/app-sync";

export const importBatchSyncKey = "sms.import-batches.v1";

export const APP_DB_NAME = "smsImportDB";
export const APP_DB_VERSION = 1;
export const BATCH_STORE_NAME = "importBatches";

let dbInit: Promise<IDBDatabase> | null = null;

export function getBatchDb(): Promise<IDBDatabase | null> {
  return dbInit ?? Promise.resolve(null);
}

export function setupDatabase(): Promise<IDBDatabase> {
  if (dbInit) return dbInit;
  dbInit = new Promise((resolve, reject) => {
    const request = indexedDB.open(APP_DB_NAME, APP_DB_VERSION);

    request.onupgradeneeded = (e) => {
      const database = (e.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(BATCH_STORE_NAME)) {
        const store = database.createObjectStore(BATCH_STORE_NAME, {
          keyPath: "batchId",
        });
        store.createIndex("status", "status");
        store.createIndex("createdAt", "createdAt");
        store.createIndex("batchName", "batchName");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { dbInit = null; reject(request.error); };
    request.onblocked = () => { dbInit = null; reject(new Error("IndexedDB blocked")); };
  });
  return dbInit;
}

export function createImportBatch(
  meta: Partial<{
    batchName: string;
    batchDescription: string;
    moduleId: string;
    mode: ImportMode;
    sourceRows: Record<string, string>[];
    importHeaders: string[];
    defaultImportType: string;
    transferRule: string | null;
    matchStrategy: string;
    keyingConfig: Partial<ImportBatch["keyingConfig"]>;
    matchKeyConfig: Partial<ImportBatch["matchKeyConfig"]>;
  }>,
): ImportBatch {
  const sourceRows = Array.isArray(meta.sourceRows)
    ? meta.sourceRows.map((row) =>
        row && typeof row === "object" ? { ...row } : row,
      )
    : [];

  const importHeaders =
    Array.isArray(meta.importHeaders) && meta.importHeaders.length
      ? [...meta.importHeaders]
      : extractImportHeadersFromRows(sourceRows);

  const batchName = normalizeText(
    meta.batchName || `Import Batch ${new Date().toLocaleString()}`,
  );
  const batchDescription = normalizeText(meta.batchDescription || "");
  const transferRule = meta.transferRule ?? (meta.defaultImportType || null);
  const defaultImportType = normalizeImportDefaultType(
    meta.defaultImportType || "newentry",
  );
  const matchStrategy = (normalizeText(meta.matchStrategy || "reg_umis_emis") ||
    "reg_umis_emis") as ImportBatch["matchStrategy"];

  const keyingConfig = {
    enabled: meta.keyingConfig?.enabled ?? true,
    importKey: meta.keyingConfig?.importKey || [],
    duplicateKey: meta.keyingConfig?.duplicateKey || [],
    sourceFields: meta.keyingConfig?.sourceFields || [],
  };

  const matchKeyConfig = cloneImportMatchConfig(
    normalizeImportMatchConfig(
      meta.matchKeyConfig || buildDefaultImportMatchConfig(matchStrategy),
      matchStrategy,
    ),
  );

  return {
    batchId: makeBatchId(),
    batchName,
    batchDescription,
    moduleId: meta.moduleId || "students",
    mode: meta.mode || "hybrid",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    startedAt: null,
    completedAt: null,
    defaultImportType,
    transferRule,
    matchStrategy,
    keyingConfig,
    matchKeyConfig: matchKeyConfig!,
    importHeaders,
    sourceRows,
    mappingLines: buildDefaultImportMapping(importHeaders, defaultImportType, {
      matchStrategy,
    }),
    rows: [],
    previewRows: [],
    status: "draft",
    rowCount: sourceRows.length,
    validCount: 0,
    errorCount: 0,
    previewCount: 0,
    transferredCount: 0,
    insertedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    ambiguousCount: 0,
    duplicateDecisions: {},
    duplicatePipelineState: null,
    keyingUiState: {
      isAdvancedOpen: false,
      isManualEditing: !!keyingConfig.enabled,
      setupSource: "Manual",
    },
    transferSummaryText: "",
    transferNoteText: "",
    rollbackData: [],
  };
}

export async function saveImportBatches(
  list: ImportBatch[],
): Promise<void> {
  const database = await setupDatabase();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(BATCH_STORE_NAME, "readwrite");
    const store = tx.objectStore(BATCH_STORE_NAME);

    for (const batch of list) {
      batch.updatedAt = nowIso();
      try {
        store.put(batch);
      } catch (error) {
        reject(error);
        return;
      }
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadImportBatchesFromDB(): Promise<ImportBatch[]> {
  const database = await setupDatabase();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(BATCH_STORE_NAME, "readonly");
    const store = tx.objectStore(BATCH_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function getImportBatchById(
  batchId: string,
): Promise<ImportBatch | null> {
  const database = await setupDatabase();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(BATCH_STORE_NAME, "readonly");
    const store = tx.objectStore(BATCH_STORE_NAME);
    const request = store.get(batchId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function deleteImportBatch(
  batchId: string,
): Promise<void> {
  const database = await setupDatabase();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(BATCH_STORE_NAME, "readwrite");
    const store = tx.objectStore(BATCH_STORE_NAME);
    store.delete(batchId);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  emitAppSync(importBatchSyncKey);
}

export async function saveCurrentImportBatch(
  batch: ImportBatch,
): Promise<void> {
  if (!batch) return;
  batch.updatedAt = nowIso();
  await saveImportBatches([batch]);
  emitAppSync(importBatchSyncKey);
}

export function setActiveImportBatch(
  batch: ImportBatch | null,
  appState: { import: { batch: ImportBatch | null } },
  options: { syncRuntime?: boolean } = {},
): void {
  if (!batch) {
    appState.import.batch = null;
    return;
  }

  appState.import.batch = batch;
}
