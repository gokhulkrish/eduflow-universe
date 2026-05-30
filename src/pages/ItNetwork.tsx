import "@/lib/runtime-storage";
import { useCallback, useEffect, useState } from "react";
import { Network, Plus, Wifi, Server, Activity, Radio, Trash2, Download, Upload } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { useRealtime } from "@/lib/use-realtime";
import { getNetworkDevices, createNetworkDevice, updateNetworkDevice, deleteNetworkDevice, getIpAllocations, createIpAllocation, ItNetworkDevice, IpAllocation } from "@/lib/it-network";

const DEVICE_TYPES: NetDeviceType[] = ["router", "switch", "access_point", "firewall", "server", "modem", "other"];
const STATUS_COLORS: Record<NetDeviceStatus, string> = { online: "bg-success/15 text-success", offline: "bg-destructive/15 text-destructive", maintenance: "bg-warning/15 text-warning" };
const TYPE_ICONS: Record<NetDeviceType, string> = { router: "🌐", switch: "🔀", access_point: "📡", firewall: "🛡️", server: "🖥️", modem: "📞", other: "🔌" };

export default function ItNetwork() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<ItNetworkDevice[]>([]);
  const [allocations, setAllocations] = useState<IpAllocation[]>([]);
  const refresh = useCallback(async () => { setDevices(await getNetworkDevices()); setAllocations(await getIpAllocations()); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useRealtime("it_network_devices", refresh);
  useRealtime("it_ip_allocations", refresh);
  const [tab, setTab] = useState("devices");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = devices.filter((d) => {
    if (typeFilter !== "all" && d.type !== typeFilter) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.ip_address.toLowerCase().includes(q) || d.location.toLowerCase().includes(q) || d.brand.toLowerCase().includes(q);
  });
  const pag = usePagination({ data: filtered, pageSize: 10 });

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState(""); const [formType, setFormType] = useState<NetDeviceType>("switch"); const [formBrand, setFormBrand] = useState(""); const [formModel, setFormModel] = useState(""); const [formIP, setFormIP] = useState(""); const [formMAC, setFormMAC] = useState(""); const [formLoc, setFormLoc] = useState(""); const [formFW, setFormFW] = useState(""); const [formPurch, setFormPurch] = useState(""); const [formUplink, setFormUplink] = useState(""); const [formNotes, setFormNotes] = useState("");

  const [ipOpen, setIpOpen] = useState(false); const [ipAddr, setIpAddr] = useState(""); const [ipDevice, setIpDevice] = useState(""); const [ipTypeDNS, setIpTypeDNS] = useState(""); const [ipLoc, setIpLoc] = useState(""); const [ipAssign, setIpAssign] = useState(""); const [ipNotes, setIpNotes] = useState("");

  function openAdd() { setEditId(null); setFormName(""); setFormType("switch"); setFormBrand(""); setFormModel(""); setFormIP(""); setFormMAC(""); setFormLoc(""); setFormFW(""); setFormPurch(""); setFormUplink(""); setFormNotes(""); setOpen(true); }
  function openEdit(d: ItNetworkDevice) { setEditId(d.id); setFormName(d.name); setFormType(d.type); setFormBrand(d.brand); setFormModel(d.model); setFormIP(d.ip_address); setFormMAC(d.mac_address); setFormLoc(d.location); setFormFW(d.firmware_version); setFormPurch(d.purchase_date); setFormUplink(d.uplink); setFormNotes(d.notes); setOpen(true); }

  async function save() {
    if (!formName.trim()) { toast.error("Device name is required"); return; }
    const data = { name: formName.trim(), type: formType, brand: formBrand, model: formModel, ip_address: formIP, mac_address: formMAC, location: formLoc, firmware_version: formFW, purchase_date: formPurch, uplink: formUplink, notes: formNotes };
    if (editId) {
      await updateNetworkDevice(editId, data);
    } else {
      await createNetworkDevice({ ...data, status: "online" });
    }
    refresh(); setOpen(false); toast.success(editId ? "Device updated" : "Device added");
  }

  async function toggleStatus(d: ItNetworkDevice) {
    const next = d.status === "online" ? "offline" : d.status === "offline" ? "maintenance" : "online";
    await updateNetworkDevice(d.id, { status: next });
    refresh(); toast.success(`Device ${next}`);
  }

  async function doDelete(id: string) {
    await deleteNetworkDevice(id);
    refresh(); toast.success("Deleted");
  }

  async function saveIpAllocation() {
    if (!ipAddr.trim()) { toast.error("IP address required"); return; }
    await createIpAllocation({ ip_address: ipAddr.trim(), device_name: ipDevice, device_type: ipTypeDNS, location: ipLoc, assigned_to: ipAssign, notes: ipNotes });
    refresh(); setIpOpen(false); toast.success("IP allocation recorded");
  }

  const onlineCount = devices.filter((d) => d.status === "online").length;
  const offlineCount = devices.filter((d) => d.status === "offline").length;
  const maintCount = devices.filter((d) => d.status === "maintenance").length;

  return (
    <div>
      <PageHeader title="Network & Infrastructure" subtitle="Network device inventory, IPAM & topology tracking" icon={<Network className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-5 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Devices</p><p className="text-2xl font-bold">{devices.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Online</p><p className="text-2xl font-bold text-success">{onlineCount}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Offline</p><p className="text-2xl font-bold text-destructive">{offlineCount}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Maintenance</p><p className="text-2xl font-bold text-warning">{maintCount}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">IP Allocations</p><p className="text-2xl font-bold text-info">{allocations.length}</p></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4"><TabsTrigger value="devices">Devices ({devices.length})</TabsTrigger><TabsTrigger value="ipam">IPAM ({allocations.length})</TabsTrigger></TabsList>

        <TabsContent value="devices">
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, IP, location..." className="flex-1 min-w-[200px] h-9 text-xs" />
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as NetDeviceType | "all")}>
              <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>{DEVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}<SelectItem value="all">All Types</SelectItem></SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as NetDeviceStatus | "all")}>
              <SelectTrigger className="w-[130px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="online">Online</SelectItem><SelectItem value="offline">Offline</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem></SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/import?module=it-network")}><Upload className="h-4 w-4 mr-1" /> Import</Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportToCsv(filtered, "network-devices", [{key:"name",label:"Device"},{key:"type",label:"Type"},{key:"ip_address",label:"IP Address"},{key:"mac_address",label:"MAC"},{key:"location",label:"Location"},{key:"status",label:"Status"},{key:"firmware_version",label:"Firmware"}])}><Download className="h-4 w-4 mr-1" /> Export</Button>
            <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Device</Button>
          </div>
          <TablePagination {...pag} />
          <Table>
            <TableHeader><TableRow><TableHead className="text-xs">Device</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">IP Address</TableHead><TableHead className="text-xs">MAC Address</TableHead><TableHead className="text-xs">Location</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Firmware</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {pag.pageData.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-xs font-medium">{TYPE_ICONS[d.type]} {d.name}</TableCell>
                  <TableCell className="text-xs capitalize">{d.type.replace("_", " ")}</TableCell>
                  <TableCell className="text-xs font-mono text-info">{d.ip_address || "—"}</TableCell>
                  <TableCell className="text-xs font-mono text-[10px]">{d.mac_address || "—"}</TableCell>
                  <TableCell className="text-xs">{d.location || "—"}</TableCell>
                  <TableCell><Badge className={`text-[9px] border ${STATUS_COLORS[d.status]}`}><Activity className="h-3 w-3 mr-1" />{d.status}</Badge></TableCell>
                  <TableCell className="text-xs font-mono">{d.firmware_version || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="rounded-lg h-7 px-2 text-[10px]" onClick={() => openEdit(d)}>Edit</Button>
                      <Button variant="outline" size="sm" className="rounded-lg h-7 px-2 text-[10px]" onClick={() => toggleStatus(d)}>Toggle</Button>
                      <Button variant="outline" size="sm" className="rounded-lg h-7 px-2 text-[10px] text-destructive" onClick={() => setDeleteId(d.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">{search || typeFilter !== "all" || statusFilter !== "all" ? "No matching devices" : "No devices. Click 'Add Device' to begin."}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="ipam">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs text-muted-foreground">{allocations.length} IP addresses allocated</p>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/import?module=it-network")}><Upload className="h-4 w-4 mr-1" /> Import</Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportToCsv(allocations, "ip-allocations", [{key:"ip_address",label:"IP Address"},{key:"device_name",label:"Device"},{key:"device_type",label:"Type"},{key:"location",label:"Location"},{key:"assigned_to",label:"Assigned To"}])}><Download className="h-4 w-4 mr-1" /> Export</Button>
            <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setIpAddr(""); setIpDevice(""); setIpTypeDNS(""); setIpLoc(""); setIpAssign(""); setIpNotes(""); setIpOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add IP</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead className="text-xs">IP Address</TableHead><TableHead className="text-xs">Device</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Location</TableHead><TableHead className="text-xs">Assigned To</TableHead><TableHead className="text-xs">Notes</TableHead></TableRow></TableHeader>
            <TableBody>
              {[...allocations].sort((a, b) => a.ip_address.localeCompare(b.ip_address, undefined, { numeric: true })).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs font-mono font-medium text-info">{a.ip_address}</TableCell>
                  <TableCell className="text-xs">{a.device_name || "—"}</TableCell>
                  <TableCell className="text-xs">{a.device_type || "—"}</TableCell>
                  <TableCell className="text-xs">{a.location || "—"}</TableCell>
                  <TableCell className="text-xs">{a.assigned_to || "—"}</TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate text-muted-foreground">{a.notes || "—"}</TableCell>
                </TableRow>
              ))}
              {allocations.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No IP allocations recorded</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Device</AlertDialogTitle><AlertDialogDescription>This will permanently remove this network device. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (deleteId) { await doDelete(deleteId); } setDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit Network Device" : "Add Network Device"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Device Name</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Core-Switch-01" /></div><div><Label className="text-xs">Type</Label><Select value={formType} onValueChange={(v) => setFormType(v as NetDeviceType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DEVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Brand</Label><Input value={formBrand} onChange={(e) => setFormBrand(e.target.value)} placeholder="e.g. Cisco, TP-Link" /></div><div><Label className="text-xs">Model</Label><Input value={formModel} onChange={(e) => setFormModel(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">IP Address</Label><Input value={formIP} onChange={(e) => setFormIP(e.target.value)} placeholder="e.g. 192.168.1.1" /></div><div><Label className="text-xs">MAC Address</Label><Input value={formMAC} onChange={(e) => setFormMAC(e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Location</Label><Input value={formLoc} onChange={(e) => setFormLoc(e.target.value)} placeholder="e.g. Server Room" /></div><div><Label className="text-xs">Firmware Version</Label><Input value={formFW} onChange={(e) => setFormFW(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Purchase Date</Label><Input type="date" value={formPurch} onChange={(e) => setFormPurch(e.target.value)} /></div><div><Label className="text-xs">Uplink To</Label><Input value={formUplink} onChange={(e) => setFormUplink(e.target.value)} placeholder="Parent device name" /></div></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button className="bg-gradient-primary shadow-glow" onClick={save}>{editId ? "Update" : "Add"} Device</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ipOpen} onOpenChange={setIpOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Record IP Allocation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">IP Address</Label><Input value={ipAddr} onChange={(e) => setIpAddr(e.target.value)} placeholder="e.g. 192.168.1.100" /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Device Name</Label><Input value={ipDevice} onChange={(e) => setIpDevice(e.target.value)} /></div><div><Label className="text-xs">Type</Label><Input value={ipTypeDNS} onChange={(e) => setIpTypeDNS(e.target.value)} placeholder="e.g. Desktop, Printer" /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Location</Label><Input value={ipLoc} onChange={(e) => setIpLoc(e.target.value)} /></div><div><Label className="text-xs">Assigned To</Label><Input value={ipAssign} onChange={(e) => setIpAssign(e.target.value)} /></div></div>
            <div><Label className="text-xs">Notes</Label><Input value={ipNotes} onChange={(e) => setIpNotes(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIpOpen(false)}>Cancel</Button><Button className="bg-gradient-primary shadow-glow" onClick={saveIpAllocation}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
