import { describe, it, expect } from 'vitest';
import { computeDataCompleteness, type CompletenessConfig } from './completeness';

const testConfig: CompletenessConfig = {
  fields: [
    { key: 'firstName', weight: 5, required: true },
    { key: 'lastName', weight: 3, required: false },
    { key: 'dob', weight: 7, required: true },
    { key: 'gender', weight: 5, required: true },
  ],
  minScore: 1,
  maxScore: 10,
};

describe('computeDataCompleteness', () => {
  it('returns max score when all fields are filled', () => {
    const student = { firstName: 'Aarav', lastName: 'Sharma', dob: '2010-05-15', gender: 'Male' };
    const score = computeDataCompleteness(student, testConfig);
    expect(score).toBe(10);
  });

  it('returns min score when no fields are filled', () => {
    const student = {};
    const score = computeDataCompleteness(student, testConfig);
    expect(score).toBe(1);
  });

  it('returns partial score for partially filled record', () => {
    const student = { firstName: 'Aarav', dob: '2010-05-15' };
    const score = computeDataCompleteness(student, testConfig);
    const totalWeight = 5 + 3 + 7 + 5; // 20
    const filledWeight = 5 + 7; // 12
    const expected = Math.round(((12 / 20) * 9 + 1) * 10) / 10;
    expect(score).toBe(expected);
  });

  it('treats null and empty string as unfilled', () => {
    const student = { firstName: 'Aarav', lastName: null, dob: '', gender: 'Male' };
    const score = computeDataCompleteness(student, testConfig);
    const totalWeight = 20;
    const filledWeight = 5 + 5; // firstName + gender
    const expected = Math.round(((10 / 20) * 9 + 1) * 10) / 10;
    expect(score).toBe(expected);
  });

  it('uses default config when none provided', () => {
    const student = { firstName: 'Aarav', registrationNumber: 'ADM-001', class: '10', gender: 'Male', dob: '2010-01-01' };
    const score = computeDataCompleteness(student);
    expect(score).toBeGreaterThanOrEqual(1);
    expect(score).toBeLessThanOrEqual(10);
  });

  it('handles zero total weight gracefully', () => {
    const config: CompletenessConfig = { fields: [], minScore: 1, maxScore: 10 };
    expect(computeDataCompleteness({}, config)).toBe(1);
  });
});
