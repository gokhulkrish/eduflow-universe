import type { RegistryFieldConfig } from "@/lib/registry-groups";
import { getHeaderFieldEntries } from "@/lib/registry-groups";
import { getCanonicalRegistryCatalog } from "@/lib/canonical-student-fields";
import { loadRegistryAiState } from "@/lib/registry-ai-queue";
import type { CanonicalFieldSource, CanonicalFieldStatus } from "@/lib/canonical-student-field.types";

export interface RegistryFieldRow {
  id: string;
  key: string;
  label: string;
  group: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select';
  status: CanonicalFieldStatus;
  source: CanonicalFieldSource;
  order: number;
  isCanonical: boolean;
  hasAiMapping: boolean;
  inReviewQueue: boolean;
}

export interface ExplorerFilterOptions {
  groups?: string[];
  statuses?: string[];
  sources?: string[];
  search?: string;
}

export interface RegistryMetrics {
  total: number;
  active: number;
  system: number;
  custom: number;
  canonical: number;
  detected: number;
  mapped: number;
  reviewCount: number;
}

const CANONICAL_SOURCE_MAP: Record<string, string> = {
  system: 'Base',
  custom: 'Custom',
  import: 'Import',
  detected: 'Detected',
};

export function getFieldRegistryEntries(
  scope: string,
  options?: { includeStatuses?: string[] },
): RegistryFieldConfig[] {
  const canonical = getCanonicalRegistryCatalog();
  const stored = getHeaderFieldEntries(scope);

  const byKey = new Map<string, RegistryFieldConfig>();
  for (const f of canonical) byKey.set(f.key, f);
  for (const f of stored) byKey.set(f.key, f);

  let entries = Array.from(byKey.values());

  if (options?.includeStatuses?.length) {
    entries = entries.filter(e => options.includeStatuses!.includes(e.status));
  }

  return entries;
}

export function getOrderedRegistryFieldsForScope(
  scope: string,
  options?: { includeStatuses?: string[] },
): RegistryFieldConfig[] {
  const entries = getFieldRegistryEntries(scope, options);
  entries.sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.key.localeCompare(b.key);
  });

  return entries.map((f, i) => ({ ...f, order: i + 1 }));
}

export function getRegistryMetricsForActiveScope(): RegistryMetrics {
  const canonical = getCanonicalRegistryCatalog();
  const stored = getHeaderFieldEntries('student');
  const aiState = loadRegistryAiState();

  const byKey = new Map<string, RegistryFieldConfig>();
  for (const f of canonical) byKey.set(f.key, f);
  for (const f of stored) byKey.set(f.key, f);
  const all = Array.from(byKey.values());

  const approvedKeys = new Set(Object.values(aiState.approvedMappings));
  const reviewFieldKeys = new Set<string>();
  for (const item of aiState.reviewQueue) {
    for (const s of item.suggestions) reviewFieldKeys.add(s.field.key);
  }

  return {
    total: all.length,
    active: all.filter(f => f.status === 'active').length,
    system: all.filter(f => f.source === 'system').length,
    custom: all.filter(f => f.source === 'custom').length,
    canonical: canonical.length,
    detected: all.filter(f => f.source === 'detected').length,
    mapped: approvedKeys.size,
    reviewCount: reviewFieldKeys.size,
  };
}

export function getExplorerFilteredFields(
  fields: RegistryFieldConfig[],
  filters: ExplorerFilterOptions,
): RegistryFieldConfig[] {
  let result = fields;

  if (filters.groups?.length) {
    result = result.filter(f => filters.groups!.includes(f.groupKey));
  }
  if (filters.statuses?.length) {
    result = result.filter(f => filters.statuses!.includes(f.status));
  }
  if (filters.sources?.length) {
    result = result.filter(f => {
      const label = CANONICAL_SOURCE_MAP[f.source] || f.source;
      return filters.sources!.includes(label);
    });
  }
  if (filters.search && filters.search.length >= 2) {
    const q = filters.search.toLowerCase();
    result = result.filter(f =>
      f.label.toLowerCase().includes(q) ||
      f.key.toLowerCase().includes(q) ||
      f.aliases.some(a => a.toLowerCase().includes(q))
    );
  }

  return result;
}

/**
 * UI-oriented descriptor that decorates a raw RegistryFieldConfig with
 * workspace/module view settings (visibility, capabilities, etc.).
 */
export interface UiSettingsFieldDescriptor {
  key: string;
  label: string;
  type: string;
  group: string;
  order: number;
  visible: boolean;
  editable: boolean;
  printable: boolean;
  exportable: boolean;
  sortable: boolean;
  filterable: boolean;
  required: boolean;
  module: string;
}

/**
 * Build a UiSettingsFieldDescriptor from a registry field config + module scope.
 */
export function buildUiSettingsFieldDescriptor(
  field: RegistryFieldConfig,
  module: string = 'student',
): UiSettingsFieldDescriptor {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    group: field.groupKey,
    order: field.order,
    visible: field.status === 'active',
    editable: true,
    printable: true,
    exportable: true,
    sortable: true,
    filterable: true,
    required: false,
    module,
  };
}

/**
 * Return workspace registry entries (for the Student workspace by default)
 * as UI-ready descriptors. This is the single entry point for workspace views.
 */
export function getWorkspaceRegistryEntries(
  module: string = 'student',
): UiSettingsFieldDescriptor[] {
  const entries = getFieldRegistryEntries(module, {
    includeStatuses: ['active', 'archived'],
  });
  return entries.map(field => buildUiSettingsFieldDescriptor(field, module));
}

/**
 * Set the global registry context state for navigation and scope tracking.
 */
export function setRegistryContextState(state: { field?: string; view?: string; module?: string }) {
  const w = window as any;
  w.registryContextState = { ...(w.registryContextState || {}), ...state };
}

/**
 * Resolve AI mapping status for a given field key from the persisted AI queue state.
 */
export function resolveFieldAiStatus(
  fieldKey: string,
  aiState?: ReturnType<typeof loadRegistryAiState>,
): { isCanonical: boolean; hasAiMapping: boolean; inReviewQueue: boolean } {
  if (!aiState) return { isCanonical: false, hasAiMapping: false, inReviewQueue: false };
  const isApproved = Object.values(aiState.approvedMappings).includes(fieldKey);
  const inReview = aiState.reviewQueue.some(item =>
    item.suggestions.some(s => s.field.key === fieldKey),
  );
  return { isCanonical: false, hasAiMapping: isApproved, inReviewQueue: inReview };
}

/**
 * Convert a RegistryFieldConfig + AI state into a flat RegistryFieldRow used by the Explorer UI.
 */
export function fieldToRegistryRow(
  field: RegistryFieldConfig,
  aiState?: ReturnType<typeof loadRegistryAiState>,
): RegistryFieldRow {
  const ai = resolveFieldAiStatus(field.key, aiState);
  const source: CanonicalFieldSource =
    field.source === 'system' ? 'base' :
    field.source === 'custom' ? 'custom' :
    field.source === 'import' ? 'import' :
    field.source === 'detected' ? 'custom' : 'custom';

  return {
    id: field.key,
    key: field.key,
    label: field.label,
    group: field.groupKey || 'other',
    type: (field.type === 'boolean' ? 'text' : field.type) as RegistryFieldRow['type'],
    status: field.status === 'active' ? 'active' : 'archived',
    source,
    order: field.order ?? 0,
    isCanonical: field.source === 'system',
    hasAiMapping: ai.hasAiMapping,
    inReviewQueue: ai.inReviewQueue,
  };
}
