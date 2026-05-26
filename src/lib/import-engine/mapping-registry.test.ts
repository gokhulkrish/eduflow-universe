import { describe, it, expect, beforeEach } from 'vitest';
import { resolveImportMappingEngineMatch, invalidateRegistryAliasIndex } from './mapping';

describe('resolveImportMappingEngineMatch (registry-backed)', () => {
  beforeEach(() => {
    invalidateRegistryAliasIndex();
  });

  it('matches exact header from hardcoded rules', () => {
    const result = resolveImportMappingEngineMatch('first name');
    expect(result.targetField).toBe('firstName');
    expect(result.isRequired).toBe(true);
  });

  it('matches alias from canonical registry', () => {
    const result = resolveImportMappingEngineMatch('reg_no');
    expect(result.targetField).toBe('registrationNumber');
    expect(result.isRequired).toBe(true);
  });

  it('matches alias variant from canonical registry', () => {
    const result = resolveImportMappingEngineMatch('registration_no');
    expect(result.targetField).toBe('registrationNumber');
  });

  it('matches UMIS alias from registry', () => {
    const result = resolveImportMappingEngineMatch('umis_id');
    expect(result.targetField).toBe('umis');
  });

  it('matches father aliases from registry', () => {
    const result = resolveImportMappingEngineMatch('father name');
    expect(result.targetField).toBe('fatherName');
  });

  it('matches mother aliases from registry', () => {
    const result = resolveImportMappingEngineMatch('mother name');
    expect(result.targetField).toBe('motherName');
  });

  it('returns null for unrecognised header', () => {
    const result = resolveImportMappingEngineMatch('completely_random_field_xyz');
    expect(result.targetField).toBeNull();
  });

  it('returns null for empty header', () => {
    const result = resolveImportMappingEngineMatch('');
    expect(result.targetField).toBeNull();
  });
});
