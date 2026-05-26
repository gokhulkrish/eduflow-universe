import type {
  ImportBatch,
  ImportPipelineStep,
  ImportPipelineState,
  ImportPipelineAuditEntry,
  ImportPipelineSnapshot,
} from "./types";

export const IMPORT_PIPELINE_STEPS: ImportPipelineStep[] = [
  "analyze",
  "create",
  "map",
  "keying",
  "duplicates",
  "validate",
  "preview",
  "transfer",
  "finalize",
];

export const IMPORT_STEP_DEPENDENCY_MAP: Record<ImportPipelineStep, ImportPipelineStep[]> = {
  analyze: ["create", "map", "keying", "duplicates", "validate", "preview", "transfer", "finalize"],
  create: ["map", "keying", "duplicates", "validate", "preview", "transfer", "finalize"],
  map: ["keying", "duplicates", "validate", "preview", "transfer", "finalize"],
  keying: ["duplicates", "validate", "preview", "transfer", "finalize"],
  duplicates: ["validate", "preview", "transfer", "finalize"],
  validate: ["preview", "transfer", "finalize"],
  preview: ["transfer", "finalize"],
  transfer: ["finalize"],
  finalize: [],
};

export function createImportPipelineState(): ImportPipelineState {
  return {
    sessionId: String(Date.now()),
    currentStep: "analyze",
    hash: { analyze: "", mapping: "", keying: "", duplicate: "", validation: "", preview: "" },
    dirtySteps: {},
    lockedSteps: {},
    audit: { trace: [], snapshots: [] },
  };
}

export function computeImportAnalyzeHash(batch: ImportBatch): string {
  return JSON.stringify({
    headers: batch.importHeaders,
    rowCount: batch.rowCount,
    fileRef: (batch as any).fileRef,
  });
}

export function computeImportMappingHash(batch: ImportBatch): string {
  return JSON.stringify(
    batch.mappingLines.map((l) => ({ t: l.targetField, m: l.transferMode })).sort((a, b) => String(a.t).localeCompare(b.t)),
  );
}

export function computeImportKeyingHash(batch: ImportBatch): string {
  return JSON.stringify({
    strategy: batch.matchStrategy,
    config: batch.keyingConfig,
    matchKeyConfig: batch.matchKeyConfig,
  });
}

export function computeImportDuplicateHash(batch: ImportBatch): string {
  return JSON.stringify({
    decisions: batch.duplicateDecisions,
    pipelineState: batch.duplicatePipelineState,
  });
}

export function computeImportValidationHash(batch: ImportBatch): string {
  return JSON.stringify({
    validCount: batch.validCount,
    errorCount: batch.errorCount,
  });
}

export function computeImportPreviewHash(batch: ImportBatch): string {
  return JSON.stringify({
    previewCount: batch.previewCount,
    rowCount: batch.previewRows.length,
  });
}

export function appendImportAuditTrace(
  pipeline: ImportPipelineState,
  step: string,
  message: string,
  extra: Record<string, unknown> = {},
): ImportPipelineAuditEntry {
  const entry: ImportPipelineAuditEntry = {
    step,
    timestamp: new Date().toISOString(),
    message,
    extra,
  };
  pipeline.audit.trace.push(entry);
  if (pipeline.audit.trace.length > 100) {
    pipeline.audit.trace = pipeline.audit.trace.slice(-100);
  }
  return entry;
}

export function takeImportPipelineSnapshot(
  pipeline: ImportPipelineState,
  stage: string,
  batch: ImportBatch,
): ImportPipelineSnapshot {
  const snapshot: ImportPipelineSnapshot = {
    stage,
    timestamp: new Date().toISOString(),
    analyzeHash: pipeline.hash.analyze,
    mappingHash: pipeline.hash.mapping,
    keyingHash: pipeline.hash.keying,
    duplicateHash: pipeline.hash.duplicate,
    validationHash: pipeline.hash.validation,
    previewHash: pipeline.hash.preview,
    batchId: batch.batchId,
    rowCount: batch.rowCount,
    dirtySteps: { ...pipeline.dirtySteps },
  };
  pipeline.audit.snapshots.push(snapshot);
  if (pipeline.audit.snapshots.length > 20) {
    pipeline.audit.snapshots = pipeline.audit.snapshots.slice(-20);
  }
  return snapshot;
}

export function getImportPipelineTrace(pipeline: ImportPipelineState): ImportPipelineAuditEntry[] {
  return pipeline.audit.trace;
}

export function getImportPipelineSnapshots(pipeline: ImportPipelineState): ImportPipelineSnapshot[] {
  return pipeline.audit.snapshots;
}

export function setImportStepDirtyState(
  pipeline: ImportPipelineState,
  stepName: string,
  dirty: boolean,
  reason = "",
): void {
  pipeline.dirtySteps[stepName] = dirty;
  if (dirty) {
    appendImportAuditTrace(pipeline, stepName, reason || "marked-dirty", {});
  }
}

