import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { FlaskConical, Plus, Trash2, Search } from "lucide-react";
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
import { generateId } from "@/lib/utils";

type Research = { id: string; researchTitle: string; principalInvestigator: string; fundingAgency: string; grantAmount: number; researchStage: string; };
const RES_KEY = "eduflow_research";
function ls(): Research[] { try { return JSON.parse(localStorage.getItem(RES_KEY) ?? "[]"); } catch { return []; } }
function ss(v: Research[]) { localStorage.setItem(RES_KEY, JSON.stringify(v)); emitAppSync(RES_KEY); }

export default function ResearchInnovation() {
  const [items, setItems] = useState(ls()); const [search, setSearch] = useState(""); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [title, setTitle] = useState(""); const [pi, setPi] = useState(""); const [agency, setAgency] = useState(""); const [amount, setAmount] = useState(""); const [stage, setStage] = useState("");
  const filtered = items.filter((r) => !search || r.researchTitle.toLowerCase().includes(search.toLowerCase()) || r.principalInvestigator?.toLowerCase().includes(search.toLowerCase()));
  const pag = usePagination({ data: filtered, pageSize: 10 });

  useEffect(() => subscribeAppSync([RES_KEY], refresh), []);

  return (
    <div>
      <PageHeader title="Research & Innovation" subtitle="Projects, publications, patents, grants & innovation-cell tracking" icon={<FlaskConical className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Projects</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Active / Ongoing</p><p className="text-2xl font-bold">{items.filter((r) => r.researchStage === "Ongoing" || r.researchStage === "Approved").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Completed</p><p className="text-2xl font-bold">{items.filter((r) => r.researchStage === "Completed" || r.researchStage === "Published" || r.researchStage === "Patented").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Grants</p><p className="text-2xl font-bold">${(items.reduce((s, r) => s + (r.grantAmount || 0), 0)).toLocaleString()}</p></Card>
      </div>
      <div className="flex gap-3 mb-4">
        <Input id="researchSearch" name="researchSearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="flex-1 h-9 text-xs" />
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setTitle(""); setPi(""); setAgency(""); setAmount(""); setStage(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Project</Button>
      </div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader><TableRow><TableHead className="text-xs">Title</TableHead><TableHead className="text-xs">PI</TableHead><TableHead className="text-xs">Funding Agency</TableHead><TableHead className="text-xs">Grant Amount</TableHead><TableHead className="text-xs">Stage</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="text-xs font-medium">{r.researchTitle}</TableCell>
              <TableCell className="text-xs">{r.principalInvestigator || "—"}</TableCell>
              <TableCell className="text-xs">{r.fundingAgency || "—"}</TableCell>
              <TableCell className="text-xs">{r.grantAmount ? `$${r.grantAmount.toLocaleString()}` : "—"}</TableCell>
              <TableCell><Badge className={`text-[9px] ${r.researchStage === "Completed" || r.researchStage === "Published" || r.researchStage === "Patented" ? "bg-success/15 text-success" : r.researchStage === "Ongoing" || r.researchStage === "Approved" ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"}`}>{r.researchStage || "Proposal"}</Badge></TableCell>
              <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== r.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">{search ? "No matching projects" : "No projects added"}</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Research Project</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="researchTitle">Project Title</Label><Input id="researchTitle" name="researchTitle" value={title} onChange={(e) => setTitle(e.target.value)} /></div><div><Label className="text-xs" htmlFor="researchPi">Principal Investigator</Label><Input id="researchPi" name="researchPi" value={pi} onChange={(e) => setPi(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="researchAgency">Funding Agency</Label><Input id="researchAgency" name="researchAgency" value={agency} onChange={(e) => setAgency(e.target.value)} /></div><div><Label className="text-xs" htmlFor="researchAmount">Grant Amount ($)</Label><Input id="researchAmount" name="researchAmount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div></div>
            <div><Label className="text-xs" htmlFor="researchStage">Stage</Label><Select name="researchStage" value={stage} onValueChange={setStage}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Proposal">Proposal</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Ongoing">Ongoing</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Published">Published</SelectItem><SelectItem value="Patented">Patented</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!title} onClick={() => { const items = ls(); items.push({ id: generateId(), researchTitle: title, principalInvestigator: pi, fundingAgency: agency, grantAmount: Number(amount) || 0, researchStage: stage }); ss(items); refresh(); setOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
