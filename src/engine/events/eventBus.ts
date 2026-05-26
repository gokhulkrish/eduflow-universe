import { emitAppSync, subscribeAppSync } from '@/lib/app-sync';
import { MONITORING_REFRESH_SYNC_KEY } from '@/lib/monitoring-refresh';
import type { ImportKeyingConfig, ImportPreviewSummary } from '@/lib/import-engine/types';

const eventPayloadStore = new Map<string, unknown>();

export type EngineEventPayloads = {
  'import.analyzed': { batchId: string; rowCount: number; detectedHeaders: string[] };
  'import.created': { batchId: string };
  'import.mapped': { batchId: string; mappingCount: number };
  'import.keyed': { batchId: string; keyConfig: ImportKeyingConfig };
  'import.duplicates.resolved': { batchId: string; groupCount: number };
  'import.validated': { batchId: string; validCount: number; blockedCount: number };
  'import.previewed': { batchId: string; insertCount: number; updateCount: number };
  'import.transferred': { batchId: string; inserted: number; updated: number };
  'import.finalized': { batchId: string; summary: ImportPreviewSummary };
  'import.completed': { batchId: string; summary: ImportPreviewSummary };
  'student.created': { studentId: string; admissionNo: string };
  'student.updated': { studentId: string; fields: string[] };
  'registry.changed': { version: number };
  'dashboard.refresh': {};
};

export type EngineEvent = {
  [K in keyof EngineEventPayloads]: { type: K } & EngineEventPayloads[K];
}[keyof EngineEventPayloads];

export class EventBus {
  private history: { event: EngineEvent; timestamp: string }[] = [];
  private maxHistory = 200;

  private refreshEvents = new Set<EngineEvent['type']>([
    'import.transferred',
    'import.completed',
    'import.finalized',
    'student.created',
    'student.updated',
    'dashboard.refresh',
  ]);

  emit<T extends EngineEvent['type']>(
    type: T,
    payload: EngineEventPayloads[T],
  ): void {
    const event = { type, ...payload } as EngineEvent;
    this.history.push({ event, timestamp: new Date().toISOString() });
    if (this.history.length > this.maxHistory) this.history.shift();
    const key = `engine:${type}`;
    eventPayloadStore.set(key, payload);
    emitAppSync(key);
    if (this.refreshEvents.has(type)) {
      emitAppSync(MONITORING_REFRESH_SYNC_KEY);
    }
  }

  on<T extends EngineEvent['type']>(
    type: T,
    listener: (payload: EngineEventPayloads[T]) => void,
  ): () => void {
    const key = `engine:${type}`;
    return subscribeAppSync([key], () => {
      const payload = eventPayloadStore.get(key) as EngineEventPayloads[T] | undefined;
      if (payload !== undefined) listener(payload);
    });
  }

  getHistory(): EngineEvent[] {
    return this.history.map((h) => h.event);
  }

  clearHistory(): void {
    this.history = [];
  }
}

export const eventBus = new EventBus();
