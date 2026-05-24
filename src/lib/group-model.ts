import "@/lib/runtime-storage";
import { emitAppSync, subscribeAppSync } from "./app-sync";
import { removeStoredKey } from "./state-normalization";

export const GROUP_MODEL_STORAGE_KEY = "sms.group-model.v1";

export interface GroupActionDescriptor {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface GroupSectionDescriptor<TAction extends GroupActionDescriptor = GroupActionDescriptor> {
  id: string;
  title: string;
  description?: string;
  actions: TAction[];
  defaultVisible?: boolean;
}

export interface GroupRuntimeNamespaceState {
  hiddenGroupIds: string[];
  updatedAt: string;
}

export interface GroupRuntimeSnapshot {
  updatedAt: string;
  namespaces: Record<string, GroupRuntimeNamespaceState>;
}

export interface GroupRuntimeNamespaceSummary {
  namespace: string;
  hiddenGroupCount: number;
  updatedAt: string;
}

export interface GroupRuntimeOverview {
  updatedAt: string;
  namespaceCount: number;
  hiddenGroupCount: number;
  namespaces: GroupRuntimeNamespaceSummary[];
}

export interface GroupCollision {
  groupId: string;
  duplicateGroupIds: string[];
  duplicateActionIds: string[];
}

export interface GroupRuntimeSection<TAction extends GroupActionDescriptor = GroupActionDescriptor> {
  id: string;
  title: string;
  description?: string;
  actions: TAction[];
  actionCount: number;
  visible: boolean;
}

export interface GroupRuntimeSummary {
  groupCount: number;
  visibleGroupCount: number;
  hiddenGroupCount: number;
  actionCount: number;
  collisionCount: number;
  duplicateActionCount: number;
}

export interface GroupRuntimeModel<TAction extends GroupActionDescriptor = GroupActionDescriptor> {
  namespace: string;
  updatedAt: string;
  sections: GroupRuntimeSection<TAction>[];
  collisions: GroupCollision[];
  summary: GroupRuntimeSummary;
}

const isBrowser = () => typeof window !== "undefined";

function readStoredSnapshot(): GroupRuntimeSnapshot {
  if (!isBrowser()) {
    return { updatedAt: new Date().toISOString(), namespaces: {} };
  }

  try {
    const raw = window.localStorage.getItem(GROUP_MODEL_STORAGE_KEY);
    if (!raw) return { updatedAt: new Date().toISOString(), namespaces: {} };
    const parsed = JSON.parse(raw) as Partial<GroupRuntimeSnapshot>;
    return {
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      namespaces: (parsed.namespaces ?? {}) as Record<string, GroupRuntimeNamespaceState>,
    };
  } catch {
    return { updatedAt: new Date().toISOString(), namespaces: {} };
  }
}

function writeStoredSnapshot(snapshot: GroupRuntimeSnapshot) {
  if (!isBrowser()) return;
  window.localStorage.setItem(GROUP_MODEL_STORAGE_KEY, JSON.stringify(snapshot));
  emitAppSync(GROUP_MODEL_STORAGE_KEY);
}

function normalizeNamespaceState(state: GroupRuntimeNamespaceState | undefined): GroupRuntimeNamespaceState {
  return {
    hiddenGroupIds: Array.from(new Set((state?.hiddenGroupIds ?? []).filter(Boolean))),
    updatedAt: typeof state?.updatedAt === "string" ? state.updatedAt : new Date().toISOString(),
  };
}

function uniqueActions<TAction extends GroupActionDescriptor>(actions: TAction[]): { actions: TAction[]; duplicateActionIds: string[] } {
  const seen = new Set<string>();
  const duplicateActionIds: string[] = [];
  const normalized: TAction[] = [];
  for (const action of actions) {
    if (seen.has(action.id)) {
      duplicateActionIds.push(action.id);
      continue;
    }
    seen.add(action.id);
    normalized.push(action);
  }
  return { actions: normalized, duplicateActionIds };
}

export function loadGroupRuntimeSnapshot(): GroupRuntimeSnapshot {
  return readStoredSnapshot();
}

export function getGroupRuntimeOverview(): GroupRuntimeOverview {
  const snapshot = readStoredSnapshot();
  const namespaces = Object.entries(snapshot.namespaces)
    .map(([namespace, state]) => {
      const normalized = normalizeNamespaceState(state);
      return {
        namespace,
        hiddenGroupCount: normalized.hiddenGroupIds.length,
        updatedAt: normalized.updatedAt,
      };
    })
    .sort((left, right) => left.namespace.localeCompare(right.namespace));
  return {
    updatedAt: snapshot.updatedAt,
    namespaceCount: namespaces.length,
    hiddenGroupCount: namespaces.reduce((sum, entry) => sum + entry.hiddenGroupCount, 0),
    namespaces,
  };
}

export function getGroupRuntimeNamespaceState(namespace: string): GroupRuntimeNamespaceState {
  const snapshot = readStoredSnapshot();
  return normalizeNamespaceState(snapshot.namespaces[namespace]);
}

export function setGroupSectionVisibility(namespace: string, groupId: string, visible: boolean): GroupRuntimeSnapshot {
  const snapshot = readStoredSnapshot();
  const namespaceState = normalizeNamespaceState(snapshot.namespaces[namespace]);
  const hidden = new Set(namespaceState.hiddenGroupIds);
  if (visible) hidden.delete(groupId);
  else hidden.add(groupId);

  const next: GroupRuntimeSnapshot = {
    updatedAt: new Date().toISOString(),
    namespaces: {
      ...snapshot.namespaces,
      [namespace]: {
        hiddenGroupIds: [...hidden],
        updatedAt: new Date().toISOString(),
      },
    },
  };

  writeStoredSnapshot(next);
  return next;
}

export function toggleGroupSectionVisibility(namespace: string, groupId: string): GroupRuntimeSnapshot {
  const current = getGroupRuntimeNamespaceState(namespace);
  const visible = !current.hiddenGroupIds.includes(groupId);
  return setGroupSectionVisibility(namespace, groupId, !visible);
}

export function resetGroupRuntimeNamespace(namespace: string): GroupRuntimeSnapshot {
  const snapshot = readStoredSnapshot();
  const next: GroupRuntimeSnapshot = {
    updatedAt: new Date().toISOString(),
    namespaces: {
      ...snapshot.namespaces,
      [namespace]: {
        hiddenGroupIds: [],
        updatedAt: new Date().toISOString(),
      },
    },
  };
  writeStoredSnapshot(next);
  return next;
}

export function clearGroupRuntimeStorage(): void {
  removeStoredKey(GROUP_MODEL_STORAGE_KEY);
  emitAppSync(GROUP_MODEL_STORAGE_KEY);
}

export function buildGroupRuntimeModel<TAction extends GroupActionDescriptor>(
  namespace: string,
  sections: GroupSectionDescriptor<TAction>[],
): GroupRuntimeModel<TAction> {
  const namespaceState = getGroupRuntimeNamespaceState(namespace);
  const groupById = new Map<string, GroupSectionDescriptor<TAction>>();
  const collisions: GroupCollision[] = [];
  const actionOwnership = new Map<string, string>();

  for (const section of sections) {
    const current = groupById.get(section.id);
    if (!current) {
      groupById.set(section.id, {
        ...section,
        actions: [...section.actions],
      });
      continue;
    }

    const unique = uniqueActions([...(current.actions as TAction[]), ...section.actions]);
    const duplicateActionIds = unique.duplicateActionIds.filter(Boolean);
    collisions.push({
      groupId: section.id,
      duplicateGroupIds: [current.id, section.id],
      duplicateActionIds,
    });
    groupById.set(section.id, {
      ...current,
      actions: unique.actions,
    });
  }

  const normalizedSections = [...groupById.values()].map((section) => {
    const actions: TAction[] = [];
    const duplicateActionIds: string[] = [];
    for (const action of section.actions) {
      const owner = actionOwnership.get(action.id);
      if (owner && owner !== section.id) {
        duplicateActionIds.push(action.id);
        continue;
      }
      actionOwnership.set(action.id, section.id);
      actions.push(action);
    }

    if (duplicateActionIds.length > 0) {
      collisions.push({
        groupId: section.id,
        duplicateGroupIds: [],
        duplicateActionIds,
      });
    }

    return {
      id: section.id,
      title: section.title,
      description: section.description,
      actions,
      actionCount: actions.length,
      visible: !namespaceState.hiddenGroupIds.includes(section.id) && (section.defaultVisible ?? true),
    } satisfies GroupRuntimeSection<TAction>;
  });

  const visibleGroupCount = normalizedSections.filter((section) => section.visible).length;
  const actionCount = normalizedSections.reduce((sum, section) => sum + section.actionCount, 0);
  const duplicateActionCount = collisions.reduce((sum, collision) => sum + collision.duplicateActionIds.length, 0);

  return {
    namespace,
    updatedAt: namespaceState.updatedAt,
    sections: normalizedSections,
    collisions,
    summary: {
      groupCount: normalizedSections.length,
      visibleGroupCount,
      hiddenGroupCount: normalizedSections.length - visibleGroupCount,
      actionCount,
      collisionCount: collisions.length,
      duplicateActionCount,
    },
  };
}

export function subscribeGroupRuntime(namespace: string, listener: () => void) {
  return subscribeAppSync([GROUP_MODEL_STORAGE_KEY], () => {
    if (getGroupRuntimeNamespaceState(namespace)) {
      listener();
    }
  });
}
