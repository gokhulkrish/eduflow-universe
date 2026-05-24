import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { Heart, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

type Case = { id: string; caseTitle: string; personName: string; caseType: string; followUpDate: string; careStatus: string; };
const HEALTH_KEY = "eduflow_health";
function ls(): Case[] { try { return JSON.parse(localStorage.getItem(HEALTH_KEY) ?? "[]"); } catch { return []; } }
function ss(v: Case[]) { localStorage.setItem(HEALTH_KEY, JSON.stringify(v)); emitAppSync(HEALTH_KEY); }

export default function HealthWellbeing() {
  const [items, setItems] = useState(ls()); const [search, setSearch] = useState(""); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [title, setTitle] = useState(""); const [person, setPerson] = useState(""); const [caseType, setCaseType] = useState(""); const [followUp, setFollowUp] = useState(""); const [status, setStatus] = useState("");
  const filtered = items.filter((c) => !search || c.caseTitle.toLowerCase().includes(search.toLowerCase()) || c.personName?.toLowerCase().includes(search.toLowerCase()));
  const pag = usePagination({ data: filtered, pageSize: 10 });

  useEffect(() => subscribeAppSync([HEALTH_KEY], refresh), []);

  return (
    <div>
      <PageHeader title="Health & Wellbeing" subtitle="Health records, counselling & campus clinic follow-ups" icon={<Heart className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Cases</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Open</p><p className="text-2xl font-bold">{items.filter((c) => c.careStatus === "Open" || c.careStatus === "Monitoring").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Referred</p><p className="text-2xl font-bold">{items.filter((c) => c.careStatus === "Referred").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Closed</p><p className="text-2xl font-bold">{items.filter((c) => c.careStatus === "Closed").length}</p></Card>
      </div>
      <div className="flex gap-3 mb-4">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search cases..." className="flex-1 h-9 text-xs" />
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setTitle(""); setPerson(""); setCaseType(""); setFollowUp(""); setStatus(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Case</Button>
      </div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader><TableRow><TableHead className="text-xs">Case Title</TableHead><TableHead className="text-xs">Person</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Follow-up</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="text-xs font-medium">{c.caseTitle}</TableCell>
              <TableCell className="text-xs">{c.personName || "—"}</TableCell>
              <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{c.caseType || "—"}</Badge></TableCell>
              <TableCell className="text-xs">{c.followUpDate || "—"}</TableCell>
              <TableCell><Badge className={`text-[9px] ${c.careStatus === "Closed" ? "bg-success/15 text-success" : c.careStatus === "Open" || c.careStatus === "Monitoring" ? "bg-info/15 text-info" : c.careStatus === "Referred" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{c.careStatus || "Open"}</Badge></TableCell>
              <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== c.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">{search ? "No matching cases" : "No health cases recorded"}</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Health Case</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Case Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div><div><Label className="text-xs">Person Name</Label><Input value={person} onChange={(e) => setPerson(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Case Type</Label><Select value={caseType} onValueChange={setCaseType}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Medical">Medical</SelectItem><SelectItem value="Counselling">Counselling</SelectItem><SelectItem value="Emergency">Emergency</SelectItem><SelectItem value="Wellbeing">Wellbeing</SelectItem><SelectItem value="Follow-up">Follow-up</SelectItem></SelectContent></Select></div><div><Label className="text-xs">Follow-up Date</Label><Input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} /></div></div>
            <div><Label className="text-xs">Care Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Open">Open</SelectItem><SelectItem value="Monitoring">Monitoring</SelectItem><SelectItem value="Referred">Referred</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!title} onClick={() => { const items = ls(); items.push({ id: crypto.randomUUID(), caseTitle: title, personName: person, caseType, followUpDate: followUp, careStatus: status }); ss(items); refresh(); setOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
