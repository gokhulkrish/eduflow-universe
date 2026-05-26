import { describe, it, expect } from 'vitest';
import { PIPELINE_STAGES, STEP_TO_STAGE, STAGE_TO_LEGACY_INDEX } from './types';

describe('PIPELINE_STAGES', () => {
  it('has exactly 9 stages', () => {
    expect(PIPELINE_STAGES.length).toBe(9);
  });

  it('includes all expected stages in order', () => {
    expect(PIPELINE_STAGES).toEqual([
      'analyze',
      'create',
      'map',
      'keying',
      'duplicates',
      'validate',
      'preview',
      'transfer',
      'finalize',
    ]);
  });

  it('is a readonly tuple', () => {
    const stages: readonly string[] = PIPELINE_STAGES;
    expect(Array.isArray(stages)).toBe(true);
  });
});

describe('STEP_TO_STAGE', () => {
  it('maps legacy step names to stages', () => {
    expect(STEP_TO_STAGE.create).toBe('analyze');
    expect(STEP_TO_STAGE.map).toBe('map');
    expect(STEP_TO_STAGE.key).toBe('keying');
    expect(STEP_TO_STAGE.dupe).toBe('duplicates');
    expect(STEP_TO_STAGE.validate).toBe('validate');
    expect(STEP_TO_STAGE.preview).toBe('preview');
    expect(STEP_TO_STAGE.transfer).toBe('transfer');
  });
});

describe('STAGE_TO_LEGACY_INDEX', () => {
  it('maps analyze and create to legacy index 0', () => {
    expect(STAGE_TO_LEGACY_INDEX.analyze).toBe(0);
    expect(STAGE_TO_LEGACY_INDEX.create).toBe(0);
  });

  it('maps finalize to legacy index 7', () => {
    expect(STAGE_TO_LEGACY_INDEX.finalize).toBe(7);
  });
});
