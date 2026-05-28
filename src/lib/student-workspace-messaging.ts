import { generateId } from "@/lib/utils";
import { useActivityTrace } from "@/stores/activityTrace";

export interface WorkspaceMessage {
  id: string;
  type: "reminder" | "todo" | "notification" | "alert";
  title: string;
  detail?: string;
  source: string;
  severity: "info" | "success" | "warning" | "critical";
  ts: number;
  read: boolean;
  acknowledged?: boolean;
  relatedImportBatchId?: string;
  dueAt?: string;
  pinned?: boolean;
}

const MSG_STORAGE = "sms.eduflow_notices.v1";
const TODO_STORAGE = "sms.eduflow_tasks.v1";

function pushNotices(msg: WorkspaceMessage) {
  try {
    const raw = localStorage.getItem(MSG_STORAGE);
    const items: any[] = raw ? JSON.parse(raw) : [];
    items.unshift(msg);
    localStorage.setItem(MSG_STORAGE, JSON.stringify(items.slice(0, 200)));
  } catch {}
}

function pushTasks(msg: WorkspaceMessage) {
  try {
    const raw = localStorage.getItem(TODO_STORAGE);
    const items: any[] = raw ? JSON.parse(raw) : [];
    items.unshift({ ...msg, status: "pending" });
    localStorage.setItem(TODO_STORAGE, JSON.stringify(items.slice(0, 200)));
  } catch {}
}

export function emitImportNotification(title: string, detail?: string) {
  const msg: WorkspaceMessage = {
    id: generateId(),
    type: "notification",
    title,
    detail,
    source: "student-import",
    severity: "info",
    ts: Date.now(),
    read: false,
  };
  pushNotices(msg);
  useActivityTrace.getState().push({
    category: "sync",
    title,
    detail: detail ?? "",
    source: "student-import",
  });
}

export function emitImportTodo(title: string, detail?: string, batchId?: string) {
  const msg: WorkspaceMessage = {
    id: generateId(),
    type: "todo",
    title,
    detail,
    source: "student-import",
    severity: "warning",
    ts: Date.now(),
    read: false,
    relatedImportBatchId: batchId,
  };
  pushTasks(msg);
}

export function emitImportAlert(title: string, detail?: string) {
  const msg: WorkspaceMessage = {
    id: generateId(),
    type: "alert",
    title,
    detail,
    source: "student-import",
    severity: "critical",
    ts: Date.now(),
    read: false,
    acknowledged: false,
  };
  pushNotices(msg);
  useActivityTrace.getState().push({
    category: "alert",
    title,
    detail: detail ?? "",
    source: "student-import",
  });
}

export function emitDuplicateTodo(count: number, batchId?: string) {
  emitImportTodo(
    "Clean duplicate records",
    `${count} duplicate records found after import. Review and merge before reporting deadline.`,
    batchId,
  );
}

export function emitImportTodoWithSeverity(
  title: string,
  detail?: string,
  severity?: WorkspaceMessage["severity"],
  batchId?: string,
  dueAt?: string,
) {
  const msg: WorkspaceMessage = {
    id: generateId(),
    type: "todo",
    title,
    detail,
    source: "student-import",
    severity: severity ?? "warning",
    ts: Date.now(),
    read: false,
    relatedImportBatchId: batchId,
    dueAt,
  };
  pushTasks(msg);
}

export function emitImportAlertWithThreshold(
  title: string,
  detail: string,
  threshold: (current: number, total: number) => boolean,
  current: number,
  total: number,
  batchId?: string,
) {
  if (!threshold(current, total)) return;
  const msg: WorkspaceMessage = {
    id: generateId(),
    type: "alert",
    title,
    detail: `${detail} (${current}/${total})`,
    source: "student-import",
    severity: "critical",
    ts: Date.now(),
    read: false,
    acknowledged: false,
    relatedImportBatchId: batchId,
  };
  pushNotices(msg);
  useActivityTrace.getState().push({
    category: "alert",
    title,
    detail: msg.detail ?? "",
    source: "student-import",
  });
}

export function emitImportReminder(title: string, detail?: string) {
  const msg: WorkspaceMessage = {
    id: generateId(),
    type: "reminder",
    title,
    detail,
    source: "student-import",
    severity: "warning",
    ts: Date.now(),
    read: false,
  };
  pushNotices(msg);
}

const MCC_TASK_STORAGE = "eduflow_tasks";
const MCC_ALERT_STORAGE = "sms.alerts.v1";

