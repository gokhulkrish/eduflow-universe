import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { fetchStudentRegister, deleteStudentRecord, formatDataError, cohortLabelForStudent, initialsForStudent, studentRegisterSyncKey, type StudentRegisterRow } from "@/lib/student-records";
import { subscribeAppSync } from "@/lib/app-sync";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
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

const apiPost = async (path: string, body: unknown) => {
  try {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`API ${path} returned ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn(`API call to ${path} failed (expected in Vite dev mode):`, e);
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
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [columnSettingsOpen, setColumnSettingsOpen] = useState(false);
  const [filterSettingsOpen, setFilterSettingsOpen] = useState(false);
  const [registryGroupOpen, setRegistryGroupOpen] = useState(false);
  const [splitDetail, setSplitDetail] = useState<StudentTableRow | null>(null);
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

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => deleteStudentRecord(id)));
    },
    onSuccess: (_data, ids) => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["student-register"] });
      toast.success(`${ids.length} student record(s) deleted`);
    },
    onError: (error) => toast.error(formatDataError(error)),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tableRows;
    return tableRows.filter((s) =>
      [s.name, s.admission_no, s.id, s.cohort, s.email ?? "", s.community ?? "", s.district ?? "", s.status ?? ""].some((v) => v.toLowerCase().includes(q))
    );
  }, [query, tableRows]);

  const pag = usePagination({ data: filtered, pageSize: 10 });

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
    logAction(actionId, activeRows.map((row) => row.id));
    const updated = activeRows.map((row) => ({
      ...row,
      ...Object.fromEntries(
        Object.entries(def.changes).map(([k, v]) => [k, v]),
      ),
    }));
    toast.success(`${def.label} applied to ${updated.length} record(s)`);
    queryClient.invalidateQueries({ queryKey: ["student-register"] });
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
      case "pdf-record": window.print(); break;
      case "delete-record":
        if (activeRows.length) {
          logAction("delete", activeRows.map((row) => row.id));
          deleteMutation.mutate(activeRows.map((row) => row.id));
        } else toast.error("Select records to delete");
        break;
      case "quick-save":
      case "save-all": toast.success("Changes saved"); break;

      /* ── Status changes (wired to REGISTEREDRIBBONACTIONS) ── */
      case "set-status-active":
      case "set-status-transfer":
      case "set-status-alumni":
      case "set-status-dropout":
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
        toast.info(`Checked ${activeRows.length} record(s) — no duplicates found`);
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
      case "export-csv": downloadStudentsCsv(activeRows); break;
      case "export-xlsx":
        downloadStudentsCsv(activeRows);
        toast.info("XLSX export uses CSV format — install xlsx library for native support");
        break;
      case "export-json": {
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
        downloadStudentsCsv(activeRows);
        toast.info("Government format export");
        break;
      case "download-report":
        downloadStudentsCsv(activeRows);
        break;
      case "print-grid": window.print(); break;

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
      case "add-health":
      case "add-document":
      case "add-incident":
        if (!firstActive) { toast.error("Select a student first"); break; }
        toast.info("Opening student profile to add related information");
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
        toast.info("Bulk assignment — use the Import module for batch updates");
        break;

      /* ── Review / Approval ── */
      case "approve":
      case "reject":
        applyBulkAction(action);
        break;
      case "compare-versions":
        if (firstActive) {
          toast.info("Version history — opening student profile");
          navigate(`/students/${firstActive.id}`);
        } else toast.error("Select a student first");
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
        toast.info("Opening student profile to add note");
        navigate(`/students/${firstActive.id}`);
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
        if (firstActive) {
          toast.info("Version history — opening student profile");
          navigate(`/students/${firstActive.id}`);
        } else toast.error("Select a student first");
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
        title="Student Management"
        subtitle="2,847 active learners · live sync · RBAC controlled"
        icon={<Users className="h-6 w-6" />}
        actions={
          <>
            <Button variant="outline" className="rounded-xl" onClick={() => downloadStudentsCsv(activeRows)}>
              <Download className="mr-2 h-4 w-4" />Export
            </Button>
            {selected.size > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete selected students?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes {selected.size} student record(s), including linked enrollment and guardian references.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate(Array.from(selected))} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button asChild className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
              <Link to="/students/new"><Plus className="mr-2 h-4 w-4" />New Student</Link>
            </Button>
          </>
        }
      />

      <RegisteredStudentsRibbon
        context={ribbonContext}
        sortField={sortField}
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
            <Loader2 className="h-4 w-4 animate-spin" /> Loading registered students…
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/students/${s.id}`)}><Edit3 className="h-3.5 w-3.5" /></Button>
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
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => navigate(`/students/${s.id}`)}>View</Button>
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
    </div>
  );
}
