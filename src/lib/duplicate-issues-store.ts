import type { DuplicateIssue } from "@/lib/student-import";

const DUPLICATE_STORAGE_KEY = "sms.duplicate-issues.v1";
const BATCH_GROUPS_KEY = "sms.batch-duplicate-groups.v1";

export type CachedDuplicateGroup = {
  identityKey: string;
  rowCount: number;
  rowLabels: string[];
  existingLabels: (string | null)[];
};

export function saveDuplicateIssues(issues: DuplicateIssue[]): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadDuplicateIssues();
    const merged = [...issues];
    for (const e of existing) {
      if (!merged.some((m) => m.id === e.id)) {
        merged.push(e);
      }
    }
    localStorage.setItem(DUPLICATE_STORAGE_KEY, JSON.stringify(merged));
  } catch {}
}

export function loadDuplicateIssues(): DuplicateIssue[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DUPLICATE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DuplicateIssue[];
  } catch {}
  return [];
}

export function updateDuplicateIssue(
  id: string,
  update: Partial<Pick<DuplicateIssue, "resolution" | "mergeResolution" | "mergedValues">>,
): DuplicateIssue[] {
  const issues = loadDuplicateIssues();
  const idx = issues.findIndex((i) => i.id === id);
  if (idx === -1) return issues;
  issues[idx] = { ...issues[idx], ...update };
  try {
    localStorage.setItem(DUPLICATE_STORAGE_KEY, JSON.stringify(issues));
  } catch {}
  return issues;
}

export function clearDuplicateIssues(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DUPLICATE_STORAGE_KEY);
  } catch {}
}

export function cacheDuplicateGroups(
  batchId: string,
  groups: { identityKey: string; rowCount: number; rowLabels: string[]; existingLabels: (string | null)[] }[],
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(BATCH_GROUPS_KEY);
    const cache: Record<string, CachedDuplicateGroup[]> = raw ? JSON.parse(raw) : {};
    cache[batchId] = groups;
    localStorage.setItem(BATCH_GROUPS_KEY, JSON.stringify(cache));
  } catch {}
}

export function loadCachedDuplicateGroups(batchId: string): CachedDuplicateGroup[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BATCH_GROUPS_KEY);
    if (!raw) return [];
    const cache: Record<string, CachedDuplicateGroup[]> = JSON.parse(raw);
    return cache[batchId] ?? [];
  } catch {
    return [];
  }
}

export function clearCachedDuplicateGroups(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(BATCH_GROUPS_KEY);
  } catch {}
}
