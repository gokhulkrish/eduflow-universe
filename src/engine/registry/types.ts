export type RegistryDataType =
  | 'text'
  | 'number'
  | 'date'
  | 'enum'
  | 'phone'
  | 'email';

export type RegistryFieldGroup =
  | 'identity'
  | 'academic'
  | 'personal'
  | 'family'
  | 'contact'
  | 'administrative'
  | 'custom';

export interface RegistryFieldDefinition {
  key: string;
  label: string;
  aliases: string[];
  dataType: RegistryDataType;
  required: boolean;
  isKeyField: boolean;
  isDuplicateKey: boolean;
  isCustom: boolean;
  isActive: boolean;
  scoringWeight: number;
  group: RegistryFieldGroup;
  dbColumn: string;
  enumValues?: string[];
  validationPattern?: string;
}
