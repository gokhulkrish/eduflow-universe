import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { Swords, Plus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";

type Incident = { id: string; student: string; type: string; description: string; date: string; severity: string; action: string; status: string; };
export const disciplineKey = "eduflow_discipline";
function ls(): Incident[] { try { return JSON.parse(localStorage.getItem(disciplineKey) ?? "[]"); } catch { return []; } }
function ss(v: Incident[]) { localStorage.setItem(disciplineKey, JSON.stringify(v)); emitAppSync(disciplineKey); }

export default function DisciplineRecord() {
  const [items, setItems] = useState(ls()); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [student, setStudent] = useState(""); const [type, setType] = useState(""); const [desc, setDesc] = useState(""); const [date, setDate] = useState(""); const [severity, setSeverity] = useState("minor"); const [action, setAction] = useState("");

  useEffect(() => subscribeAppSync([disciplineKey], refresh), []);

  const pag = usePagination({ data: items, pageSize: 10 });

  return (
    <div>
      <PageHeader title="Discipline Record" subtitle="Track student incidents & actions" icon={<Swords className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Incidents</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Open</p><p className="text-2xl font-bold text-warning">{items.filter((i) => i.status === "open").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Resolved</p><p className="text-2xl font-bold text-success">{items.filter((i) => i.status === "resolved").length}</p></Card>
      </div>
      <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setStudent(""); setType(""); setDesc(""); setDate(new Date().toISOString().split("T")[0]); setSeverity("minor"); setAction(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Record Incident</Button></div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader className=""><TableRow><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Severity</TableHead><TableHead className="text-xs">Action</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((i) => (
            <TableRow key={i.id}>
              <TableCell className="text-xs">{i.student}</TableCell>
              <TableCell className="text-xs">{i.type}</TableCell>
              <TableCell className="text-xs">{new Date(i.date).toLocaleDateString()}</TableCell>
              <TableCell><Badge className={`text-[9px] ${i.severity === "major" ? "bg-destructive/15 text-destructive" : i.severity === "moderate" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{i.severity}</Badge></TableCell>
              <TableCell className="text-xs">{i.action || "—"}</TableCell>
              <TableCell><Badge className={`text-[9px] ${i.status === "resolved" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{i.status}</Badge></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {i.status === "open" && <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => { ss(ls().map((x) => x.id === i.id ? { ...x, status: "resolved" } : x)); refresh(); toast.success("Resolved"); }}>Resolve</Button>}
                  <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== i.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">No incidents recorded</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Record Incident</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Student Name</Label><Input value={student} onChange={(e) => setStudent(e.target.value)} /></div><div><Label className="text-xs">Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Type</Label><Input value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Misconduct" /></div><div><Label className="text-xs">Severity</Label><Select value={severity} onValueChange={setSeverity}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="minor">Minor</SelectItem><SelectItem value="moderate">Moderate</SelectItem><SelectItem value="major">Major</SelectItem></SelectContent></Select></div></div>
            <div><Label className="text-xs">Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></div>
            <div><Label className="text-xs">Action Taken</Label><Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. Warning" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!student || !type} onClick={() => { const items = ls(); items.push({ id: crypto.randomUUID(), student, type, description: desc, date: new Date(date).toISOString(), severity, action, status: "open" }); ss(items); refresh(); setOpen(false); toast.success("Recorded"); }}>Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
