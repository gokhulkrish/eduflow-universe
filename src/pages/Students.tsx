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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import {
  buildGroupRuntimeModel,
  clearGroupRuntimeStorage,
  GROUP_MODEL_STORAGE_KEY,
  getGroupRuntimeOverview,
  resetGroupRuntimeNamespace,
  toggleGroupSectionVisibility,
} from "@/lib/group-model";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

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

type RibbonAction = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
};

const feeColor: Record<string, string> = {
  paid: "bg-green-50 border-green-200 text-green-700",
  pending: "bg-yellow-50 border-yellow-200 text-yellow-700",
  overdue: "bg-red-50 border-red-200 text-red-700",
};

const STUDENT_RIBBON_GROUP_NAMESPACE = "students.ribbon";

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
  const [groupRuntime, setGroupRuntime] = useState(() => getGroupRuntimeOverview());
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const studentsQuery = useQuery({
    queryKey: ["student-register"],
    queryFn: fetchStudentRegister,
  });

  useEffect(() => {
    return subscribeAppSync([studentRegisterSyncKey], () => {
      queryClient.invalidateQueries({ queryKey: ["student-register"] });
    });
  }, [queryClient]);

  useEffect(() => {
    const sync = () => setGroupRuntime(getGroupRuntimeOverview());
    sync();
    return subscribeAppSync([GROUP_MODEL_STORAGE_KEY], sync);
  }, []);

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

  const ribbonModel = buildGroupRuntimeModel(STUDENT_RIBBON_GROUP_NAMESPACE, [
    {
      id: "clipboard",
      title: "Clipboard",
      actions: [
        { id: "copy", label: "Copy", icon: Copy, onClick: () => void copyRows("table") },
        { id: "dup", label: "JSON", icon: Clipboard, onClick: () => void copyRows("json") },
        { id: "paste", label: "Import", icon: ClipboardPaste, onClick: () => navigate("/import") },
      ],
    },
    {
      id: "records",
      title: "Records",
      actions: [
        { id: "new", label: "New", icon: Plus, onClick: () => navigate("/students/new") },
        { id: "edit", label: "Edit", icon: Edit3, onClick: () => openFirst("edit") },
        { id: "view", label: "View", icon: Eye, onClick: () => openFirst("view") },
        { id: "pdf", label: "Print", icon: FileText, onClick: () => window.print() },
        { id: "del", label: "Delete", icon: Trash2, onClick: () => activeRows.length ? deleteMutation.mutate(activeRows.map((row) => row.id)) : toast.error("Select records to delete") },
      ],
    },
    {
      id: "data",
      title: "Data",
      actions: [
        { id: "exp", label: "Export", icon: Download, onClick: () => downloadStudentsCsv(activeRows) },
        { id: "print", label: "Print", icon: Printer, onClick: () => window.print() },
        { id: "refresh", label: "Refresh", icon: RefreshCw, onClick: () => queryClient.invalidateQueries({ queryKey: ["student-register"] }) },
      ],
    },
    {
      id: "advanced",
      title: "Advanced",
      actions: [
        { id: "set", label: "Settings", icon: Settings2, onClick: () => navigate("/settings/headers") },
        { id: "filter", label: "Clear", icon: Filter, onClick: () => setQuery("") },
      ],
    },
  ]);

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

      <Card className="mb-4 overflow-hidden border-border/60 bg-card/70 backdrop-blur">
        <Tabs defaultValue="home">
          <TabsList className="h-10 w-full justify-start rounded-none border-b bg-transparent px-3">
            {["home","data","review","admin"].map((t) => (
              <TabsTrigger key={t} value={t} className="rounded-md capitalize data-[state=active]:bg-primary/10 data-[state=active]:text-primary">{t}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="home" className="m-0">
            <div className="space-y-3 p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {ribbonModel.sections.map((group) => (
                    <Button
                      key={group.id}
                      type="button"
                      variant={group.visible ? "default" : "outline"}
                      size="sm"
                      className="h-8 rounded-full px-3 text-xs"
                      onClick={() => toggleGroupSectionVisibility(STUDENT_RIBBON_GROUP_NAMESPACE, group.id)}
                    >
                      {group.title}
                      <span className="ml-2 rounded-full bg-background/20 px-1.5 py-0.5 font-mono text-[10px]">
                        {group.actionCount}
                      </span>
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {groupRuntime.namespaceCount} namespace(s)
                  </Badge>
                  <Badge variant="secondary" className="bg-warning/15 text-warning">
                    {groupRuntime.hiddenGroupCount} hidden group(s)
                  </Badge>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {ribbonModel.summary.visibleGroupCount}/{ribbonModel.summary.groupCount} groups visible
                  </Badge>
                  {ribbonModel.summary.collisionCount > 0 ? (
                    <Badge variant="secondary" className="bg-warning/15 text-warning">
                      {ribbonModel.summary.collisionCount} collision(s)
                    </Badge>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full"
                    onClick={() => resetGroupRuntimeNamespace(STUDENT_RIBBON_GROUP_NAMESPACE)}
                  >
                    Show all
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full"
                    onClick={() => {
                      clearGroupRuntimeStorage();
                      setGroupRuntime(getGroupRuntimeOverview());
                      toast.success("Group runtime cleared");
                    }}
                  >
                    Clear runtime
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {ribbonModel.sections.filter((group) => group.visible).map((g) => (
                  <div key={g.id} className="flex flex-col items-stretch rounded-xl border border-border/60 bg-secondary/40 p-2">
                    <div className="mb-1 flex gap-1">
                      {g.actions.map((a) => (
                        <button
                          key={a.id}
                          onClick={a.onClick}
                          className="flex w-16 flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[10px] transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <a.icon className="h-4 w-4" />
                          <span>{a.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-center text-[10px] uppercase tracking-wider text-muted-foreground">{g.title}</p>
                  </div>
                ))}
                {ribbonModel.summary.visibleGroupCount === 0 ? (
                  <Card className="border-dashed border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
                    All ribbon groups are hidden. Use the chips above to restore them.
                  </Card>
                ) : null}
              </div>
            </div>
          </TabsContent>
          {["data","review","admin"].map((t) => (
            <TabsContent key={t} value={t} className="m-0 p-4 text-sm text-muted-foreground">
              Ribbon panel · {t}. Acts on {selected.size || "all"} selected record(s).
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      <Card className="glass p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, admission no, email…"
              className="h-10 rounded-xl border-border/60 bg-secondary/60 pl-9" />
          </div>
          {selected.size > 0 && <Badge variant="secondary" className="bg-primary/15 text-primary">{selected.size} selected</Badge>}
          <Button variant="outline" className="rounded-xl"><Filter className="mr-2 h-4 w-4" />Filters <ChevronDown className="ml-1 h-3 w-3" /></Button>
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

        <div className="overflow-x-auto">
          <TablePagination {...pag} />
          <table className="w-full text-sm">
            <thead className="">
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
                <tr
                  key={s.id}
                  className="border-b border-border/40 transition-colors hover:bg-secondary/40 animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <td className="py-3 pl-2">
                    <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleOne(s.id)} />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">{s.avatar}</AvatarFallback>
                      </Avatar>
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
                  <td className="py-3">
                    <Badge variant="secondary" className="capitalize">{s.status ?? "active"}</Badge>
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/students/${s.id}`)}>
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No students match "{query}".</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
