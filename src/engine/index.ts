export { PIPELINE_STAGES, STEP_TO_STAGE, STAGE_TO_LEGACY_INDEX } from './types';
export type { PipelineStage, EngineContext } from './types';

export { eventBus, EventBus } from './events';
export type { EngineEvent, EngineEventPayloads } from './events';

export { CANONICAL_FIELDS, getFieldByKey, getFieldByDbColumn, getFieldsByGroup, getActiveFields, getKeyFields, getDuplicateKeyFields, getScoringWeights } from './registry';
export type { RegistryFieldDefinition, RegistryDataType, RegistryFieldGroup } from './registry';

export { isComplete, getDisplayName, bulkTransfer } from './students';
export type { StudentRecord, StudentIdentity, StudentPersonal, StudentAcademic, StudentFamily, StudentContact, StudentAdministrative } from './students/types';

export { computeDataCompleteness, computePerformanceScore, getScoreBand, getScoreLabel } from './scoring';
export type { CompletenessConfig, PerformanceInput, PerformanceConfig } from './scoring';
