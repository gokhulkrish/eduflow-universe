export const PIPELINE_STAGES = [
  'analyze',
  'create',
  'map',
  'keying',
  'duplicates',
  'validate',
  'preview',
  'transfer',
  'finalize',
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

export interface EngineContext {
  tenantId: string;
  userId?: string;
  timestamp: string;
}

export const STEP_TO_STAGE: Record<string, PipelineStage> = {
  create: 'analyze',
  map: 'map',
  key: 'keying',
  dupe: 'duplicates',
  validate: 'validate',
  preview: 'preview',
  transfer: 'transfer',
};

export const STAGE_TO_LEGACY_INDEX: Record<PipelineStage, number> = {
  analyze: 0,
  create: 0,
  map: 1,
  keying: 2,
  duplicates: 3,
  validate: 4,
  preview: 5,
  transfer: 6,
  finalize: 7,
};