export function markStepDirty(pipeline: ImportPipelineState, stepName: string, reason?: string): void {
  setImportStepDirtyState(pipeline, stepName, true, reason || "marked dirty");
}

export function clearStepDirty(pipeline: ImportPipelineState, stepName: string): void {
  setImportStepDirtyState(pipeline, stepName, false);
}

export function isStepDirty(pipeline: ImportPipelineState, stepName: string): boolean {
  return !!pipeline.dirtySteps[stepName];
}

export function lockImportStep(pipeline: ImportPipelineState, stepName: string): void {
  pipeline.lockedSteps[stepName] = true;
}

export function unlockImportStep(pipeline: ImportPipelineState, stepName: string): void {
  pipeline.lockedSteps[stepName] = false;
}

export function isImportStepLocked(pipeline: ImportPipelineState, stepName: string): boolean {
  return !!pipeline.lockedSteps[stepName];
}

export function resetImportStepState(pipeline: ImportPipelineState, stepName: ImportPipelineStep, batch: ImportBatch): void {
  switch (stepName) {
    case "analyze":
      batch.importHeaders = [];
      batch.sourceRows = [];
      batch.rowCount = 0;
      pipeline.hash.analyze = "";
      pipeline.hash.mapping = "";
      pipeline.hash.keying = "";
      pipeline.hash.duplicate = "";
      pipeline.hash.validation = "";
      pipeline.hash.preview = "";
      break;
    case "create":
      pipeline.hash.mapping = "";
      pipeline.hash.keying = "";
      pipeline.hash.duplicate = "";
      pipeline.hash.validation = "";
      pipeline.hash.preview = "";
      break;
    case "keying":
      pipeline.hash.keying = "";
      pipeline.hash.duplicate = "";
      pipeline.hash.validation = "";
      pipeline.hash.preview = "";
      break;
    case "duplicates":
      batch.duplicateDecisions = {};
      batch.duplicatePipelineState = null;
      pipeline.hash.duplicate = "";
      pipeline.hash.validation = "";
      pipeline.hash.preview = "";
      break;
    case "validate":
      batch.validCount = 0;
      batch.errorCount = 0;
      pipeline.hash.validation = "";
      pipeline.hash.preview = "";
      break;
    case "preview":
      batch.previewRows = [];
      batch.previewCount = 0;
      pipeline.hash.preview = "";
      break;
    case "transfer":
      batch.status = "draft";
      batch.transferredCount = 0;
      batch.insertedCount = 0;
      batch.updatedCount = 0;
      batch.skippedCount = 0;
      break;
    case "finalize":
    case "map":
      break;
  }
}

export function invalidateDownstreamSteps(pipeline: ImportPipelineState, fromStep: ImportPipelineStep): void {
  const downstream = IMPORT_STEP_DEPENDENCY_MAP[fromStep] || [];
  for (const step of downstream) {
    pipeline.dirtySteps[step] = true;
    pipeline.hash[step as keyof typeof pipeline.hash] = "";
  }
}

export function invalidateImportDownstream(
  pipeline: ImportPipelineState,
  stepName: ImportPipelineStep,
  batch: ImportBatch,
  reason = "",
): ImportPipelineStep[] {
  const downstream = IMPORT_STEP_DEPENDENCY_MAP[stepName] || [];
  for (const step of downstream) {
    pipeline.dirtySteps[step] = true;
    pipeline.hash[step as keyof typeof pipeline.hash] = "";
    resetImportStepState(pipeline, step, batch);
  }
  appendImportAuditTrace(pipeline, stepName, reason || "invalidate-downstream", {
    invalidated: downstream,
    reason,
  });
  return downstream;
}

function doesBatchHaveDualKeyConfig(batch: ImportBatch): boolean {
  return !!(batch.keyingConfig.enabled || batch.duplicateDecisions);
}

export function invalidateDualKeyWorkflow(
  pipeline: ImportPipelineState,
  changeType: "import-key" | "duplicate-config" | "duplicate-decision",
  batch: ImportBatch,
  reason = "",
): void {
  const markDirtyOnly = (step: ImportPipelineStep) => {
    pipeline.dirtySteps[step] = true;
    pipeline.hash[step] = "";
  };

  switch (changeType) {
    case "import-key":
      markDirtyOnly("validate");
      markDirtyOnly("preview");
      markDirtyOnly("transfer");
      if (doesBatchHaveDualKeyConfig(batch)) {
        markDirtyOnly("duplicates");
      }
      break;
    case "duplicate-config":
      markDirtyOnly("duplicates");
      markDirtyOnly("validate");
      markDirtyOnly("preview");
      markDirtyOnly("transfer");
      break;
    case "duplicate-decision":
      markDirtyOnly("validate");
      markDirtyOnly("preview");
      markDirtyOnly("transfer");
      break;
  }

  appendImportAuditTrace(pipeline, "pipeline", reason || `dual-key-${changeType}`, {
    changeType,
  });
}

