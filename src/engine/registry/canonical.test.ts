import { describe, it, expect } from 'vitest';
import {
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
import type { RegistryFieldDefinition } from './types';

describe('CANONICAL_FIELDS', () => {
  it('has at least 30 defined fields', () => {
    expect(CANONICAL_FIELDS.length).toBeGreaterThanOrEqual(30);
  });

  it('all fields have unique keys', () => {
    const keys = CANONICAL_FIELDS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('all fields have unique dbColumn entries', () => {
    const cols = CANONICAL_FIELDS.map((f) => f.dbColumn);
    expect(new Set(cols).size).toBe(cols.length);
  });

  it('all fields have non-empty aliases array', () => {
    for (const field of CANONICAL_FIELDS) {
      expect(field.aliases.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('registrationNumber is marked as key and duplicate key', () => {
    const reg = CANONICAL_FIELDS.find((f) => f.key === 'registrationNumber');
    expect(reg).toBeDefined();
    expect(reg!.isKeyField).toBe(true);
    expect(reg!.isDuplicateKey).toBe(true);
    expect(reg!.required).toBe(true);
    expect(reg!.scoringWeight).toBe(10);
  });

  it('required fields have scoringWeight >= 5', () => {
    for (const field of CANONICAL_FIELDS) {
      if (field.required) {
        expect(field.scoringWeight).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it('all scoring weights are positive', () => {
    for (const field of CANONICAL_FIELDS) {
      expect(field.scoringWeight).toBeGreaterThan(0);
    }
  });

  it('keyFields include registrationNumber, umis, emis', () => {
    const keys = getKeyFields().map((f) => f.key);
    expect(keys).toContain('registrationNumber');
    expect(keys).toContain('umis');
    expect(keys).toContain('emis');
  });
});

describe('CANONICAL_FIELD_INDEX', () => {
  it('is populated for all fields', () => {
    expect(Object.keys(CANONICAL_FIELD_INDEX).length).toBe(CANONICAL_FIELDS.length);
  });

  it('getFieldByKey returns correct field', () => {
    expect(getFieldByKey('firstName')?.label).toBe('First Name');
    expect(getFieldByKey('nonexistent')).toBeUndefined();
  });

  it('getFieldByDbColumn returns correct field', () => {
    expect(getFieldByDbColumn('admission_no')?.key).toBe('registrationNumber');
    expect(getFieldByDbColumn('nonexistent')).toBeUndefined();
  });
});

describe('getFieldsByGroup', () => {
  it('returns all fields in the identity group', () => {
    const identity = getFieldsByGroup('identity');
    expect(identity.length).toBeGreaterThanOrEqual(3);
    expect(identity.map((f) => f.key)).toContain('registrationNumber');
  });

  it('returns empty for unused group', () => {
    expect(getFieldsByGroup('custom')).toEqual([]);
  });
});

describe('getActiveFields', () => {
  it('returns only active fields', () => {
    const active = getActiveFields();
    expect(active.length).toBeLessThanOrEqual(CANONICAL_FIELDS.length);
    for (const field of active) {
      expect(field.isActive).toBe(true);
    }
  });
});

describe('getScoringWeights', () => {
  it('returns all fields with weight and required flag', () => {
    const result = getScoringWeights();
    expect(result.fields.length).toBe(CANONICAL_FIELDS.length);
    for (const f of result.fields) {
      expect(f.weight).toBeGreaterThan(0);
    }
  });
});
