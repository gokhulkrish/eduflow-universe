export type ImportStatus =
  | "draft"
  | "mapped"
  | "keyed"
  | "validated"
  | "previewed"
  | "transferred"
  | "rolled_back";

export type ImportTransferMode = "newentry" | "update" | "upsert" | "skip" | "computed";

export type ImportMatchStrategy =
  | "reg_umis_emis"
  | "registration_only"
  | "umis_only"
  | "name_dob"
  | "fuzzy_name_dob"
  | "reg_or_name_dob"
  | "admission_only"
  | "name_only"
  | "admission_or_name"
  | (string & {});

export type ImportResolvedAction = "insert" | "update" | "skip" | "review";

export type ImportMatchStatus = "exact" | "fuzzy" | "none" | "internal-duplicate";

export type ImportDuplicateGroupDecision =
  | "keep-first"
  | "keep-last"
  | "skip-group"
  | "manual-review"
  | "match-existing";

export interface ImportMappingLine {
  importField: string;
  targetField: string | null;
  transferMode: ImportTransferMode;
  isRequired: boolean;
}

export interface ImportMatchConfig {
  type: string;
  strategy: ImportMatchStrategy;
  fields: string[];
  enabled: boolean;
}

export interface ImportKeyingConfig {
  enabled: boolean;
  importKey: string[];
  duplicateKey: string[];
  sourceFields: string[];
}

export interface ImportRow {
  rowNumber: number;
  sourceData: Record<string, string>;
  targetData: Record<string, string>;
  decision: ImportResolvedAction;
  errors: string[];
  warnings: string[];
  conflictWith: string[];
}

export interface ImportPreviewRow {
  sourceRowIndex: number;
  rowKey: string;
  sourceRow: Record<string, string>;
  mapped: Record<string, string>;
  customValues: Record<string, string>;
  displayName: string;
  admissionNo: string;
  identityKey: string;
  duplicateGroupSize: number;
  duplicateStatus: ImportMatchStatus;
  validationIssues: string[];
  existing: Record<string, unknown> | null;
  matchScore: number;
  matchReason: string;
  defaultAction: ImportResolvedAction;
  action: ImportResolvedAction;
  diffSummary: string[];
}

export interface ImportBatch {
  batchId: string;
  batchName: string;
  batchDescription: string;
  moduleId: string;
  mode: ImportMode;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  defaultImportType: ImportTransferMode;
  transferRule: string | null;
  matchStrategy: ImportMatchStrategy;
  importHeaders: string[];
  sourceRows: Record<string, string>[];
  rowCount: number;
  mappingLines: ImportMappingLine[];
  keyingConfig: ImportKeyingConfig;
  matchKeyConfig: ImportMatchConfig;
  rows: ImportRow[];
  previewRows: ImportPreviewRow[];
  status: ImportStatus;
  validCount: number;
  errorCount: number;
  previewCount: number;
  transferredCount: number;
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  ambiguousCount: number;
  duplicateDecisions: Record<string, string>;
  duplicatePipelineState: Record<string, unknown> | null;
  keyingUiState: {
    isAdvancedOpen: boolean;
    isManualEditing: boolean;
    setupSource: string;
  };
  transferSummaryText: string;
  transferNoteText: string;
  rollbackData: ImportRollbackEntry[];
}

export interface ImportRollbackEntry {
  studentKey: string;
  previousState: Record<string, unknown>;
  changeType: "inserted" | "updated" | "restored";
}

export interface ParsedImportFile {
  fileName: string;
  sourceType: "csv" | "xls" | "xlsx" | "unknown";
  sheetName: string;
  headers: string[];
  rows: Record<string, string>[];
}

export interface ImportCommitRowResult {
  rowKey: string;
  id: string;
  action: "inserted" | "updated" | "skipped" | "failed";
}

export interface ImportCommitResult {
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: { rowNumber: number; message: string }[];
  rowResults?: ImportCommitRowResult[];
}

