import { describe, it, expect } from 'vitest';
import { CANONICAL_FIELDS } from '../../engine/registry/canonical';

describe('alias debug', () => {
  it('checks canonical fields aliases', () => {
    const regField = CANONICAL_FIELDS.find((f) => f.key === 'registrationNumber');
    expect(regField).toBeDefined();
    expect(regField!.aliases).toContain('reg_no');
    expect(regField!.aliases).toContain('registration_no');
  });

  it('builds alias index manually', () => {
    const idx = new Map<string, string>();
    for (const field of CANONICAL_FIELDS) {
      idx.set(field.key.toLowerCase(), field.key);
      idx.set(field.label.toLowerCase(), field.key);
      for (const alias of field.aliases) {
        idx.set(alias.toLowerCase(), field.key);
      }
    }
    expect(idx.get('reg_no')).toBe('registrationNumber');
    expect(idx.get('registration_no')).toBe('registrationNumber');
  });
});
