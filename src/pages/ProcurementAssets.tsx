import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { Package, Plus, Trash2, Search } from "lucide-react";
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

type Procurement = { id: string; requestTitle: string; vendorName: string; assetTag: string; departmentName: string; procurementStatus: string; };
const PROC_KEY = "eduflow_procurement";
function ls(): Procurement[] { try { return JSON.parse(localStorage.getItem(PROC_KEY) ?? "[]"); } catch { return []; } }
function ss(v: Procurement[]) { localStorage.setItem(PROC_KEY, JSON.stringify(v)); emitAppSync(PROC_KEY); }

export default function ProcurementAssets() {
  const [items, setItems] = useState(ls()); const [search, setSearch] = useState(""); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [title, setTitle] = useState(""); const [vendor, setVendor] = useState(""); const [tag, setTag] = useState(""); const [dept, setDept] = useState(""); const [status, setStatus] = useState("");
  const filtered = items.filter((p) => !search || p.requestTitle.toLowerCase().includes(search.toLowerCase()) || p.vendorName?.toLowerCase().includes(search.toLowerCase()) || p.assetTag?.toLowerCase().includes(search.toLowerCase()));
  const pag = usePagination({ data: filtered, pageSize: 10 });

  useEffect(() => subscribeAppSync([PROC_KEY], refresh), []);

  return (
    <div>
      <PageHeader title="Procurement & Assets" subtitle="Purchase requests, vendor management & asset tracking" icon={<Package className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Requests</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Approved / Ordered</p><p className="text-2xl font-bold">{items.filter((p) => p.procurementStatus === "Approved" || p.procurementStatus === "Ordered").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Received</p><p className="text-2xl font-bold">{items.filter((p) => p.procurementStatus === "Received" || p.procurementStatus === "Issued").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Pending / Requested</p><p className="text-2xl font-bold text-destructive">{items.filter((p) => p.procurementStatus === "Requested" || p.procurementStatus === "Quoted").length}</p></Card>
      </div>
      <div className="flex gap-3 mb-4">
        <Input id="procSearch" name="procSearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests..." className="flex-1 h-9 text-xs" />
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setTitle(""); setVendor(""); setTag(""); setDept(""); setStatus(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Request</Button>
      </div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader><TableRow><TableHead className="text-xs">Request / Asset</TableHead><TableHead className="text-xs">Vendor</TableHead><TableHead className="text-xs">Asset Tag</TableHead><TableHead className="text-xs">Department</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="text-xs font-medium">{p.requestTitle}</TableCell>
              <TableCell className="text-xs">{p.vendorName || "—"}</TableCell>
              <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{p.assetTag || "—"}</Badge></TableCell>
              <TableCell className="text-xs">{p.departmentName || "—"}</TableCell>
              <TableCell><Badge className={`text-[9px] ${p.procurementStatus === "Received" || p.procurementStatus === "Issued" ? "bg-success/15 text-success" : p.procurementStatus === "Approved" || p.procurementStatus === "Ordered" ? "bg-info/15 text-info" : p.procurementStatus === "Quoted" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{p.procurementStatus || "Requested"}</Badge></TableCell>
              <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== p.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">{search ? "No matching requests" : "No procurement requests added"}</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Procurement Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="procTitle">Request / Asset Title</Label><Input id="procTitle" name="procTitle" value={title} onChange={(e) => setTitle(e.target.value)} /></div><div><Label className="text-xs" htmlFor="procVendor">Vendor</Label><Input id="procVendor" name="procVendor" value={vendor} onChange={(e) => setVendor(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="procTag">Asset Tag</Label><Input id="procTag" name="procTag" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. AST-001" /></div><div><Label className="text-xs" htmlFor="procDept">Department</Label><Input id="procDept" name="procDept" value={dept} onChange={(e) => setDept(e.target.value)} /></div></div>
            <div><Label className="text-xs" htmlFor="procStatus">Procurement Status</Label><Select name="procStatus" value={status} onValueChange={setStatus}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Requested">Requested</SelectItem><SelectItem value="Quoted">Quoted</SelectItem><SelectItem value="Approved">Approved</SelectItem><SelectItem value="Ordered">Ordered</SelectItem><SelectItem value="Received">Received</SelectItem><SelectItem value="Issued">Issued</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!title} onClick={() => { const items = ls(); items.push({ id: generateId(), requestTitle: title, vendorName: vendor, assetTag: tag, departmentName: dept, procurementStatus: status }); ss(items); refresh(); setOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