export type ImportPipelineStep = "create" | "map" | "keying" | "duplicates" | "validate" | "preview" | "transfer";

export interface ImportPipelineAuditEntry {
  step: string;
  timestamp: string;
  message: string;
  extra: Record<string, unknown>;
}

export interface ImportPipelineSnapshot {
  stage: string;
  timestamp: string;
  mappingHash: string;
  keyingHash: string;
  duplicateHash: string;
  validationHash: string;
  previewHash: string;
  batchId: string;
  rowCount: number;
  dirtySteps: Record<string, boolean>;
}

export interface ImportPipelineState {
  sessionId: string;
  currentStep: ImportPipelineStep;
  hash: {
    mapping: string;
    keying: string;
    duplicate: string;
    validation: string;
    preview: string;
  };
  dirtySteps: Record<string, boolean>;
  lockedSteps: Record<string, boolean>;
  audit: {
    trace: ImportPipelineAuditEntry[];
    snapshots: ImportPipelineSnapshot[];
  };
}

export interface ImportPreviewSummary {
  total: number;
  valid: number;
  invalid: number;
  inserts: number;
  updates: number;
  skips: number;
  reviews: number;
  exactMatches: number;
  fuzzyMatches: number;
  internalDuplicates: number;
}

export interface ImportPreviewState {
  rows: ImportPreviewRow[];
  summary: ImportPreviewSummary;
}

export interface ImportError {
  rowNumber: number;
  field: string;
  message: string;
  severity: "error" | "warning" | "blocker";
}

export interface ImportProfile {
  id: string;
  name: string;
  description: string | null;
  version: number;
  rule: string;
  design: ImportMatchStrategy;
  threshold: number;
  mapping: Record<string, string>;
  groupOverrides: Record<string, ImportDuplicateGroupDecision>;
  actionOverrides: Record<string, ImportResolvedAction>;
  customFieldIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type ImportMode = "auto" | "hybrid" | "manual";

export interface ImportModeConfig {
  label: string;
  description: string;
  icon: string;
  requiresUserMapping: boolean;
  requiresConfirmation: boolean;
  autoAdvance: boolean;
}

export const IMPORT_MODE_CONFIGS: Record<ImportMode, ImportModeConfig> = {
  auto: {
    label: "Automatic",
    description: "Fully automated - parses, maps, validates, and imports directly",
    icon: "Zap",
    requiresUserMapping: false,
    requiresConfirmation: false,
    autoAdvance: true,
  },
  hybrid: {
    label: "Hybrid",
    description: "Auto-maps with suggestions, allows overrides before import",
    icon: "RefreshCw",
    requiresUserMapping: false,
    requiresConfirmation: true,
    autoAdvance: false,
  },
  manual: {
    label: "Manual",
    description: "No auto-decisions - requires manual mapping and confirmation",
    icon: "Hand",
    requiresUserMapping: true,
    requiresConfirmation: true,
    autoAdvance: false,
  },
};

export interface ImportModuleFieldDef {
  key: string;
  label: string;
  aliases: string[];
  required?: boolean;
}

export interface ImportModuleFieldGroup {
  title: string;
  fields: ImportModuleFieldDef[];
}

export interface ImportModuleMatchStrategy {
  id: string;
  label: string;
  fields: string[];
}

export interface ImportModuleAdapter {
  loadExistingRecords: () => Promise<Record<string, unknown>[]>;
  commitRows: (
    rows: ImportPreviewRow[],
    batch: ImportBatch,
  ) => Promise<ImportCommitResult>;
  rollbackRows: (
    rollbackData: ImportRollbackEntry[],
  ) => Promise<{ success: boolean; restored: number }>;
}

export interface ImportModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  fieldGroups: ImportModuleFieldGroup[];
  matchStrategies: ImportModuleMatchStrategy[];
  adapter: ImportModuleAdapter;
}