export function checkStepPrerequisite(
  pipeline: ImportPipelineState,
  stepName: ImportPipelineStep,
  batch: ImportBatch,
): { pass: boolean; reason: string } {
  const currentHash = {
    analyze: computeImportAnalyzeHash(batch),
    mapping: computeImportMappingHash(batch),
    keying: computeImportKeyingHash(batch),
    duplicate: computeImportDuplicateHash(batch),
    validation: computeImportValidationHash(batch),
    preview: computeImportPreviewHash(batch),
  };

  switch (stepName) {
    case "create":
      if (pipeline.hash.analyze && pipeline.hash.analyze !== currentHash.analyze) {
        pipeline.dirtySteps.analyze = true;
        return { pass: false, reason: "Analysis is stale. Re-analyze the file first." };
      }
      break;
    case "map":
      if (!batch.importHeaders.length) {
        return { pass: false, reason: "No import headers available. Upload a file first." };
      }
      break;
    case "keying":
      if (!batch.mappingLines.length) {
        return { pass: false, reason: "No field mappings configured. Complete mapping first." };
      }
      break;
    case "duplicates": {
      if (pipeline.hash.keying && pipeline.hash.keying !== currentHash.keying) {
        pipeline.dirtySteps.keying = true;
        return { pass: false, reason: "Keying config changed. Refresh keying before entering duplicates." };
      }
      break;
    }
    case "validate":
      if (isStepDirty(pipeline, "duplicates")) {
        return { pass: false, reason: "Duplicate decisions are stale. Refresh duplicates before validation." };
      }
      break;
    case "preview":
      if (isStepDirty(pipeline, "validate")) {
        return { pass: false, reason: "Validation is stale. Re-validate before preview." };
      }
      if (batch.errorCount > 0) {
        return { pass: false, reason: "Validation errors prevent preview. Resolve blockers first." };
      }
      break;
    case "transfer": {
      if (pipeline.hash.preview && pipeline.hash.preview !== currentHash.preview) {
        return { pass: false, reason: "Preview is stale. Regenerate preview before transfer." };
      }
      if (isStepDirty(pipeline, "validate")) {
        return { pass: false, reason: "Validation is stale. Re-validate before transfer." };
      }
      break;
    }
    case "finalize":
      if (batch.status !== "transferred") {
        return { pass: false, reason: "Transfer must complete before finalizing." };
      }
      break;
    case "analyze":
      break;
  }

  return { pass: true, reason: "" };
}

export function refreshCanonicalPipelineState(pipeline: ImportPipelineState, batch: ImportBatch): void {
  pipeline.hash.analyze = computeImportAnalyzeHash(batch);
  pipeline.hash.mapping = computeImportMappingHash(batch);
  pipeline.hash.keying = computeImportKeyingHash(batch);
  pipeline.hash.duplicate = computeImportDuplicateHash(batch);
  pipeline.hash.validation = computeImportValidationHash(batch);
  pipeline.hash.preview = computeImportPreviewHash(batch);

  appendImportAuditTrace(pipeline, "pipeline", "state-refreshed", {
    analyzeHash: pipeline.hash.analyze,
    mappingHash: pipeline.hash.mapping,
    keyingHash: pipeline.hash.keying,
  });
}

export function resetImportPipelineState(pipeline: ImportPipelineState): void {
  pipeline.sessionId = String(Date.now());
  pipeline.currentStep = "analyze";
  pipeline.hash = { analyze: "", mapping: "", keying: "", duplicate: "", validation: "", preview: "" };
  pipeline.dirtySteps = {};
  pipeline.lockedSteps = {};
  pipeline.audit.trace = [];
  pipeline.audit.snapshots = [];
}

export function getStepIndex(stepName: ImportPipelineStep): number {
  return IMPORT_PIPELINE_STEPS.indexOf(stepName);
}

export function getStepName(index: number): ImportPipelineStep {
  return IMPORT_PIPELINE_STEPS[index] || "create";
}

export function canNavigateToStep(
  pipeline: ImportPipelineState,
  targetStep: ImportPipelineStep,
  batch: ImportBatch,
): { allowed: boolean; reason?: string } {
  const targetIndex = getStepIndex(targetStep);
  const currentIndex = getStepIndex(pipeline.currentStep);

  if (isImportStepLocked(pipeline, targetStep)) {
    return { allowed: false, reason: `Step "${targetStep}" is locked.` };
  }

  if (targetIndex > currentIndex + 1) {
    return { allowed: false, reason: "Complete intermediate steps first." };
  }

  const prerequisite = checkStepPrerequisite(pipeline, targetStep, batch);
  if (!prerequisite.pass) {
    return { allowed: false, reason: prerequisite.reason };
  }

  return { allowed: true };
}
