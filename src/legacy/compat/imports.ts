// Patch 00 — Skeleton. Stub for legacy import compatibility.
// Import engine is implemented at src/lib/import-engine/.

export interface LegacyImportFilter {
  batchId?: string;
  module?: string;
  status?: string;
}

export interface LegacyImportSummary {
  batchId: string;
  module: string;
  fileName: string;
  rowCount: number;
  status: string;
  createdAt: string;
}

export async function getImportsLegacyCompatible(
  _filter: LegacyImportFilter,
): Promise<LegacyImportSummary[]> {
  throw new Error("getImportsLegacyCompatible: not implemented — wired in a later patch");
}
