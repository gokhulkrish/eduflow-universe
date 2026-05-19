import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, Search, Plus, Filter, Download, Copy, Edit3, Eye, FileText, Trash2,
  Clipboard, ClipboardPaste, Printer, RefreshCw, Settings2, ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { students } from "@/lib/mock-data";
import { toast } from "sonner";

const feeColor: Record<string, string> = {
  Paid: "bg-success/15 text-success border-success/30",
  Pending: "bg-warning/15 text-warning border-warning/30",
  Overdue: "bg-destructive/15 text-destructive border-destructive/30",
};

type RibbonAction = { id: string; label: string; icon: any; onClick: () => void };

export default function Students() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.name, s.id, s.grade].some((v) => v.toLowerCase().includes(q))
    );
  }, [query]);

  const allChecked = filtered.length > 0 && filtered.every((s) => selected.has(s.id));
  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(filtered.map((s) => s.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const act = (label: string) => () => toast.success(`${label} · ${selected.size || 1} record(s)`);

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
        { id: "new", label: "New", icon: Plus, onClick: () => (window.location.href = "/students/new") },
        { id: "edit", label: "Edit", icon: Edit3, onClick: act("Edit opened") },
        { id: "view", label: "View", icon: Eye, onClick: act("View opened") },
        { id: "pdf", label: "PDF", icon: FileText, onClick: act("PDF exported") },
        { id: "del", label: "Delete", icon: Trash2, onClick: act("Deleted") },
      ],
    },
    {
      title: "Data",
      actions: [
        { id: "exp", label: "Export", icon: Download, onClick: act("Exported") },
        { id: "print", label: "Print", icon: Printer, onClick: act("Print queued") },
        { id: "refresh", label: "Refresh", icon: RefreshCw, onClick: act("Refreshed") },
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
        subtitle="2,847 active learners · live sync · RBAC controlled"
        icon={<Users className="h-6 w-6" />}
        actions={
          <>
            <Button variant="outline" className="rounded-xl" onClick={act("Exported all")}>
              <Download className="mr-2 h-4 w-4" />Export
            </Button>
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
              {filtered.map((s, i) => (
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
                  <td className="py-3 font-mono text-xs text-muted-foreground">{s.id}</td>
                  <td className="py-3"><Badge variant="secondary">{s.grade}</Badge></td>
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
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${feeColor[s.fees]}`}>{s.fees}</span>
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={act("Opened actions")}>
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
