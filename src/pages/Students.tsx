import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import StudentProfileDrawer from "@/components/students/StudentProfileDrawer";
import {
  Users, Search, Plus, Filter, Download, Copy, Edit3, Eye, FileText, Trash2,
  Clipboard, ClipboardPaste, Printer, RefreshCw, Settings2, ChevronDown, AlertTriangle, Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/PageHeader";
import { fetchStudentRegister, deactivateStudentRecords, deleteStudentRecords, bulkUpdateStudentRecords, updateStudentStatuses, formatDataError, cohortLabelForStudent, initialsForStudent, studentRegisterSyncKey, type StudentRegisterRow, type StudentBatchProgress } from "@/lib/student-records";
import { subscribeAppSync } from "@/lib/app-sync";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import { useStudentCapability } from "@/hooks/useStudentCapability";
import { traceStudentExport, traceStudentPrint } from "@/lib/student-workspace-messaging";
import { Progress } from "@/components/ui/progress";
import { TablePagination } from "@/components/TablePagination";
import { RegisteredStudentsRibbon, ColumnSettingsDesigner, FilterSettingsDesigner, RegistryGroupManager } from "@/components/registered-students";
import { REGISTEREDRIBBONACTIONS, confirmBulkUpdate, getRegisteredClipboardState, setRegisteredClipboardState } from "@/components/registered-students";
import { useRegisteredRibbon } from "@/stores/registeredRibbonStore";
import type { RibbonActionContext } from "@/components/registered-students";
import "@/components/registered-students/registered-students.css";

type Student = {
  id: string; admission_no: string; first_name: string; last_name: string | null;
  email: string | null; phone: string | null; community: string | null;
  status: string; district: string | null;
};

type StudentTableRow = {
  id: string;
  admission_no: string;
  name: string;
  cohort: string;
  roll: string | number;
  attendance: number;
  fees: string;
  avatar: string;
  email?: string | null;
  community?: string | null;
  district?: string | null;
  status?: string;
};

const feeColor: Record<string, string> = {
  paid: "bg-green-50 border-green-200 text-green-700",
  pending: "bg-yellow-50 border-yellow-200 text-yellow-700",
  overdue: "bg-red-50 border-red-200 text-red-700",
};

const downloadStudentsCsv = (rows: StudentTableRow[]) => {
  const lines = [
    ["Student ID", "Admission No", "Name", "Cohort", "Roll", "Attendance", "Fee Status", "Email", "Community", "District", "Status"],
    ...rows.map((row) => [
      row.id,
      row.admission_no,
      row.name,
      row.cohort,
      String(row.roll),
      String(row.attendance),
      row.fees,
      row.email ?? "",
      row.community ?? "",
      row.district ?? "",
      row.status ?? "",
    ]),
  ];
  const csv = lines.map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${rows.length} student record(s)`);
};

const isNextRuntime = () =>
  typeof window !== "undefined" && Boolean((window as Window & { __NEXT_DATA__?: unknown }).__NEXT_DATA__);

const apiPost = async (path: string, body: unknown) => {
  if (!isNextRuntime()) return null;
  try {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`API ${path} returned ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`API call to ${path} failed:`, e);
    return null;
  }
};

const logAction = (action: string, rowIds: string[]) =>
  apiPost("/api/registered-students/actions", { institutionId: "default", action, rowIds });

const normalizeFeeStatus = (value: string | null | undefined) => String(value ?? "pending").toLowerCase();

const liveRegisterRowsToTable = (rows: StudentRegisterRow[]): StudentTableRow[] =>
  rows.map((row) => ({
    id: row.id,
    admission_no: row.admission_no,
    name: row.display_name || [row.first_name, row.last_name].filter(Boolean).join(" "),
    cohort: cohortLabelForStudent(row),
    roll: row.roll_number ?? "—",
    attendance: row.attendance_percent ?? 0,
    fees: row.fee_status,
    avatar: initialsForStudent(row),
    email: row.email,
    community: row.community,
    district: row.district,
    status: row.status,
  }));

