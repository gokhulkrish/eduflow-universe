import { supabase } from "@/integrations/supabase/client";
import { CANONICAL_FIELDS } from "@/engine/registry/canonical";
import type { ImportBatch } from "./types";

export type BackendEnumValidationError = {
  field: string;
  value: string;
  valid: string[];
};

export type ImportDependencyError = {
  type: "concurrent-import" | "stale-schema" | "table-unavailable";
  message: string;
  detail?: string;
};

export type PreCommitValidationResult = {
  valid: boolean;
  enumErrors: BackendEnumValidationError[];
  dependencyErrors: ImportDependencyError[];
};

export async function validateEnumsOnServer(
  rows: Record<string, string | null | undefined>[],
): Promise<BackendEnumValidationError[]> {
  try {
    const payload = rows.map((row) => {
      const obj: Record<string, string> = {};
      for (const field of CANONICAL_FIELDS) {
        if (field.dataType === "enum" && field.enumValues) {
          const val = row[field.key];
          if (val && val.trim()) {
            obj[field.key] = val.trim();
          }
        }
      }
      return obj;
    }).filter((obj) => Object.keys(obj).length > 0);

    if (payload.length === 0) return [];

    const { data, error } = await (supabase.rpc as any)(
      "validate_import_enums",
      { payload: JSON.stringify(payload) },
    );

    if (error) throw error;
    if (!data) return [];

    const parsed: BackendEnumValidationError[] = Array.isArray(data)
      ? data.map((e: Record<string, unknown>) => ({
          field: String(e.field),
          value: String(e.value),
          valid: Array.isArray(e.valid) ? e.valid.map(String) : [],
        }))
      : [];

    return parsed;
  } catch {
    // If RPC is not available (no backend), return empty and let client-side validation handle it
    return [];
  }
}

export async function checkImportDependencies(
  currentBatchId: string | null,
): Promise<ImportDependencyError[]> {
  const errors: ImportDependencyError[] = [];

  try {
    // Check for concurrent imports
    const { data: concurrentBatches, error: batchError } = await supabase
      .from("import_batches")
      .select("id, name, status, updated_at")
      .in("status", ["uploaded", "keying", "duplicates", "validating", "preview", "ready_to_transfer", "transferring"]);

    if (!batchError && concurrentBatches) {
      const active = concurrentBatches.filter(
        (b: Record<string, unknown>) => b.id !== currentBatchId,
      );
      if (active.length > 0) {
        for (const batch of active) {
          errors.push({
            type: "concurrent-import",
            message: `Another import "${batch.name || batch.id}" is currently in "${batch.status}" state.`,
            detail: `Batch ${batch.id} was last updated at ${batch.updated_at}. Only one import can proceed at a time to avoid data conflicts.`,
          });
        }
      }
    }
  } catch {
    // Table might not exist yet
  }

  return errors;
}

export async function runPreCommitValidation(
  rows: Record<string, string | null | undefined>[],
  currentBatchId: string | null,
  signal?: AbortSignal,
): Promise<PreCommitValidationResult> {
  if (signal?.aborted) return { valid: false, enumErrors: [], dependencyErrors: [{ type: "concurrent-import", message: "Cancelled before validation", detail: "The import was cancelled before pre-commit validation could complete." }] };

  const [enumErrors, dependencyErrors] = await Promise.all([
    validateEnumsOnServer(rows),
    checkImportDependencies(currentBatchId),
  ]);

  const valid = enumErrors.length === 0 && dependencyErrors.length === 0;

  return { valid, enumErrors, dependencyErrors };
}
