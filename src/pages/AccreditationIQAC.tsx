import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { ShieldCheck, Plus, Trash2, Search } from "lucide-react";
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

type Accreditation = { id: string; qualityCycle: string; framework: string; criterion: string; evidenceStatus: string; owner: string; };
const ACC_KEY = "eduflow_accreditation";
function ls(): Accreditation[] { try { return JSON.parse(localStorage.getItem(ACC_KEY) ?? "[]"); } catch { return []; } }
function ss(v: Accreditation[]) { localStorage.setItem(ACC_KEY, JSON.stringify(v)); emitAppSync(ACC_KEY); }

export default function AccreditationIQAC() {
  const [items, setItems] = useState(ls()); const [search, setSearch] = useState(""); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [cycle, setCycle] = useState(""); const [frame, setFrame] = useState(""); const [criterion, setCriterion] = useState(""); const [evidence, setEvidence] = useState(""); const [owner, setOwner] = useState("");
  const filtered = items.filter((a) => !search || a.qualityCycle.toLowerCase().includes(search.toLowerCase()) || a.framework?.toLowerCase().includes(search.toLowerCase()) || a.criterion?.toLowerCase().includes(search.toLowerCase()));
  const pag = usePagination({ data: filtered, pageSize: 10 });

  useEffect(() => subscribeAppSync([ACC_KEY], refresh), []);

  return (
    <div>
      <PageHeader title="Accreditation & IQAC" subtitle="NAAC, NBA, NIRF, AISHE, SSR/DVV evidence & quality cycles" icon={<ShieldCheck className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Records</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Frameworks</p><p className="text-2xl font-bold">{new Set(items.map((a) => a.framework).filter(Boolean)).size}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Evidence Submitted</p><p className="text-2xl font-bold">{items.filter((a) => a.evidenceStatus === "Submitted" || a.evidenceStatus === "Accepted").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Pending</p><p className="text-2xl font-bold text-destructive">{items.filter((a) => a.evidenceStatus === "Pending").length}</p></Card>
      </div>
      <div className="flex gap-3 mb-4">
        <Input id="search-accreditation" name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search accreditation records..." className="flex-1 h-9 text-xs" />
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setCycle(""); setFrame(""); setCriterion(""); setEvidence(""); setOwner(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Record</Button>
      </div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader><TableRow><TableHead className="text-xs">Quality Cycle</TableHead><TableHead className="text-xs">Framework</TableHead><TableHead className="text-xs">Criterion</TableHead><TableHead className="text-xs">Evidence</TableHead><TableHead className="text-xs">Owner</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="text-xs font-medium">{a.qualityCycle}</TableCell>
              <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{a.framework || "—"}</Badge></TableCell>
              <TableCell className="text-xs">{a.criterion || "—"}</TableCell>
              <TableCell><Badge className={`text-[9px] ${a.evidenceStatus === "Accepted" || a.evidenceStatus === "Submitted" ? "bg-success/15 text-success" : a.evidenceStatus === "Verified" ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"}`}>{a.evidenceStatus || "Pending"}</Badge></TableCell>
              <TableCell className="text-xs">{a.owner || "—"}</TableCell>
              <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== a.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">{search ? "No matching records" : "No accreditation records added"}</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Accreditation Record</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="cycle">Quality Cycle</Label><Input id="cycle" name="qualityCycle" value={cycle} onChange={(e) => setCycle(e.target.value)} placeholder="e.g. 2024-25" /></div><div><Label className="text-xs" htmlFor="framework">Framework</Label><Select value={frame} onValueChange={setFrame}><SelectTrigger id="framework" className="h-9 text-xs" name="framework"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="NAAC">NAAC</SelectItem><SelectItem value="NBA">NBA</SelectItem><SelectItem value="NIRF">NIRF</SelectItem><SelectItem value="AISHE">AISHE</SelectItem><SelectItem value="AQAR">AQAR</SelectItem><SelectItem value="Internal Audit">Internal Audit</SelectItem></SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="criterion">Criterion / Metric</Label><Input id="criterion" name="criterion" value={criterion} onChange={(e) => setCriterion(e.target.value)} /></div><div><Label className="text-xs" htmlFor="evidenceStatus">Evidence Status</Label><Select value={evidence} onValueChange={setEvidence}><SelectTrigger id="evidenceStatus" className="h-9 text-xs" name="evidenceStatus"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Collected">Collected</SelectItem><SelectItem value="Verified">Verified</SelectItem><SelectItem value="Submitted">Submitted</SelectItem><SelectItem value="Accepted">Accepted</SelectItem></SelectContent></Select></div></div>
            <div><Label className="text-xs" htmlFor="owner">Owner</Label><Input id="owner" name="owner" value={owner} onChange={(e) => setOwner(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!cycle} onClick={() => { const items = ls(); items.push({ id: crypto.randomUUID(), qualityCycle: cycle, framework: frame, criterion, evidenceStatus: evidence, owner }); ss(items); refresh(); setOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
