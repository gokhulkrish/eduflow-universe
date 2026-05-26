import { describe, it, expect } from 'vitest';
import { validateRow } from './validation';

describe('validateRow (registry-backed)', () => {
  it('returns error for missing required fields from registry', () => {
    const errors = validateRow({});
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors.some((e) => e.toLowerCase().includes('required'))).toBe(true);
  });

  it('returns empty for fully valid row', () => {
    const errors = validateRow({
      registrationNumber: 'ADM-001',
      studentName: 'Aarav Sharma',
      firstName: 'Aarav',
      dob: '2010-05-15',
      gender: 'Male',
      class: '10',
    });
    expect(errors).toEqual([]);
  });

  it('detects invalid enum value from registry', () => {
    const errors = validateRow({
      registrationNumber: 'ADM-001',
      firstName: 'Aarav',
      dob: '2010-05-15',
      gender: 'InvalidGender',
      class: '10',
    });
    const genderErrors = errors.filter((e) => e.toLowerCase().includes('gender'));
    expect(genderErrors.length).toBeGreaterThanOrEqual(1);
  });

  it('detects invalid date format from registry', () => {
    const errors = validateRow({
      registrationNumber: 'ADM-001',
      firstName: 'Aarav',
      dob: 'not-a-date',
      gender: 'Male',
      class: '10',
    });
    const dateErrors = errors.filter((e) => e.toLowerCase().includes('date'));
    expect(dateErrors.length).toBeGreaterThanOrEqual(1);
  });

  it('returns error for non-object rows', () => {
    const errors = validateRow(null);
    expect(errors).toContain('Row is not a valid object');
  });
});
