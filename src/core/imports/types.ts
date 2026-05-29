export type ImportEntityType =
  | 'students'
  | 'attendance'
  | 'fees'
  | 'assessment';

export type ImportBatchStatus =
  | 'draft'
  | 'validating'
  | 'validated'
  | 'ready_to_apply'
  | 'applying'
  | 'applied'
  | 'archived'
  | 'failed';

export type ImportBatchState =
  | 'draft'
  | 'uploaded'
  | 'keying'
  | 'duplicates'
  | 'validating'
  | 'preview'
  | 'ready_to_transfer'
  | 'transferring'
  | 'completed'
  | 'failed'
  | 'expired';

export interface ImportContext {
  tenantId: string;
  batchId: string;
  entityType: ImportEntityType;
  templateVersion: string;
  schemaVersion: string;
}

export interface ImportValidationIssue {
  rowIndex: number;
  fieldName?: string;
  errorCode: string;
  message: string;
}

export interface ImportEntityConfig<TNormalized> {
  entityType: ImportEntityType;
  normalizeRow(raw: Record<string, unknown>, ctx: ImportContext): TNormalized;
  validateRow(normalized: TNormalized, ctx: ImportContext): ImportValidationIssue[];
  matchExisting(normalized: TNormalized, ctx: ImportContext): Promise<'none' | 'single' | 'multiple'>;
  applyRow(normalized: TNormalized, ctx: ImportContext): Promise<void>;
}

export interface KeyingConfig {
  separator: string;
  fields: string[];
  fuzzyThreshold?: number;
}

export type DuplicateDecision =
  | 'keep_existing'
  | 'update_existing'
  | 'create_new'
  | 'merge_manual'
  | 'skip';


