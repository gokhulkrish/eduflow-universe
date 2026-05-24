export type TraceCategory = 'system' | 'navigation' | 'action' | 'field' | 'persistence' | 'sync' | 'alert';

export interface TraceItem {
  id: string;
  category: TraceCategory;
  title: string;
  detail?: string;
  source?: string;
  section?: string;
  createdAt: string;
}

export interface AppendTraceInput {
  tenantId: string;
  category: TraceCategory;
  title: string;
  detail?: string;
  source?: string;
  section?: string;
  meta?: Record<string, unknown>;
}