export function resolveDuplicateFeedbackLoop(): { pending: number; total: number } {
  try {
    const issuesRaw = localStorage.getItem("sms.duplicate-issues.v1");
    if (!issuesRaw) return { pending: 0, total: 0 };
    const issues: { resolution: string; importBatchId?: string }[] = JSON.parse(issuesRaw);
    const total = issues.length;
    const pending = issues.filter((i) => i.resolution === "pending").length;

    // Downgrade alerts only when NO pending duplicates remain and there are total > 0
    if (pending === 0 && total > 0) {
      // ── sms.eduflow_tasks.v1 (import system todos) ──
      const tasksRaw = localStorage.getItem(TODO_STORAGE);
      if (tasksRaw) {
        const tasks: any[] = JSON.parse(tasksRaw);
        let changed = false;
        for (const task of tasks) {
          if (task.type === "todo" && task.title === "Clean duplicate records") {
            task.status = "completed";
            task.severity = "success";
            task.detail = (task.detail ?? "") + " — All duplicates resolved";
            changed = true;
          }
        }
        if (changed) localStorage.setItem(TODO_STORAGE, JSON.stringify(tasks));
      }

      // ── sms.eduflow_notices.v1 (import system alerts) ──
      const noticesRaw = localStorage.getItem(MSG_STORAGE);
      if (noticesRaw) {
        const notices: any[] = JSON.parse(noticesRaw);
        let changed = false;
        for (const notice of notices) {
          if (notice.type === "alert" && notice.title === "Duplicate records backlog") {
            notice.severity = "success";
            notice.acknowledged = true;
            notice.detail = (notice.detail ?? "") + " — Resolved";
            changed = true;
          }
        }
        if (changed) localStorage.setItem(MSG_STORAGE, JSON.stringify(notices));
      }

      // ── eduflow_tasks (MessagingControlCenter tasks) ──
      const mccTasksRaw = localStorage.getItem(MCC_TASK_STORAGE);
      if (mccTasksRaw) {
        const mccTasks: any[] = JSON.parse(mccTasksRaw);
        let changed = false;
        for (const t of mccTasks) {
          if ((t.title?.toLowerCase().includes("duplicate") || t.description?.toLowerCase().includes("duplicate"))
              && t.status !== "completed") {
            t.status = "completed";
            t.completed_at = new Date().toISOString();
            changed = true;
          }
        }
        if (changed) localStorage.setItem(MCC_TASK_STORAGE, JSON.stringify(mccTasks));
      }

      // ── sms.alerts.v1 (MessagingControlCenter alerts) ──
      const mccAlertsRaw = localStorage.getItem(MCC_ALERT_STORAGE);
      if (mccAlertsRaw) {
        const mccAlerts: any[] = JSON.parse(mccAlertsRaw);
        let changed = false;
        for (const a of mccAlerts) {
          if (a.title?.toLowerCase().includes("duplicate") && a.severity !== "success") {
            a.severity = "success";
            a.acknowledged = true;
            changed = true;
          }
        }
        if (changed) localStorage.setItem(MCC_ALERT_STORAGE, JSON.stringify(mccAlerts));
      }

      // ── Emit a success notification ──
      emitImportNotification("Duplicate records resolved", "All duplicate records have been reviewed and resolved.");
    }

    return { pending, total };
  } catch {
    return { pending: 0, total: 0 };
  }
}

export function resolveMissingFieldsFeedbackLoop(remaining: number, total: number): void {
  if (remaining > 0 || total === 0) return;

  const tasksRaw = localStorage.getItem(TODO_STORAGE);
  if (tasksRaw) {
    const tasks: any[] = JSON.parse(tasksRaw);
    let changed = false;
    for (const task of tasks) {
      if (task.type === "todo" && (task.title?.toLowerCase().includes("missing") || task.title?.toLowerCase().includes("contact"))) {
        task.status = "completed";
        task.severity = "success";
        changed = true;
      }
    }
    if (changed) localStorage.setItem(TODO_STORAGE, JSON.stringify(tasks));
  }

  const noticesRaw = localStorage.getItem(MSG_STORAGE);
  if (noticesRaw) {
    const notices: any[] = JSON.parse(noticesRaw);
    let changed = false;
    for (const notice of notices) {
      if (notice.type === "alert" && (notice.title?.toLowerCase().includes("missing contact") || notice.title?.toLowerCase().includes("missing data"))) {
        notice.severity = "success";
        notice.acknowledged = true;
        changed = true;
      }
    }
    if (changed) localStorage.setItem(MSG_STORAGE, JSON.stringify(notices));
  }

  emitImportNotification("Missing fields resolved", "All missing critical fields have been completed.");
}

export function traceStudentAction(action: string, detail?: string) {
  useActivityTrace.getState().push({
    category: "action",
    title: action,
    detail: detail ?? "",
    source: "student-workspace",
  });
}

export function traceStudentFieldChange(fieldKey: string, value: string) {
  useActivityTrace.getState().push({
    category: "field",
    title: `Field changed: ${fieldKey}`,
    detail: value ? `New value: ${value.slice(0, 120)}` : "Cleared",
    source: "student-workspace",
  });
}

export function traceStudentExport(format: string) {
  useActivityTrace.getState().push({
    category: "persistence",
    title: `Student data exported`,
    detail: `Format: ${format}`,
    source: "student-workspace",
  });
}

export function traceStudentPrint() {
  useActivityTrace.getState().push({
    category: "action",
    title: "Student record printed",
    source: "student-workspace",
  });
}
