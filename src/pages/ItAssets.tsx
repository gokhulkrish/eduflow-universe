import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { Monitor, Plus, Search, Wrench, UserCheck, Trash2, History } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { generateId } from "@/lib/utils";

type AssetCategory = "desktop" | "laptop" | "printer" | "scanner" | "projector" | "tablet" | "monitor" | "network_device" | "peripheral" | "other";
type AssetStatus = "available" | "assigned" | "maintenance" | "disposed";
type MaintType = "repair" | "service" | "upgrade";

type MaintenanceRecord = {
  id: string;
  asset_id: string;
  date: string;
  type: MaintType;
  description: string;
  cost: number;
  vendor: string;
  next_due: string;
  created_at: string;
};

type ItAsset = {
  id: string;
  name: string;
  category: AssetCategory;
  brand: string;
  model: string;
  serial_no: string;
  asset_tag: string;
  purchase_date: string;
  warranty_months: number;
  location: string;
  status: AssetStatus;
  assigned_to_type?: "student" | "faculty" | "staff";
  assigned_to_name?: string;
  assigned_to_id?: string;
  assigned_at?: string;
  notes: string;
  created_at: string;
};

const ASSETS_KEY = "eduflow_it_assets";
const MAINT_KEY = "eduflow_it_maintenance";
const CATEGORIES: AssetCategory[] = ["desktop", "laptop", "printer", "scanner", "projector", "tablet", "monitor", "network_device", "peripheral", "other"];

function al(): ItAsset[] { try { return JSON.parse(localStorage.getItem(ASSETS_KEY) ?? "[]"); } catch { return []; } }
function as(v: ItAsset[]) { localStorage.setItem(ASSETS_KEY, JSON.stringify(v)); emitAppSync(ASSETS_KEY); }
function ml(): MaintenanceRecord[] { try { return JSON.parse(localStorage.getItem(MAINT_KEY) ?? "[]"); } catch { return []; } }
function ms(v: MaintenanceRecord[]) { localStorage.setItem(MAINT_KEY, JSON.stringify(v)); emitAppSync(MAINT_KEY); }

const CATEGORY_ICONS: Record<AssetCategory, string> = {
  desktop: "💻", laptop: "🖥️", printer: "🖨️", scanner: "📄", projector: "📽️",
  tablet: "📱", monitor: "🖥️", network_device: "🌐", peripheral: "🔌", other: "📦",
};

