export type { RegistryFieldDefinition, RegistryDataType, RegistryFieldGroup } from './types';
export {
  CANONICAL_FIELDS,
  CANONICAL_FIELD_INDEX,
  getFieldByKey,
  getFieldByDbColumn,
  getFieldsByGroup,
  getActiveFields,
  getKeyFields,
  getDuplicateKeyFields,
  getScoringWeights,
} from './canonical';