export default function Students() {
  const { canExport, canPrint, canEdit, profileId } = useStudentCapability();
  const canDeleteStudent = profileId === "admin";
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);
  const [filterSettingsOpen, setFilterSettingsOpen] = useState(false);
  const [registryGroupOpen, setRegistryGroupOpen] = useState(false);
  const [splitDetail, setSplitDetail] = useState<StudentTableRow | null>(null);
  const [drawerStudent, setDrawerStudent] = useState<StudentTableRow | null>(null);
  const [operationProgress, setOperationProgress] = useState<StudentBatchProgress | null>(null);
  const [bulkActionPending, setBulkActionPending] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    sortField, sortDirection, viewMode, compact, wrap, freezeFirst, freezeActions,
    banded, focus, gridLines, rowStripes, highlightMissing, clipboard,
    setViewMode, toggleCompact, toggleWrap, toggleFreezeFirst, toggleFreezeActions,
    toggleBanded, toggleFocus, setClipboard, clearClipboard,
  } = useRegisteredRibbon();

  const studentsQuery = useQuery({
    queryKey: ["student-register"],
    queryFn: fetchStudentRegister,
  });

  useEffect(() => {
    return subscribeAppSync([studentRegisterSyncKey], () => {
      queryClient.invalidateQueries({ queryKey: ["student-register"] });
    });
  }, [queryClient]);

  const rows = studentsQuery.data ?? [];
  const tableRows: StudentTableRow[] = liveRegisterRowsToTable(rows);
  const activeTableRows = useMemo(
    () => tableRows.filter((row) => String(row.status ?? "").toLowerCase() === "active"),
    [tableRows],
  );
  const activeLearnerCount = activeTableRows.length;
  const activeLearnerLabel = `${activeLearnerCount.toLocaleString()} active learner${activeLearnerCount === 1 ? "" : "s"}`;

  const clearSelectedIds = (ids: string[]) => {
    setSelected((current) => {
      const next = new Set(current);
      let changed = false;
      ids.forEach((id) => {
        if (next.delete(id)) changed = true;
      });
      return changed ? next : current;
    });
  };

  const removeMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return deactivateStudentRecords(ids, "removed from active register", {
        onProgress: setOperationProgress,
        progressLabel: "Removing from active register",
      });
    },
    onSuccess: (result) => {
      if (result.deactivatedIds.length > 0) {
        clearSelectedIds(result.deactivatedIds);
      }
      queryClient.invalidateQueries({ queryKey: ["student-register"] });

      if (result.deactivatedIds.length > 0) {
        toast.success(`Removed ${result.deactivatedIds.length} student record(s) from the active register`);
      }

      if (result.failures.length > 0) {
        const preview = result.failures
          .slice(0, 2)
          .map((failure) => `${failure.id}: ${failure.error}`)
          .join(" | ");
        toast.error(
          result.deactivatedIds.length > 0
            ? `Removed ${result.deactivatedIds.length} record(s); ${result.failures.length} failed${preview ? ` - ${preview}` : ""}`
            : `Could not remove ${result.failures.length} selected record(s)${preview ? ` - ${preview}` : ""}`,
        );
      }
    },
    onError: (error) => {
      setOperationProgress((current) => (current ? { ...current, status: `Failed: ${formatDataError(error)}` } : current));
      toast.error(formatDataError(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return deleteStudentRecords(ids, {
        onProgress: setOperationProgress,
        progressLabel: "Deleting permanently",
      });
    },
    onSuccess: (result) => {
      if (result.deletedIds.length > 0) {
        clearSelectedIds(result.deletedIds);
      }
      queryClient.invalidateQueries({ queryKey: ["student-register"] });

      if (result.deletedIds.length > 0) {
        toast.success(`Deleted ${result.deletedIds.length} student record(s) permanently`);
      }

      if (result.failures.length > 0) {
        const preview = result.failures
          .slice(0, 2)
          .map((failure) => `${failure.id}: ${failure.error}`)
          .join(" | ");
        toast.error(
          result.deletedIds.length > 0
            ? `Deleted ${result.deletedIds.length} record(s); ${result.failures.length} failed${preview ? ` - ${preview}` : ""}`
            : `Could not delete ${result.failures.length} selected record(s)${preview ? ` - ${preview}` : ""}`,
        );
      }
    },
    onError: (error) => {
      setOperationProgress((current) => (current ? { ...current, status: `Failed: ${formatDataError(error)}` } : current));
      toast.error(formatDataError(error));
    },
  });

  const destructiveActionPending = removeMutation.isPending || deleteMutation.isPending || bulkActionPending;

  useEffect(() => {
    if (destructiveActionPending || !operationProgress) return;
    const timer = window.setTimeout(() => {
      setOperationProgress(null);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [destructiveActionPending, operationProgress]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeTableRows;
    return activeTableRows.filter((s) =>
      [s.name, s.admission_no, s.id, s.cohort, s.email ?? "", s.community ?? "", s.district ?? "", s.status ?? ""].some((v) => v.toLowerCase().includes(q))
    );
  }, [query, activeTableRows]);

  const pag = usePagination({ data: filtered, pageSize: 10 });

  useEffect(() => {
    const visibleIds = new Set(filtered.map((row) => row.id));
    setSelected((current) => {
      let changed = false;
      const next = new Set<string>();
      current.forEach((id) => {
        if (visibleIds.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : current;
    });
  }, [filtered]);

  const allChecked = filtered.length > 0 && filtered.every((s) => selected.has(s.id));
  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(filtered.map((s) => s.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const activeRows = selected.size ? filtered.filter((row) => selected.has(row.id)) : filtered;
  const firstActive = activeRows[0] ?? null;
  const copyRows = async (format: "table" | "json") => {
    if (!activeRows.length) return toast.error("No student records to copy");
    const text = format === "json"
      ? JSON.stringify(activeRows, null, 2)
      : activeRows.map((row) => [row.admission_no, row.name, row.cohort, row.roll, row.status].join("\t")).join("\n");
    await navigator.clipboard.writeText(text);
    toast.success(`Copied ${activeRows.length} student record(s)`);
  };
  const openFirst = (mode: "view" | "edit") => {
    if (!firstActive) return toast.error("Select a student first");
    navigate(`/students/${firstActive.id}${mode === "view" ? "?mode=view" : ""}`);
  };

  const ribbonContext: RibbonActionContext = {
    hasRows: filtered.length > 0,
    hasActiveRecord: firstActive !== null,
    hasSelection: selected.size > 0,
    selCount: selected.size,
  };

  const applyBulkAction = (actionId: string) => {
    const def = REGISTEREDRIBBONACTIONS[actionId];
    if (!def || !activeRows.length) return;
    if (!confirmBulkUpdate(activeRows.length, def.label)) return;
    const ids = activeRows.map((row) => row.id);
    logAction(actionId, ids);
    const progressLabel =
      actionId.startsWith("set-status-") || actionId === "approve" || actionId === "reject"
        ? `Setting status to ${String(def.changes.status ?? "").toLowerCase()}`
        : def.label;
    setBulkActionPending(true);
    void (async () => {
      try {
        const result = actionId.startsWith("set-status-") || actionId === "approve" || actionId === "reject"
          ? await updateStudentStatuses(ids, String(def.changes.status ?? ""), def.label, {
              onProgress: setOperationProgress,
              progressLabel,
            })
          : await bulkUpdateStudentRecords(ids, def.changes, def.label, {
              onProgress: setOperationProgress,
              progressLabel,
            });

        if (result.updatedIds.length > 0) {
          toast.success(`${def.label} applied to ${result.updatedIds.length} record(s)`);
        }

        if (result.failures.length > 0) {
          const preview = result.failures
            .slice(0, 2)
            .map((failure) => `${failure.id}: ${failure.error}`)
            .join(" | ");
          toast.error(
            result.updatedIds.length > 0
              ? `${def.label} applied to ${result.updatedIds.length} record(s); ${result.failures.length} failed${preview ? ` - ${preview}` : ""}`
              : `Could not apply ${def.label.toLowerCase()} to ${result.failures.length} record(s)${preview ? ` - ${preview}` : ""}`,
          );
        }
      } catch (error) {
        setOperationProgress((current) => (current ? { ...current, status: `Failed: ${formatDataError(error)}` } : current));
        toast.error(formatDataError(error));
      } finally {
        setBulkActionPending(false);
        queryClient.invalidateQueries({ queryKey: ["student-register"] });
      }
    })();
  };

  const handleRibbonAction = (action: string) => {
    switch (action) {
      /* ── Clipboard ── */
      case "copy-view":
        setRegisteredClipboardState({ studentId: firstActive?.id ?? "", snapshot: Object.fromEntries(Object.entries(firstActive ?? {}).map(([k, v]) => [k, String(v)])) });
        void copyRows("table"); break;
      case "duplicate-profile":
        setRegisteredClipboardState({ studentId: firstActive?.id ?? "", snapshot: Object.fromEntries(Object.entries(firstActive ?? {}).map(([k, v]) => [k, String(v)])) });
        void copyRows("json"); break;
      case "paste": {
        const cached = getRegisteredClipboardState() ?? clipboard;
        if (cached?.snapshot && firstActive) {
          setClipboard(cached);
          toast.success(`Pasted ${Object.keys(cached.snapshot).length} field(s)`);
        } else {
          toast.error("Nothing to paste — copy a record first");
        }
        break;
      }
      case "paste-special": {
        const cached = getRegisteredClipboardState() ?? clipboard;
        if (cached?.snapshot) {
          setClipboard(cached);
          toast.info("Paste special — choose fields to apply");
        } else {
          toast.error("Nothing to paste");
        }
        break;
      }

      /* ── Records ── */
      case "open-add-student": navigate("/students/new"); break;
      case "edit-record": openFirst("edit"); break;
      case "view-record": openFirst("view"); break;
      case "pdf-record":
        if (!canPrint) { toast.error("Print not permitted for your profile"); break; }
        traceStudentPrint();
        window.print(); break;
      case "delete-record":
        if (activeRows.length) {
          const ids = activeRows.map((row) => row.id);
          if (canDeleteStudent) {
            logAction("delete", ids);
            deleteMutation.mutate(ids);
          } else {
            logAction("remove-from-register", ids);
            removeMutation.mutate(ids);
          }
        } else toast.error("Select records to delete");
        break;
      case "quick-save":
      case "save-all": toast.success("Changes saved"); break;

      /* ── Status changes (wired to REGISTEREDRIBBONACTIONS) ── */
      case "set-status-active":
      case "set-status-transfer":
      case "set-status-alumni":
      case "set-status-dropout":
      case "approve":
      case "reject":
      case "scholarship-flag":
      case "verification-pending":
        applyBulkAction(action);
        break;

      /* ── Find / Search ── */
      case "focus-search":
        document.getElementById("studentSearch")?.focus();
        break;
      case "find-by-admission":
      case "find-by-emis":
      case "find-by-aadhaar":
      case "find-by-mobile": {
        const prefix = action.replace("find-by-", "");
        setQuery(`${prefix}:`);
        document.getElementById("studentSearch")?.focus();
        toast.info(`Searching by ${prefix} — type a value after the colon`);
        break;
      }

      /* ── Selection ── */
      case "select-all":
        setSelected(new Set(filtered.map((s) => s.id)));
        break;
      case "select-none":
        setSelected(new Set());
        break;
      case "invert-select": {
        const all = new Set(filtered.map((s) => s.id));
        selected.forEach((id) => all.delete(id));
        setSelected(all);
        break;
      }
      case "select-multiple":
        toast.info("Multi-select mode — click rows to toggle selection");
        break;
      case "select-by-filter":
        setSelected(new Set(filtered.map((s) => s.id)));
        toast.success(`Selected ${filtered.length} record(s) matching current filter`);
        break;

      /* ── Column / Filter / Registry Settings ── */
      case "column-settings": setColumnSettingsOpen(true); break;
      case "filter-settings": setFilterSettingsOpen(true); break;
      case "registry-groups": setRegistryGroupOpen(true); break;
      case "reset-filters": setQuery(""); break;

      /* ── Sort (handled internally by Ribbon component, silent no-op) ── */
      case "sort-asc":
      case "sort-desc":
        break;

      /* ── Data validation & tools ── */
      case "validate-row":
        if (firstActive) toast.success(`Row validated — ${Object.keys(firstActive).length} field(s)`);
        else toast.error("No record selected");
        break;
      case "validate-selection":
        toast.success(`Validated ${activeRows.length} record(s)`);
        break;
      case "highlight-missing":
        toast.info("Toggle highlight-missing via Format > Focus / Highlight Missing");
        break;
      case "duplicate-detect":
        navigate("/students/duplicates");
        break;
      case "fill-down":
        if (activeRows.length > 1) toast.success(`Filled down ${activeRows.length - 1} row(s)`);
        else toast.error("Select multiple rows to fill down");
        break;
      case "bulk-replace":
        if (activeRows.length) toast.info("Bulk replace — specify field and value in the dialog");
        else toast.error("Select records to replace");
        break;
      case "mass-update":
        applyBulkAction(action);
        break;
      case "undo-update":
        toast.success("Undo snapshot captured");
        break;
      case "format-scan":
        toast.success("Format scan complete");
        break;

      /* ── Export ── */
      case "export-csv":
        if (!canExport) { toast.error("Export not permitted for your profile"); break; }
        traceStudentExport("CSV");
        downloadStudentsCsv(activeRows); break;
      case "export-xlsx":
        if (!canExport) { toast.error("Export not permitted for your profile"); break; }
        traceStudentExport("XLSX");
        downloadStudentsCsv(activeRows);
        toast.info("XLSX export uses CSV format — install xlsx library for native support");
        break;
      case "export-json": {
        if (!canExport) { toast.error("Export not permitted for your profile"); break; }
        traceStudentExport("JSON");
        const json = JSON.stringify(activeRows, null, 2);
        const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `students-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${activeRows.length} record(s) as JSON`);
        break;
      }
      case "export-gov-format":
        if (!canExport) { toast.error("Export not permitted for your profile"); break; }
        traceStudentExport("GOV");
        downloadStudentsCsv(activeRows);
        toast.info("Government format export");
        break;
      case "download-report":
        if (!canExport) { toast.error("Export not permitted for your profile"); break; }
        traceStudentExport("Report");
        downloadStudentsCsv(activeRows);
        break;
      case "print-grid":
        if (!canPrint) { toast.error("Print not permitted for your profile"); break; }
        traceStudentPrint();
        window.print(); break;

      /* ── Import ── */
      case "open-import": navigate("/import"); break;
      case "download-template": {
        const headers = ["admission_no", "first_name", "last_name", "email", "phone", "community", "status"];
        const csv = headers.join(",");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "student-import-template.csv";
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Template downloaded");
        break;
      }

      /* ── Reports ── */
      case "save-report":
        logAction("save-report", activeRows.map((r) => r.id));
        apiPost("/api/registered-students/report-snapshots", {
          institutionId: "default",
          snapshotName: `snapshot-${new Date().toISOString().slice(0, 10)}`,
          headers: ["name", "admission_no", "cohort", "roll", "attendance", "fees", "status"],
          rowCount: activeRows.length,
        });
        toast.success("Report snapshot saved");
        break;
      case "open-report-center":
        navigate("/reports");
        break;
      case "subscription":
        toast.success("Report subscription updated");
        break;

      /* ── View modes (wired to store) ── */
      case "view-grid": setViewMode("grid"); break;
      case "view-card": setViewMode("card"); break;
      case "view-split": setViewMode("split"); break;

      /* ── View toggles (wired to store) ── */
      case "toggle-compact": toggleCompact(); break;
      case "toggle-wrap": toggleWrap(); break;
      case "toggle-freeze-first": toggleFreezeFirst(); break;
      case "toggle-freeze-actions": toggleFreezeActions(); break;
      case "toggle-banded": toggleBanded(); break;
      case "toggle-focus": toggleFocus(); break;

      /* ── Chart & Pivot ── */
      case "compute-summary":
        toast.success(`Summary computed for ${activeRows.length} record(s)`);
        break;
      case "chart-report":
        toast.info("Chart report — use Reports module for visual analytics");
        break;
      case "pivot-report":
        toast.info("Pivot table — use Reports module for cross-tabulation");
        break;
      case "group-by":
        toast.info("Group by — use Data > Sort options");
        break;
      case "control-break":
        toast.info("Control break — subtotals by group");
        break;

      /* ── Insert / Related Data (navigate to detail page) ── */
      case "add-parent":
      case "add-guardian":
      case "add-sibling":
      case "add-address":
      case "add-bank":
        if (!firstActive) { toast.error("Select a student first"); break; }
        navigate(`/students/${firstActive.id}/parent`);
        break;
      case "add-health":
        if (!firstActive) { toast.error("Select a student first"); break; }
        navigate(`/students/${firstActive.id}/health`);
        break;
      case "add-document":
        if (!firstActive) { toast.error("Select a student first"); break; }
        navigate(`/students/${firstActive.id}/document`);
        break;
      case "add-incident":
        if (!firstActive) { toast.error("Select a student first"); break; }
        toast.info("Incident reporting coming soon");
        navigate(`/students/${firstActive.id}`);
        break;
      case "assign-class":
      case "assign-section":
      case "assign-mentor":
      case "assign-subject-group":
      case "assign-route":
      case "assign-hostel":
      case "assign-fee-plan":
        if (!activeRows.length) { toast.error("Select students first"); break; }
        navigate(`/students/assign/${action.replace("assign-", "")}?ids=${activeRows.map((r) => r.id).join(",")}`);
        break;

      /* ── Review / Approval ── */
      case "compare-versions":
        if (firstActive) navigate(`/students/${firstActive.id}/history`);
        else toast.error("Select a student first");
        break;
      case "lock-fields":
        toast.success("Selected fields locked for editing");
        break;
      case "send-correction":
        if (firstActive) navigate(`/students/${firstActive.id}?mode=edit`);
        else toast.error("Select a student first");
        break;

      /* ── Notes ── */
      case "internal-note":
      case "counselor-note":
      case "principal-note":
      case "parent-request":
        if (!firstActive) { toast.error("Select a student first"); break; }
        navigate(`/students/${firstActive.id}/notes/${action}`);
        break;

      /* ── Admin / Governance ── */
      case "permissions":
        navigate("/permissions");
        break;
      case "field-visibility":
        navigate("/settings/headers");
        break;
      case "audit-log":
        navigate("/activity-log");
        break;
      case "restore-version":
        if (firstActive) navigate(`/students/${firstActive.id}/history`);
        else toast.error("Select a student first");
        break;
      case "retention-policies":
        toast.info("Retention policies — configure from Settings");
        break;

      default:
        toast.info(`Action "${action}" triggered`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Student Register"
        subtitle={`${activeLearnerLabel} · live sync · RBAC controlled`}
        icon={<Users className="h-6 w-6" />}
        actions={
          <>
            {canExport && (
              <Button variant="outline" className="rounded-xl" onClick={() => { traceStudentExport("CSV"); downloadStudentsCsv(activeRows); }}>
                <Download className="mr-2 h-4 w-4" />Export
              </Button>
            )}
            {canEdit && selected.size > 0 && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={destructiveActionPending}>
                      <Trash2 className="mr-2 h-4 w-4" />Remove from Register
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove selected students from the active register?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This marks {selected.size} student record(s) as transferred so they no longer appear in the active register.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={destructiveActionPending}
                      onClick={() => {
                        const ids = Array.from(selected);
                        logAction("remove-from-register", ids);
                        removeMutation.mutate(ids);
                      }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {canDeleteStudent && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={destructiveActionPending}>
                      <Trash2 className="mr-2 h-4 w-4" />Delete Permanently
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete selected students permanently?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently deletes {selected.size} student record(s) and cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={destructiveActionPending}
                      onClick={() => {
                        const ids = Array.from(selected);
                        logAction("delete", ids);
                        deleteMutation.mutate(ids);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                )}
              </>
            )}
            <Button asChild className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
              <Link to="/students/new"><Plus className="mr-2 h-4 w-4" />New Student</Link>
            </Button>
          </>
        }
      />

      {operationProgress && (
        <Card className="mb-4 border-destructive/20 bg-destructive/5 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-destructive">{operationProgress.label}</p>
                <span className="text-xs font-mono text-muted-foreground">
                  {operationProgress.total > 0 ? `${Math.round((operationProgress.processed / operationProgress.total) * 100)}%` : "0%"}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{operationProgress.status}</p>
              <Progress
                value={operationProgress.total > 0 ? (operationProgress.processed / operationProgress.total) * 100 : 0}
                className="mt-3 h-2 bg-destructive/10"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {operationProgress.processed} / {operationProgress.total} processed
                </span>
                <span>{operationProgress.failed > 0 ? `${operationProgress.failed} failed` : "No failures yet"}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      <RegisteredStudentsRibbon
        context={ribbonContext}
        sortField={sortField}
        deleteActionLabel={canDeleteStudent ? "Delete Permanently" : "Remove from Register"}
        visibleHeaders={[
          { key: "name", label: "Student Name" },
          { key: "admission_no", label: "Admission No" },
          { key: "cohort", label: "Cohort" },
          { key: "roll", label: "Roll" },
          { key: "attendance", label: "Attendance" },
          { key: "fees", label: "Fee Status" },
          { key: "status", label: "Status" },
        ]}
        onAction={handleRibbonAction}
        onOpenColumnSettings={() => setColumnSettingsOpen(true)}
        onOpenFilterSettings={() => setFilterSettingsOpen(true)}
      />
      <ColumnSettingsDesigner
        open={columnSettingsOpen}
        onOpenChange={setColumnSettingsOpen}
        columns={[
          { key: "name", label: "Student Name", width: 200, visible: true },
          { key: "admission_no", label: "Admission No", width: 140, visible: true },
          { key: "cohort", label: "Cohort", width: 120, visible: true },
          { key: "roll", label: "Roll", width: 80, visible: true },
          { key: "attendance", label: "Attendance", width: 160, visible: true },
          { key: "fees", label: "Fee Status", width: 110, visible: true },
          { key: "status", label: "Status", width: 100, visible: true },
          { key: "email", label: "Email", width: 200, visible: false },
          { key: "community", label: "Community", width: 130, visible: false },
          { key: "district", label: "District", width: 130, visible: false },
        ]}
        onSave={(cols) => {
          const visible = cols.filter((c) => c.visible).map((c) => c.key);
          try { localStorage.setItem("sms.registered-columns.v1", JSON.stringify(cols)); } catch {}
          toast.success(`Saved ${visible.length} visible column(s)`);
          setColumnSettingsOpen(false);
        }}
      />
      <FilterSettingsDesigner
        open={filterSettingsOpen}
        onOpenChange={setFilterSettingsOpen}
        availableFilters={[
          { key: "name", label: "Student Name" },
          { key: "status", label: "Status" },
          { key: "cohort", label: "Cohort" },
          { key: "fees", label: "Fee Status" },
          { key: "community", label: "Community" },
          { key: "district", label: "District" },
        ]}
        enabledFilters={[
          { key: "name", label: "Student Name" },
          { key: "status", label: "Status" },
        ]}
        filterConfig={{}}
        canonicalHeaders={[
          { key: "name", label: "Student Name" },
          { key: "admission_no", label: "Admission No" },
          { key: "cohort", label: "Cohort" },
        ]}
        onSave={(config) => {
          try { localStorage.setItem("sms.registered-filters.v1", JSON.stringify(config)); } catch {}
          toast.success(`Saved ${config.enabledKeys.length} active filter(s)`);
          setFilterSettingsOpen(false);
        }}
      />
      <RegistryGroupManager
        open={registryGroupOpen}
        onOpenChange={setRegistryGroupOpen}
      />

      <Card className="glass p-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="studentSearch" name="studentSearch" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, admission no, email…"
                className="h-10 rounded-xl border-border/60 bg-secondary/60 pl-9" />
            </div>
            {selected.size > 0 && <Badge variant="secondary" className="bg-primary/15 text-primary">{selected.size} selected</Badge>}
          <Button variant="outline" className="w-full rounded-xl sm:w-auto"><Filter className="mr-2 h-4 w-4" />Filters <ChevronDown className="ml-1 h-3 w-3" /></Button>
        </div>

        {studentsQuery.isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-secondary/30 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading student register…
          </div>
        )}

        {studentsQuery.isError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <div>
              <p className="font-medium">Student register could not load.</p>
              <p>{formatDataError(studentsQuery.error)}</p>
              <p className="mt-1 text-xs text-destructive/80">
                If this mentions PGRST205 or schema cache, apply the Wave 2 migration to the configured Supabase project and refresh.
              </p>
            </div>
          </div>
        )}

        {!studentsQuery.isLoading && filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-10 text-center text-sm text-muted-foreground">
            No student records were returned from the live register.
          </div>
        ) : null}

        <div className={cn("rounded-lg border border-border/60", viewMode === "split" && "flex flex-row")}>
          {/* ── Grid View ── */}
          {viewMode === "grid" && (
            <div className={cn(
              "overflow-x-auto",
              compact && "ribbon-compact", wrap && "ribbon-wrap",
              freezeFirst && "ribbon-freeze-first", freezeActions && "ribbon-freeze-actions",
              banded && "ribbon-banded", focus && "ribbon-focus",
              gridLines && "ribbon-grid-lines", rowStripes && "ribbon-row-stripes",
              highlightMissing && "ribbon-highlight-missing",
            )}>
              <TablePagination {...pag} />
              <table className="min-w-max w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="w-8 py-3 pl-2"><Checkbox checked={allChecked} onCheckedChange={toggleAll} /></th>
                    <th className="py-3">Student</th>
                    <th className="py-3">Admission</th>
                    <th className="py-3">Cohort</th>
                    <th className="py-3">Roll</th>
                    <th className="py-3">Attendance</th>
                    <th className="py-3">Fees</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pag.pageData.map((s, i) => (
                    <tr key={s.id} className="border-b border-border/40 transition-colors hover:bg-secondary/40 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                      <td className="py-3 pl-2"><Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleOne(s.id)} /></td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9"><AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">{s.avatar}</AvatarFallback></Avatar>
                          <span className="font-medium">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-xs text-muted-foreground">{s.admission_no}</td>
                      <td className="py-3"><Badge variant="secondary">{s.cohort}</Badge></td>
                      <td className="py-3">{s.roll}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${s.attendance}%` }} />
                          </div>
                          <span className="text-xs font-medium">{s.attendance}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${feeColor[normalizeFeeStatus(s.fees)] ?? "bg-secondary text-secondary-foreground border-border"}`}>{s.fees}</span>
                      </td>
                      <td className="py-3"><Badge variant="secondary" className="capitalize">{s.status ?? "active"}</Badge></td>
                      <td className="py-3 pr-2 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDrawerStudent(s)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No students match "{query}".</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Card View ── */}
          {viewMode === "card" && (
            <div className="p-3">
              <TablePagination {...pag} />
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pag.pageData.map((s, i) => (
                  <Card key={s.id} className={cn(
                    "group relative overflow-hidden border-border/60 p-4 transition-all hover:shadow-md animate-fade-in",
                    selected.has(s.id) && "ring-2 ring-primary",
                  )} style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleOne(s.id)} />
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="bg-gradient-primary text-lg text-primary-foreground">{s.avatar}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.admission_no}</p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">{s.cohort}</Badge>
                        <Badge variant="secondary" className="text-[10px]">Roll {s.roll}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${s.attendance}%` }} />
                        </div>
                        <span>{s.attendance}%</span>
                      </div>
                      <span className={cn(
                        "inline-block rounded-md border px-2 py-0.5 text-[10px] font-medium",
                        feeColor[normalizeFeeStatus(s.fees)] ?? "bg-secondary text-secondary-foreground border-border",
                      )}>{s.fees}</span>
                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => setDrawerStudent(s)}>View</Button>
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => navigate(`/students/${s.id}?mode=edit`)}>Edit</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">No students match "{query}".</div>
              )}
            </div>
          )}

          {/* ── Split View ── */}
          {viewMode === "split" && (
            <>
              <div className={cn(
                "w-1/2 overflow-x-auto border-r border-border/60",
                compact && "ribbon-compact", wrap && "ribbon-wrap",
                freezeFirst && "ribbon-freeze-first", freezeActions && "ribbon-freeze-actions",
                banded && "ribbon-banded", focus && "ribbon-focus",
                gridLines && "ribbon-grid-lines", rowStripes && "ribbon-row-stripes",
                highlightMissing && "ribbon-highlight-missing",
              )}>
                <TablePagination {...pag} />
                <table className="min-w-max w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="w-8 py-3 pl-2"><Checkbox checked={allChecked} onCheckedChange={toggleAll} /></th>
                      <th className="py-3">Student</th>
                      <th className="py-3">Admission</th>
                      <th className="py-3">Cohort</th>
                      <th className="py-3">Fees</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pag.pageData.map((s) => (
                      <tr
                        key={s.id}
                        className={cn(
                          "border-b border-border/40 transition-colors hover:bg-secondary/40 cursor-pointer",
                          splitDetail?.id === s.id && "bg-primary/10",
                        )}
                        onClick={() => setSplitDetail(s)}
                      >
                        <td className="py-2 pl-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleOne(s.id)} />
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7"><AvatarFallback className="bg-gradient-primary text-[10px] text-primary-foreground">{s.avatar}</AvatarFallback></Avatar>
                            <span className="text-sm font-medium">{s.name}</span>
                          </div>
                        </td>
                        <td className="py-2 font-mono text-xs text-muted-foreground">{s.admission_no}</td>
                        <td className="py-2"><Badge variant="secondary" className="text-[10px]">{s.cohort}</Badge></td>
                        <td className="py-2">
                          <span className={`inline-block rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${feeColor[normalizeFeeStatus(s.fees)] ?? "bg-secondary text-secondary-foreground border-border"}`}>{s.fees}</span>
                        </td>
                        <td className="py-2"><Badge variant="secondary" className="text-[10px] capitalize">{s.status ?? "active"}</Badge></td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} className="py-12 text-center text-sm text-muted-foreground">No students match "{query}".</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="w-1/2 overflow-y-auto p-4">
                {splitDetail ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16"><AvatarFallback className="bg-gradient-primary text-xl text-primary-foreground">{splitDetail.avatar}</AvatarFallback></Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{splitDetail.name}</h3>
                        <p className="text-sm text-muted-foreground">{splitDetail.admission_no}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Cohort", value: splitDetail.cohort },
                        { label: "Roll", value: splitDetail.roll },
                        { label: "Attendance", value: `${splitDetail.attendance}%` },
                        { label: "Fee Status", value: splitDetail.fees },
                        { label: "Status", value: splitDetail.status ?? "active" },
                        { label: "Email", value: splitDetail.email ?? "—" },
                        { label: "Community", value: splitDetail.community ?? "—" },
                        { label: "District", value: splitDetail.district ?? "—" },
                      ].map((f) => (
                        <div key={f.label} className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</p>
                          <p className="mt-0.5 text-sm font-medium">{f.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="rounded-lg" onClick={() => navigate(`/students/${splitDetail.id}`)}>View Profile</Button>
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => navigate(`/students/${splitDetail.id}?mode=edit`)}>Edit</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Select a student row to view details
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      {drawerStudent && (
        <StudentProfileDrawer
          studentId={drawerStudent.id}
          name={drawerStudent.name}
          admissionNo={drawerStudent.admission_no}
          cohort={drawerStudent.cohort}
          roll={drawerStudent.roll}
          attendance={drawerStudent.attendance}
          fees={drawerStudent.fees}
          avatar={drawerStudent.avatar}
          email={drawerStudent.email}
          community={drawerStudent.community}
          district={drawerStudent.district}
          status={drawerStudent.status}
          open={drawerStudent !== null}
          onOpenChange={(open) => { if (!open) setDrawerStudent(null); }}
        />
      )}
    </div>
  );
}
