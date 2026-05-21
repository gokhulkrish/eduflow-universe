import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users, Search, Plus, Filter, Download, Copy, Edit3, Eye, FileText, Trash2,
  Clipboard, ClipboardPaste, Printer, RefreshCw, Settings2, ChevronDown,
  Loader2, AlertTriangle,
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
import {
  deleteStudentRecord,
  fetchStudentRegister,
  formatDataError,
  gradeLabelForStudent,
  initialsForStudent,
  type StudentRegisterRow,
} from "@/lib/student-records";
import { toast } from "sonner";

const feeColor: Record<string, string> = {
  Paid: "bg-success/15 text-success border-success/30",
  Pending: "bg-warning/15 text-warning border-warning/30",
  Overdue: "bg-destructive/15 text-destructive border-destructive/30",
};

type RibbonAction = { id: string; label: string; icon: any; onClick: () => void };

export default function Students() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const studentsQuery = useQuery({
    queryKey: ["student-register"],
    queryFn: fetchStudentRegister,
  });

  const rows = studentsQuery.data ?? [];

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
    if (!q) return rows;
    return rows.filter((s) =>
      [
        s.display_name,
        s.admission_no,
        s.grade,
        s.section,
        s.phone,
        s.guardian_name,
        s.umis_id,
        s.emis_id,
      ].some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [query, rows]);

  const allChecked = filtered.length > 0 && filtered.every((s) => selected.has(s.student_id));
  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(filtered.map((s) => s.student_id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const act = (label: string) => () => toast.success(`${label} · ${selected.size || 1} record(s)`);
  const selectedIds = Array.from(selected);
  const openFirstSelected = () => {
    const target = selectedIds[0] || filtered[0]?.student_id;
    target ? navigate(`/students/${target}`) : toast.info("Select a student first");
  };

  const groups: { title: string; actions: RibbonAction[] }[] = [
    {
      title: "Clipboard",
      actions: [
        { id: "copy", label: "Copy", icon: Copy, onClick: act("Copied") },
        { id: "dup", label: "Duplicate", icon: Clipboard, onClick: act("Duplicated") },
        { id: "paste", label: "Paste", icon: ClipboardPaste, onClick: act("Pasted") },
      ],
    },
    {
      title: "Records",
      actions: [
        { id: "new", label: "New", icon: Plus, onClick: () => navigate("/students/new") },
        { id: "edit", label: "Edit", icon: Edit3, onClick: openFirstSelected },
        { id: "view", label: "View", icon: Eye, onClick: openFirstSelected },
        { id: "pdf", label: "PDF", icon: FileText, onClick: act("PDF exported") },
        { id: "del", label: "Delete", icon: Trash2, onClick: () => selectedIds.length ? deleteMutation.mutate(selectedIds) : toast.info("Select students to delete") },
      ],
    },
    {
      title: "Data",
      actions: [
        { id: "exp", label: "Export", icon: Download, onClick: act("Exported") },
        { id: "print", label: "Print", icon: Printer, onClick: act("Print queued") },
        { id: "refresh", label: "Refresh", icon: RefreshCw, onClick: () => studentsQuery.refetch().then(() => toast.success("Register refreshed")) },
      ],
    },
    {
      title: "Advanced",
      actions: [
        { id: "set", label: "Settings", icon: Settings2, onClick: act("Opened settings") },
        { id: "filter", label: "Filters", icon: Filter, onClick: act("Filters opened") },
      ],
    },
  ];

  return (
    <div>
      <PageHeader
        title="Student Management"
        subtitle={`${rows.length.toLocaleString()} registered learner(s) · live Supabase register · RBAC controlled`}
        icon={<Users className="h-6 w-6" />}
        actions={
          <>
            <Button variant="outline" className="rounded-xl" onClick={act("Exported all")}>
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
                    <AlertDialogAction onClick={() => deleteMutation.mutate(selectedIds)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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

      {/* Excel-style ribbon (merged from registeredRibbon) */}
      <Card className="mb-4 overflow-hidden border-border/60 bg-card/70 backdrop-blur">
        <Tabs defaultValue="home">
          <TabsList className="h-10 w-full justify-start rounded-none border-b bg-transparent px-3">
            {["home", "data", "insert", "review", "import-export", "advanced", "admin"].map((t) => (
              <TabsTrigger key={t} value={t} className="rounded-md capitalize data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                {t.replace("-", " / ")}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="home" className="m-0">
            <div className="flex flex-wrap gap-2 p-3">
              {groups.map((g) => (
                <div key={g.title} className="flex flex-col items-stretch rounded-xl border border-border/60 bg-secondary/40 p-2">
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
            </div>
          </TabsContent>
          {["data", "insert", "review", "import-export", "advanced", "admin"].map((t) => (
            <TabsContent key={t} value={t} className="m-0 p-4 text-sm text-muted-foreground">
              Ribbon panel · {t}. Actions in this tab operate on {selected.size || "all"} selected record(s).
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      <Card className="glass p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, ID, grade…"
              className="h-10 rounded-xl border-border/60 bg-secondary/60 pl-9"
            />
          </div>
          {selected.size > 0 && (
            <Badge variant="secondary" className="bg-primary/15 text-primary">
              {selected.size} selected
            </Badge>
          )}
          <Button variant="outline" className="rounded-xl" onClick={act("Filtered")}>
            <Filter className="mr-2 h-4 w-4" />Filters <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="w-8 py-3 pl-2"><Checkbox checked={allChecked} onCheckedChange={toggleAll} /></th>
                <th className="py-3">Student</th>
                <th className="py-3">ID</th>
                <th className="py-3">Grade</th>
                <th className="py-3">Roll</th>
                <th className="py-3">Attendance</th>
                <th className="py-3">Fees</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {!studentsQuery.isLoading && filtered.map((s: StudentRegisterRow, i) => (
                <tr
                  key={s.student_id}
                  className="border-b border-border/40 transition-colors hover:bg-secondary/40 animate-fade-in"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <td className="py-3 pl-2">
                    <Checkbox checked={selected.has(s.student_id)} onCheckedChange={() => toggleOne(s.student_id)} />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">{initialsForStudent(s)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium">{s.display_name}</span>
                        {s.guardian_name && <p className="text-xs text-muted-foreground">{s.guardian_name}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-xs text-muted-foreground">{s.admission_no}</td>
                  <td className="py-3"><Badge variant="secondary">{gradeLabelForStudent(s)}</Badge></td>
                  <td className="py-3">{s.roll_number ?? "—"}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${s.attendance_percent}%` }} />
                      </div>
                      <span className="text-xs font-medium">{Math.round(s.attendance_percent)}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${feeColor[s.fee_status] ?? feeColor.Pending}`}>{s.fee_status}</span>
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/students/${s.student_id}`)}>
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!studentsQuery.isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                    {query ? `No students match "${query}".` : "No students have been registered yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
