import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, Search, Plus, Filter, Download, Edit3, Eye, FileText, Trash2,
  Printer, RefreshCw, Settings2, ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { useDbList } from "@/hooks/useDbList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Student = {
  id: string; admission_no: string; first_name: string; last_name: string | null;
  email: string | null; phone: string | null; community: string | null;
  status: string; district: string | null;
};

export default function Students() {
  const { data: students, loading, reload } = useDbList<Student>("students", { order: { column: "created_at", ascending: false } });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      [s.first_name, s.last_name ?? "", s.admission_no, s.email ?? ""].some((v) => v.toLowerCase().includes(q))
    );
  }, [query, students]);

  const allChecked = filtered.length > 0 && filtered.every((s) => selected.has(s.id));
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(filtered.map((s) => s.id)));
  const toggleOne = (id: string) => {
    const next = new Set(selected); next.has(id) ? next.delete(id) : next.add(id); setSelected(next);
  };

  const deleteSelected = async () => {
    if (!selected.size) return;
    const { error } = await supabase.from("students").delete().in("id", Array.from(selected));
    if (error) toast.error(error.message);
    else { toast.success(`Deleted ${selected.size} record(s)`); setSelected(new Set()); reload(); }
  };

  const exportCsv = () => {
    const rows = [["Admission","Name","Email","Phone","Community","District","Status"]];
    filtered.forEach(s => rows.push([s.admission_no, `${s.first_name} ${s.last_name ?? ""}`.trim(), s.email ?? "", s.phone ?? "", s.community ?? "", s.district ?? "", s.status]));
    const blob = new Blob([rows.map(r => r.map(c => `"${(c+"").replace(/"/g,'""')}"`).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "students.csv"; a.click();
    toast.success("Exported CSV");
  };

  const ribbon = [
    { title: "Records", actions: [
      { id: "new", label: "New", icon: Plus, onClick: () => (window.location.href = "/students/new") },
      { id: "edit", label: "Edit", icon: Edit3, onClick: () => toast.info("Edit · select a row") },
      { id: "view", label: "View", icon: Eye, onClick: () => toast.info("View · select a row") },
      { id: "del", label: "Delete", icon: Trash2, onClick: deleteSelected },
    ]},
    { title: "Data", actions: [
      { id: "exp", label: "Export", icon: Download, onClick: exportCsv },
      { id: "print", label: "Print", icon: Printer, onClick: () => window.print() },
      { id: "refresh", label: "Refresh", icon: RefreshCw, onClick: reload },
      { id: "pdf", label: "PDF", icon: FileText, onClick: () => toast.info("PDF export queued") },
    ]},
    { title: "Advanced", actions: [
      { id: "set", label: "Settings", icon: Settings2, onClick: () => (window.location.href = "/settings/headers") },
      { id: "filter", label: "Filters", icon: Filter, onClick: () => toast.info("Filter panel coming") },
    ]},
  ];

  return (
    <div>
      <PageHeader
        title="Student Register"
        subtitle={`${students.length} students · live sync · RBAC controlled`}
        icon={<Users className="h-6 w-6" />}
        actions={
          <>
            <Button variant="outline" className="rounded-xl" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" />Export
            </Button>
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
            <div className="flex flex-wrap gap-2 p-3">
              {ribbon.map((g) => (
                <div key={g.title} className="flex flex-col items-stretch rounded-xl border border-border/60 bg-secondary/40 p-2">
                  <div className="mb-1 flex gap-1">
                    {g.actions.map((a) => (
                      <button key={a.id} onClick={a.onClick}
                        className="flex w-16 flex-col items-center gap-1 rounded-md px-1 py-1.5 text-[10px] transition-colors hover:bg-primary/10 hover:text-primary">
                        <a.icon className="h-4 w-4" /><span>{a.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-[10px] uppercase tracking-wider text-muted-foreground">{g.title}</p>
                </div>
              ))}
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="w-8 py-3 pl-2"><Checkbox checked={allChecked} onCheckedChange={toggleAll} /></th>
                <th className="py-3">Student</th>
                <th className="py-3">Admission</th>
                <th className="py-3">Email</th>
                <th className="py-3">Community</th>
                <th className="py-3">District</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">Loading…</td></tr>}
              {!loading && filtered.map((s, i) => {
                const name = `${s.first_name} ${s.last_name ?? ""}`.trim();
                const initials = name.split(" ").map(p => p[0]).join("").slice(0,2).toUpperCase();
                return (
                  <tr key={s.id} className="border-b border-border/40 transition-colors hover:bg-secondary/40 animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                    <td className="py-3 pl-2"><Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggleOne(s.id)} /></td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9"><AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">{initials}</AvatarFallback></Avatar>
                        <span className="font-medium">{name}</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-xs text-muted-foreground">{s.admission_no}</td>
                    <td className="py-3 text-xs">{s.email}</td>
                    <td className="py-3"><Badge variant="secondary">{s.community ?? "—"}</Badge></td>
                    <td className="py-3 text-xs">{s.district ?? "—"}</td>
                    <td className="py-3"><Badge className="bg-success/15 text-success border-success/30 border">{s.status}</Badge></td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No students match "{query}".</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