const STATUS_COLORS: Record<AssetStatus, string> = {
  available: "bg-success/15 text-success border-success/30",
  assigned: "bg-info/15 text-info border-info/30",
  maintenance: "bg-warning/15 text-warning border-warning/30",
  disposed: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function ItAssets() {
  const [assets, setAssets] = useState<ItAsset[]>(al);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(ml);
  const refresh = () => { setAssets(al()); setMaintenance(ml()); };
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "all">("all");
  const [catFilter, setCatFilter] = useState<AssetCategory | "all">("all");
  const [tab, setTab] = useState("assets");
  const [selAsset, setSelAsset] = useState<ItAsset | null>(null);

  useEffect(() => subscribeAppSync([ASSETS_KEY, MAINT_KEY], refresh), []);

  const filtered = assets.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (catFilter !== "all" && a.category !== catFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.serial_no.toLowerCase().includes(q) || a.asset_tag.toLowerCase().includes(q) || a.location.toLowerCase().includes(q) || a.assigned_to_name?.toLowerCase().includes(q);
  });

  const pag = usePagination({ data: filtered, pageSize: 10 });

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState(""); const [formCat, setFormCat] = useState<AssetCategory>("desktop"); const [formBrand, setFormBrand] = useState(""); const [formModel, setFormModel] = useState(""); const [formSerial, setFormSerial] = useState(""); const [formTag, setFormTag] = useState(""); const [formPurchase, setFormPurchase] = useState(""); const [formWarranty, setFormWarranty] = useState(""); const [formLoc, setFormLoc] = useState(""); const [formNotes, setFormNotes] = useState("");

  const [assignOpen, setAssignOpen] = useState(false); const [assignAsset, setAssignAsset] = useState<ItAsset | null>(null); const [assignType, setAssignType] = useState<"student" | "faculty" | "staff">("faculty"); const [assignName, setAssignName] = useState("");

  const [maintOpen, setMaintOpen] = useState(false); const [maintAsset, setMaintAsset] = useState<ItAsset | null>(null); const [maintDate, setMaintDate] = useState(""); const [maintType, setMaintType] = useState<MaintType>("service"); const [maintDesc, setMaintDesc] = useState(""); const [maintCost, setMaintCost] = useState(""); const [maintVendor, setMaintVendor] = useState(""); const [maintNext, setMaintNext] = useState("");

  function openAdd() {
    setEditId(null); setFormName(""); setFormCat("desktop"); setFormBrand(""); setFormModel(""); setFormSerial(""); setFormTag(""); setFormPurchase(""); setFormWarranty(""); setFormLoc(""); setFormNotes(""); setOpen(true);
  }
  function openEdit(a: ItAsset) {
    setEditId(a.id); setFormName(a.name); setFormCat(a.category); setFormBrand(a.brand); setFormModel(a.model); setFormSerial(a.serial_no); setFormTag(a.asset_tag); setFormPurchase(a.purchase_date); setFormWarranty(String(a.warranty_months)); setFormLoc(a.location); setFormNotes(a.notes); setOpen(true);
  }
  function save() {
    if (!formName.trim()) { toast.error("Name is required"); return; }
    const list = al();
    const now = new Date().toISOString();
    if (editId) {
      const idx = list.findIndex((a) => a.id === editId);
      if (idx >= 0) list[idx] = { ...list[idx], name: formName.trim(), category: formCat, brand: formBrand, model: formModel, serial_no: formSerial, asset_tag: formTag, purchase_date: formPurchase, warranty_months: parseInt(formWarranty) || 0, location: formLoc, notes: formNotes };
    } else {
      list.push({ id: generateId(), name: formName.trim(), category: formCat, brand: formBrand, model: formModel, serial_no: formSerial, asset_tag: formTag, purchase_date: formPurchase, warranty_months: parseInt(formWarranty) || 0, location: formLoc, notes: formNotes, status: "available", created_at: now });
    }
    as(list); refresh(); setOpen(false); toast.success(editId ? "Asset updated" : "Asset added");
  }

  function doAssign() {
    if (!assignAsset || !assignName.trim()) return;
    const list = al();
    const idx = list.findIndex((a) => a.id === assignAsset.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], status: "assigned", assigned_to_type: assignType, assigned_to_name: assignName.trim(), assigned_to_id: "", assigned_at: new Date().toISOString() };
      as(list); refresh(); toast.success(`Assigned to ${assignName}`);
    }
    setAssignOpen(false);
  }

  function doUnassign(a: ItAsset) {
    const list = al();
    const idx = list.findIndex((x) => x.id === a.id);
    if (idx >= 0) { list[idx] = { ...list[idx], status: "available", assigned_to_type: undefined, assigned_to_name: undefined, assigned_to_id: undefined, assigned_at: undefined }; as(list); refresh(); toast.success("Unassigned"); }
  }

  function doStatusChange(a: ItAsset, status: AssetStatus) {
    const list = al();
    const idx = list.findIndex((x) => x.id === a.id);
    if (idx >= 0) { list[idx] = { ...list[idx], status }; as(list); refresh(); toast.success(`Status: ${status}`); }
  }

  function doDelete(a: ItAsset) {
    if (!confirm(`Delete ${a.name}?`)) return;
    as(al().filter((x) => x.id !== a.id));
    ms(ml().filter((m) => m.asset_id !== a.id));
    refresh(); toast.success("Deleted");
  }

  function saveMaint() {
    if (!maintAsset || !maintDesc.trim()) return;
    ms([...ml(), { id: generateId(), asset_id: maintAsset.id, date: maintDate || new Date().toISOString().slice(0,10), type: maintType, description: maintDesc, cost: parseFloat(maintCost) || 0, vendor: maintVendor, next_due: maintNext, created_at: new Date().toISOString() }]);
    refresh(); setMaintOpen(false); toast.success("Maintenance record added");
  }

  const assetMaint = (id: string) => maintenance.filter((m) => m.asset_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div>
      <PageHeader title="IT Asset Management" subtitle="Hardware inventory, assignments & maintenance tracking" icon={<Monitor className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-5 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Assets</p><p className="text-2xl font-bold">{assets.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Available</p><p className="text-2xl font-bold text-success">{assets.filter((a) => a.status === "available").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Assigned</p><p className="text-2xl font-bold text-info">{assets.filter((a) => a.status === "assigned").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Maintenance</p><p className="text-2xl font-bold text-warning">{assets.filter((a) => a.status === "maintenance").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Disposed</p><p className="text-2xl font-bold text-destructive">{assets.filter((a) => a.status === "disposed").length}</p></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4"><TabsTrigger value="assets">Assets ({assets.length})</TabsTrigger><TabsTrigger value="maintenance">Maintenance Log ({maintenance.length})</TabsTrigger></TabsList>

        <TabsContent value="assets">
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, serial, tag, location..." className="flex-1 min-w-[200px] h-9 text-xs" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as AssetStatus | "all")}>
              <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="available">Available</SelectItem><SelectItem value="assigned">Assigned</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="disposed">Disposed</SelectItem></SelectContent>
            </Select>
            <Select value={catFilter} onValueChange={(v) => setCatFilter(v as AssetCategory | "all")}>
              <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}<SelectItem value="all">All Categories</SelectItem></SelectContent>
            </Select>
            <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Asset</Button>
          </div>

          <TablePagination {...pag} />
          <Table>
            <TableHeader><TableRow><TableHead className="text-xs">Asset</TableHead><TableHead className="text-xs">Category</TableHead><TableHead className="text-xs">S/N</TableHead><TableHead className="text-xs">Tag</TableHead><TableHead className="text-xs">Location</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Assigned To</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {pag.pageData.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs font-medium">{CATEGORY_ICONS[a.category]} {a.name}</TableCell>
                  <TableCell className="text-xs capitalize">{a.category.replace("_", " ")}</TableCell>
                  <TableCell className="text-xs font-mono">{a.serial_no || "—"}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{a.asset_tag || "—"}</TableCell>
                  <TableCell className="text-xs">{a.location || "—"}</TableCell>
                  <TableCell><Badge className={`text-[9px] ${STATUS_COLORS[a.status]}`}>{a.status}</Badge></TableCell>
                  <TableCell className="text-xs">{a.assigned_to_name ? <span>{a.assigned_to_name} <span className="text-muted-foreground">({a.assigned_to_type})</span></span> : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="rounded-lg h-7 px-2 text-[10px]" onClick={() => openEdit(a)}><Wrench className="h-3 w-3 mr-1" />Edit</Button>
                      {a.status === "available" && <Button variant="outline" size="sm" className="rounded-lg h-7 px-2 text-[10px]" onClick={() => { setAssignAsset(a); setAssignType("faculty"); setAssignName(""); setAssignOpen(true); }}><UserCheck className="h-3 w-3 mr-1" />Assign</Button>}
                      {a.status === "assigned" && <Button variant="outline" size="sm" className="rounded-lg h-7 px-2 text-[10px]" onClick={() => doUnassign(a)}>Unassign</Button>}
                      {a.status !== "disposed" && <Button variant="outline" size="sm" className="rounded-lg h-7 px-2 text-[10px]" onClick={() => doStatusChange(a, "maintenance")}>Maint</Button>}
                      <Button variant="outline" size="sm" className="rounded-lg h-7 px-2 text-[10px]" onClick={() => { setMaintAsset(a); setMaintDate(new Date().toISOString().slice(0, 10)); setMaintType("service"); setMaintDesc(""); setMaintCost(""); setMaintVendor(""); setMaintNext(""); setMaintOpen(true); }}><History className="h-3 w-3 mr-1" />Log</Button>
                      <Button variant="outline" size="sm" className="rounded-lg h-7 px-2 text-[10px] text-destructive" onClick={() => doDelete(a)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">{search || statusFilter !== "all" || catFilter !== "all" ? "No matching assets" : "No assets. Click 'Add Asset' to begin."}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="maintenance">
          <Table>
            <TableHeader><TableRow><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Asset</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Description</TableHead><TableHead className="text-xs">Cost</TableHead><TableHead className="text-xs">Vendor</TableHead><TableHead className="text-xs">Next Due</TableHead></TableRow></TableHeader>
            <TableBody>
              {[...maintenance].sort((a, b) => b.date.localeCompare(a.date)).map((m) => {
                const asset = assets.find((a) => a.id === m.asset_id);
                return (<TableRow key={m.id}>
                  <TableCell className="text-xs">{m.date}</TableCell>
                  <TableCell className="text-xs font-medium">{asset?.name ?? "Unknown"}</TableCell>
                  <TableCell><Badge className={`text-[9px] ${m.type === "repair" ? "bg-destructive/15 text-destructive" : m.type === "upgrade" ? "bg-info/15 text-info" : "bg-warning/15 text-warning"}`}>{m.type}</Badge></TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{m.description}</TableCell>
                  <TableCell className="text-xs">{m.cost ? `₹${m.cost}` : "—"}</TableCell>
                  <TableCell className="text-xs">{m.vendor || "—"}</TableCell>
                  <TableCell className="text-xs">{m.next_due || "—"}</TableCell>
                </TableRow>);
              })}
              {maintenance.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">No maintenance records</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit Asset" : "Add Asset"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Asset Name</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Dell Optiplex 7090" /></div><div><Label className="text-xs">Category</Label><Select value={formCat} onValueChange={(v) => setFormCat(v as AssetCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Brand</Label><Input value={formBrand} onChange={(e) => setFormBrand(e.target.value)} placeholder="e.g. Dell" /></div><div><Label className="text-xs">Model</Label><Input value={formModel} onChange={(e) => setFormModel(e.target.value)} placeholder="e.g. Optiplex 7090" /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Serial No</Label><Input value={formSerial} onChange={(e) => setFormSerial(e.target.value)} /></div><div><Label className="text-xs">Asset Tag</Label><Input value={formTag} onChange={(e) => setFormTag(e.target.value)} placeholder="Auto-generated if blank" /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Purchase Date</Label><Input type="date" value={formPurchase} onChange={(e) => setFormPurchase(e.target.value)} /></div><div><Label className="text-xs">Warranty (months)</Label><Input type="number" value={formWarranty} onChange={(e) => setFormWarranty(e.target.value)} /></div></div>
            <div><Label className="text-xs">Location / Lab / Department</Label><Input value={formLoc} onChange={(e) => setFormLoc(e.target.value)} placeholder="e.g. Computer Lab A / Admin Office" /></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button className="bg-gradient-primary shadow-glow" onClick={save}>{editId ? "Update" : "Add"} Asset</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Assign Asset</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Assigning: <strong>{assignAsset?.name}</strong></p>
            <div><Label className="text-xs">Assign To</Label><Select value={assignType} onValueChange={(v) => setAssignType(v as "student" | "faculty" | "staff")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="faculty">Faculty</SelectItem><SelectItem value="staff">Staff</SelectItem><SelectItem value="student">Student</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Name</Label><Input value={assignName} onChange={(e) => setAssignName(e.target.value)} placeholder="Enter name" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button><Button className="bg-gradient-primary shadow-glow" onClick={doAssign}>Assign</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={maintOpen} onOpenChange={setMaintOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Log Maintenance</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Asset: <strong>{maintAsset?.name}</strong></p>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Date</Label><Input type="date" value={maintDate} onChange={(e) => setMaintDate(e.target.value)} /></div><div><Label className="text-xs">Type</Label><Select value={maintType} onValueChange={(v) => setMaintType(v as MaintType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="repair">Repair</SelectItem><SelectItem value="service">Service</SelectItem><SelectItem value="upgrade">Upgrade</SelectItem></SelectContent></Select></div></div>
            <div><Label className="text-xs">Description</Label><Textarea value={maintDesc} onChange={(e) => setMaintDesc(e.target.value)} rows={2} placeholder="Describe the issue / work done" /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Cost (₹)</Label><Input type="number" value={maintCost} onChange={(e) => setMaintCost(e.target.value)} /></div><div><Label className="text-xs">Vendor</Label><Input value={maintVendor} onChange={(e) => setMaintVendor(e.target.value)} /></div></div>
            <div><Label className="text-xs">Next Due Date</Label><Input type="date" value={maintNext} onChange={(e) => setMaintNext(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setMaintOpen(false)}>Cancel</Button><Button className="bg-gradient-primary shadow-glow" onClick={saveMaint}>Save Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
