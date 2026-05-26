import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from './eventBus';

const mockEmitAppSync = vi.fn();
const mockSubscribeAppSync = vi.fn(() => vi.fn());

vi.mock('@/lib/app-sync', () => ({
  emitAppSync: (...args: Parameters<typeof mockEmitAppSync>) => mockEmitAppSync(...args),
  subscribeAppSync: (...args: Parameters<typeof mockSubscribeAppSync>) => mockSubscribeAppSync(...args),
}));

vi.mock('@/lib/monitoring-refresh', () => ({
  MONITORING_REFRESH_SYNC_KEY: 'sms.monitoring.refresh.v1',
}));

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    vi.clearAllMocks();
    bus = new EventBus();
  });

  it('emits and records history', () => {
    bus.emit('import.analyzed', { batchId: 'b1', rowCount: 100, detectedHeaders: ['name', 'dob'] });
    const history = bus.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].type).toBe('import.analyzed');
    if (history[0].type === 'import.analyzed') {
      expect(history[0].batchId).toBe('b1');
      expect(history[0].rowCount).toBe(100);
    }
  });

  it('supports multiple event types', () => {
    bus.emit('student.created', { studentId: 's1', admissionNo: 'ADM-001' });
    bus.emit('import.completed', { batchId: 'b1', summary: { total: 10, valid: 10, invalid: 0, inserts: 5, updates: 5, skips: 0, reviews: 0, exactMatches: 5, fuzzyMatches: 0, internalDuplicates: 0 } });

    const history = bus.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].type).toBe('student.created');
    expect(history[1].type).toBe('import.completed');
  });

  it('clearHistory empties history', () => {
    bus.emit('import.analyzed', { batchId: 'b1', rowCount: 10, detectedHeaders: [] });
    bus.clearHistory();
    expect(bus.getHistory()).toHaveLength(0);
  });

  it('limits history to maxHistory entries', () => {
    for (let i = 0; i < 250; i++) {
      bus.emit('import.analyzed', { batchId: `b${i}`, rowCount: i, detectedHeaders: [] });
    }
    expect(bus.getHistory().length).toBeLessThanOrEqual(200);
  });

  it('on registers and returns unsubscribe function', () => {
    const listener = vi.fn();
    const unsub = bus.on('import.created', listener);
    expect(typeof unsub).toBe('function');
    unsub();
  });

  it('supports import.completed event type', () => {
    bus.emit('import.completed', { batchId: 'b1', summary: { total: 10, valid: 10, invalid: 0, inserts: 5, updates: 5, skips: 0, reviews: 0, exactMatches: 5, fuzzyMatches: 0, internalDuplicates: 0 } });
    const history = bus.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].type).toBe('import.completed');
  });

  it('emits monitoring refresh on transfer events', () => {
    mockEmitAppSync.mockClear();
    bus.emit('import.transferred', { batchId: 'b1', inserted: 5, updated: 3 });
    expect(mockEmitAppSync).toHaveBeenCalledWith('sms.monitoring.refresh.v1');
  });

  it('emits monitoring refresh on import.completed', () => {
    mockEmitAppSync.mockClear();
    bus.emit('import.completed', { batchId: 'b1', summary: { total: 10, valid: 10, invalid: 0, inserts: 5, updates: 5, skips: 0, reviews: 0, exactMatches: 5, fuzzyMatches: 0, internalDuplicates: 0 } });
    expect(mockEmitAppSync).toHaveBeenCalledWith('sms.monitoring.refresh.v1');
  });

  it('does not emit monitoring refresh for non-refresh events', () => {
    mockEmitAppSync.mockClear();
    bus.emit('import.analyzed', { batchId: 'b1', rowCount: 10, detectedHeaders: [] });
    const calls = mockEmitAppSync.mock.calls.filter((c: string[]) => c[0] === 'sms.monitoring.refresh.v1');
    expect(calls).toHaveLength(0);
  });
});
