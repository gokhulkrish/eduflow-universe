export interface UpdatePayload {
  changes?: Record<string, unknown>;
  field?: string;
  value?: unknown;
  nestedPath?: string;
}

export interface RegisteredRibbonActionDef {
  changes: Record<string, unknown>;
  label: string;
  nestedPath?: string;
}

export const REGISTEREDRIBBONACTIONS: Record<string, RegisteredRibbonActionDef> = {
  "set-status-active": {
    changes: { status: "active" },
    label: "Set status to Active",
  },
  "set-status-transfer": {
    changes: { status: "transferred" },
    label: "Set status to Transferred",
  },
  "set-status-alumni": {
    changes: { status: "alumni" },
    label: "Set status to Alumni",
  },
  "set-status-dropout": {
    changes: { status: "dropout" },
    label: "Set status to Dropout",
  },
  "scholarship-flag": {
    changes: { first_graduate: true },
    label: "Mark as first graduate / scholarship flag",
  },
  "verification-pending": {
    changes: { income_verification_status: "pending" },
    label: "Set verification pending",
  },
  "approve": {
    changes: { status: "approved" },
    label: "Approve selected records",
  },
  "reject": {
    changes: { status: "rejected" },
    label: "Reject selected records",
  },
  "mass-update": {
    changes: {},
    label: "Mass update",
  },
  "fill-down": {
    changes: {},
    label: "Fill down",
  },
  "bulk-replace": {
    changes: {},
    label: "Bulk replace",
  },
};

export function validateUpdatePayload(payload: UpdatePayload): string | null {
  if (!payload.changes && (!payload.field || payload.value === undefined)) {
    return "Either changes or (field + value) must be provided";
  }
  return null;
}

export function confirmBulkUpdate(count: number, description: string): boolean {
  if (count <= 0) return false;
  return window.confirm(`Apply "${description}" to ${count} student record(s)?`);
}

export function applyStudentUpdate(
  student: Record<string, unknown>,
  payload: UpdatePayload,
): Record<string, unknown> {
  const updated = { ...student };

  if (payload.changes) {
    for (const [key, value] of Object.entries(payload.changes)) {
      if (payload.nestedPath) {
        const parts = payload.nestedPath.split(".");
        let target: Record<string, unknown> = updated;
        for (let i = 0; i < parts.length - 1; i++) {
          if (typeof target[parts[i]] !== "object" || target[parts[i]] === null) {
            target[parts[i]] = {};
          }
          target = target[parts[i]] as Record<string, unknown>;
        }
        target[parts[parts.length - 1]] = value;
      } else {
        updated[key] = value;
      }
    }
  }

  if (payload.field && payload.value !== undefined) {
    updated[payload.field] = payload.value;
  }

  updated.updatedAt = new Date().toISOString();
  return updated;
}

export function appendRegisteredHistory(
  student: Record<string, unknown>,
  action: string,
  changes: Record<string, unknown>,
): Record<string, unknown> {
  const history = Array.isArray(student.history) ? [...student.history] : [];
  history.push({
    action,
    changes,
    timestamp: new Date().toISOString(),
  });
  return { ...student, history };
}

export function pushRegisteredUndoSnapshot(
  keys: string[],
  students: Record<string, unknown>[],
): { keys: string[]; before: Record<string, unknown>[] } {
  return {
    keys,
    before: students.map((s) => ({ ...s })),
  };
}

export function getRegisteredActionTargetKeys(
  selected: Set<string>,
  visible: { id: string }[],
): string[] {
  if (selected.size > 0) return Array.from(selected);
  return visible.map((s) => s.id);
}

export function getRegisteredViewSnapshot(
  headers: string[],
  rows: Record<string, unknown>[],
  records: Record<string, unknown>[],
): { headers: string[]; rows: Record<string, unknown>[]; records: Record<string, unknown>[] } {
  return { headers, rows, records };
}

export function getRegisteredClipboardState() {
  try {
    const raw = typeof window !== "undefined"
      ? window.localStorage.getItem("sms.registered-clipboard.v1")
      : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setRegisteredClipboardState(state: { studentId: string; snapshot: Record<string, string> }) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("sms.registered-clipboard.v1", JSON.stringify(state));
}

export function getOrderedHeaders(visibleColumns: Record<string, unknown> | undefined, allHeaders: string[]): string[] {
  if (!visibleColumns || typeof visibleColumns !== "object") return allHeaders;
  const order = Array.isArray((visibleColumns as Record<string, unknown>).order)
    ? (visibleColumns as Record<string, unknown>).order as string[]
    : [];
  if (order.length === 0) return allHeaders;
  const ordered = order.filter((h) => allHeaders.includes(h));
  const remaining = allHeaders.filter((h) => !ordered.includes(h));
  return [...ordered, ...remaining];
}
