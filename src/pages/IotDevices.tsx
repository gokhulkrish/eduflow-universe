import "@/lib/runtime-storage";
import { useCallback, useEffect, useState } from "react";
import { Cpu, Plus, Radio, Thermometer, Activity, Zap, AlertTriangle, Trash2, Download, Upload } from "lucide-react";
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
import { getIotDevices, createIotDevice, updateIotDevice, deleteIotDevice, getIotReadings, createIotReading, deleteReadingsByDevice, getRfidLogs, createRfidLog, IotDevice, IotReading, RfidLog } from "@/lib/iot-devices";

const DEVICE_TYPES: IotDeviceType[] = ["sensor", "rfid_reader", "smart_board", "camera", "beacon", "gateway", "other"];
const STATUS_COLORS: Record<IotDeviceStatus, string> = { active: "bg-success/15 text-success", inactive: "bg-muted text-muted-foreground", error: "bg-destructive/15 text-destructive" };
const TYPE_ICONS: Record<IotDeviceType, string> = { sensor: "📡", rfid_reader: "📋", smart_board: "🖥️", camera: "📷", beacon: "🔵", gateway: "🌐", other: "📦" };

export default function IotDevices() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [readings, setReadings] = useState<IotReading[]>([]);
  const [rfidLogs, setRfidLogs] = useState<RfidLog[]>([]);
  const refresh = useCallback(async () => { setDevices(await getIotDevices()); setReadings(await getIotReadings()); setRfidLogs(await getRfidLogs()); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useRealtime("iot_devices", refresh);
  useRealtime("iot_readings", refresh);
  useRealtime("iot_rfid_logs", refresh);
  const [tab, setTab] = useState("devices");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = devices.filter((d) => {
    if (typeFilter !== "all" && d.type !== typeFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.location.toLowerCase().includes(q) || d.serial_no.toLowerCase().includes(q);
  });
  const pag = usePagination({ data: filtered, pageSize: 8 });

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState(""); const [formType, setFormType] = useState<IotDeviceType>("sensor"); const [formModel, setFormModel] = useState(""); const [formSerial, setFormSerial] = useState(""); const [formLoc, setFormLoc] = useState(""); const [formFW, setFormFW] = useState(""); const [formBatt, setFormBatt] = useState(""); const [formIP, setFormIP] = useState(""); const [formNotes, setFormNotes] = useState("");

  const [readingOpen, setReadingOpen] = useState(false); const [readingDevice, setReadingDevice] = useState(""); const [readingMetric, setReadingMetric] = useState(""); const [readingVal, setReadingVal] = useState(""); const [readingUnit, setReadingUnit] = useState("");

  const [rfidOpen, setRfidOpen] = useState(false); const [rfidReader, setRfidReader] = useState(""); const [rfidTag, setRfidTag] = useState(""); const [rfidStudent, setRfidStudent] = useState(""); const [rfidDirection, setRfidDirection] = useState<"in" | "out">("in");

  function openAdd() { setEditId(null); setFormName(""); setFormType("sensor"); setFormModel(""); setFormSerial(""); setFormLoc(""); setFormFW(""); setFormBatt(""); setFormIP(""); setFormNotes(""); setOpen(true); }
  function openEdit(d: IotDevice) { setEditId(d.id); setFormName(d.name); setFormType(d.type); setFormModel(d.model); setFormSerial(d.serial_no); setFormLoc(d.location); setFormFW(d.firmware); setFormBatt(String(d.battery_level)); setFormIP(d.ip_address); setFormNotes(d.notes); setOpen(true); }

  async function save() {
    if (!formName.trim()) { toast.error("Device name required"); return; }
    const data = { name: formName.trim(), type: formType, model: formModel, serial_no: formSerial, location: formLoc, firmware: formFW, battery_level: parseInt(formBatt) || 0, ip_address: formIP, notes: formNotes };
    if (editId) {
      await updateIotDevice(editId, data);
    } else {
      await createIotDevice({ ...data, status: "active", last_seen: new Date().toISOString() });
    }
    refresh(); setOpen(false); toast.success(editId ? "Device updated" : "Device added");
  }

  async function toggleStatus(d: IotDevice) {
    const next = d.status === "active" ? "inactive" : d.status === "inactive" ? "error" : "active";
    await updateIotDevice(d.id, { status: next, last_seen: new Date().toISOString() });
    refresh(); toast.success(`Device ${next}`);
  }

  async function doDelete(id: string) {
    await deleteIotDevice(id);
    await deleteReadingsByDevice(id);
    refresh(); toast.success("Deleted");
  }

  async function saveReading() {
    if (!readingDevice || !readingMetric.trim() || !readingVal) { toast.error("Fill required fields"); return; }
    await createIotReading({ device_id: readingDevice, metric: readingMetric.trim(), value: parseFloat(readingVal) || 0, unit: readingUnit });
    await updateIotDevice(readingDevice, { last_seen: new Date().toISOString() });
    refresh(); setReadingOpen(false); toast.success("Reading recorded");
  }

  async function saveRfid() {
    if (!rfidReader || !rfidTag.trim() || !rfidStudent.trim()) { toast.error("Fill required fields"); return; }
    const reader = devices.find((d) => d.id === rfidReader);
    await createRfidLog({ reader_id: rfidReader, reader_name: reader?.name ?? "", tag_id: rfidTag.trim(), student_name: rfidStudent.trim(), student_id: "", timestamp: new Date().toISOString(), direction: rfidDirection });
    refresh(); setRfidOpen(false); toast.success(`RFID ${rfidDirection} logged`);
  }

  const deviceReadings = (id: string) => readings.filter((r) => r.device_id === id).sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)).slice(0, 5);
  const latestReading = (id: string) => {
    const devReadings = readings.filter((r) => r.device_id === id).sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
    return devReadings.length > 0 ? devReadings[0] : null;
  };

  const activeDevices = devices.filter((d) => d.status === "active").length;
  const errorDevices = devices.filter((d) => d.status === "error").length;
  const lowBattery = devices.filter((d) => d.battery_level < 20 && d.status === "active").length;
  const recentReadings = readings.filter((r) => new Date(r.recorded_at).getTime() > Date.now() - 3600000).length;

  return (
    <div>
      <PageHeader title="IoT Devices & Smart Campus" subtitle="Sensor telemetry, RFID attendance bridge & device registry" icon={<Cpu className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-5 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Devices</p><p className="text-2xl font-bold">{devices.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Active</p><p className="text-2xl font-bold text-success">{activeDevices}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Errors</p><p className="text-2xl font-bold text-destructive">{errorDevices}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Low Battery</p><p className="text-2xl font-bold text-warning">{lowBattery}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Readings (1h)</p><p className="text-2xl font-bold text-info">{recentReadings}</p></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="devices">Devices ({devices.length})</TabsTrigger>
          <TabsTrigger value="telemetry">Telemetry ({readings.length})</TabsTrigger>
          <TabsTrigger value="rfid">RFID Log ({rfidLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="devices">
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, location, serial..." className="flex-1 min-w-[200px] h-9 text-xs" />
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as IotDeviceType | "all")}>
              <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>{DEVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}<SelectItem value="all">All Types</SelectItem></SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/import?module=iot-devices")}><Upload className="h-4 w-4 mr-1" /> Import</Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportToCsv(filtered, "iot-devices", [{key:"name",label:"Device"},{key:"type",label:"Type"},{key:"serial_no",label:"Serial"},{key:"location",label:"Location"},{key:"status",label:"Status"},{key:"battery_level",label:"Battery %"}])}><Download className="h-4 w-4 mr-1" /> Export</Button>
            <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Device</Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setReadingDevice(""); setReadingMetric(""); setReadingVal(""); setReadingUnit(""); setReadingOpen(true); }}><Activity className="h-4 w-4 mr-1" /> Log Reading</Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => { setRfidReader(""); setRfidTag(""); setRfidStudent(""); setRfidDirection("in"); setRfidOpen(true); }}><Radio className="h-4 w-4 mr-1" /> RFID Scan</Button>
          </div>
          <TablePagination {...pag} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pag.pageData.map((d) => {
              const lr = latestReading(d.id);
              return (<Card key={d.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div><span className="text-lg">{TYPE_ICONS[d.type]}</span><p className="text-sm font-medium mt-1">{d.name}</p></div>
                  <Badge className={`text-[9px] border ${STATUS_COLORS[d.status]}`}>{d.status}</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground space-y-1 mb-3">
                  <p>{d.type.replace("_", " ")} · {d.location || "—"}</p>
                  <p>Firmware: {d.firmware || "—"} · Batt: {d.battery_level}%</p>
                  {d.last_seen && <p>Last seen: {new Date(d.last_seen).toLocaleString()}</p>}
                  {lr && <p className="text-info font-medium">{lr.metric}: {lr.value}{lr.unit}</p>}
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Button variant="outline" size="sm" className="rounded-lg h-6 px-2 text-[9px]" onClick={() => openEdit(d)}>Edit</Button>
                  <Button variant="outline" size="sm" className="rounded-lg h-6 px-2 text-[9px]" onClick={() => toggleStatus(d)}>Toggle</Button>
                  <Button variant="outline" size="sm" className="rounded-lg h-6 px-2 text-[9px]" onClick={() => { setReadingDevice(d.id); setReadingMetric(""); setReadingVal(""); setReadingUnit(""); setReadingOpen(true); }}><Activity className="h-3 w-3 mr-1" />Reading</Button>
                  <Button variant="outline" size="sm" className="rounded-lg h-6 px-2 text-[9px] text-destructive" onClick={() => setDeleteId(d.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </Card>);
            })}
            {filtered.length === 0 && <div className="col-span-full text-center text-xs text-muted-foreground py-12">{search || typeFilter !== "all" ? "No matching devices" : "No IoT devices. Click 'Add Device' to begin."}</div>}
          </div>
        </TabsContent>

        <TabsContent value="telemetry">
          <Table>
            <TableHeader><TableRow><TableHead className="text-xs">Time</TableHead><TableHead className="text-xs">Device</TableHead><TableHead className="text-xs">Metric</TableHead><TableHead className="text-xs">Value</TableHead></TableRow></TableHeader>
            <TableBody>
              {[...readings].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)).slice(0, 100).map((r) => {
                const dev = devices.find((d) => d.id === r.device_id);
                return (<TableRow key={r.id}>
                  <TableCell className="text-xs">{new Date(r.recorded_at).toLocaleString()}</TableCell>
                  <TableCell className="text-xs font-medium">{dev?.name ?? "Unknown"}</TableCell>
                  <TableCell className="text-xs">{r.metric}</TableCell>
                  <TableCell className="text-xs font-bold">{r.value}{r.unit}</TableCell>
                </TableRow>);
              })}
              {readings.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">No telemetry data</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="rfid">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs text-muted-foreground">{rfidLogs.length} RFID events logged</p>
            <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setRfidReader(""); setRfidTag(""); setRfidStudent(""); setRfidDirection("in"); setRfidOpen(true); }}><Radio className="h-4 w-4 mr-1" /> New Scan</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead className="text-xs">Timestamp</TableHead><TableHead className="text-xs">Reader</TableHead><TableHead className="text-xs">Tag ID</TableHead><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Direction</TableHead></TableRow></TableHeader>
            <TableBody>
              {[...rfidLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{new Date(r.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{r.reader_name}</TableCell>
                  <TableCell className="text-xs font-mono">{r.tag_id}</TableCell>
                  <TableCell className="text-xs">{r.student_name}</TableCell>
                  <TableCell><Badge className={`text-[9px] ${r.direction === "in" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{r.direction === "in" ? "IN" : "OUT"}</Badge></TableCell>
                </TableRow>
              ))}
              {rfidLogs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No RFID scans recorded</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Device</AlertDialogTitle><AlertDialogDescription>This will permanently remove this IoT device. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (deleteId) { await doDelete(deleteId); } setDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit IoT Device" : "Add IoT Device"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Device Name</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Lab-01 Temp Sensor" /></div><div><Label className="text-xs">Type</Label><Select value={formType} onValueChange={(v) => setFormType(v as IotDeviceType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DEVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Model</Label><Input value={formModel} onChange={(e) => setFormModel(e.target.value)} /></div><div><Label className="text-xs">Serial No</Label><Input value={formSerial} onChange={(e) => setFormSerial(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Location</Label><Input value={formLoc} onChange={(e) => setFormLoc(e.target.value)} placeholder="e.g. Lab A / Main Gate" /></div><div><Label className="text-xs">Firmware Version</Label><Input value={formFW} onChange={(e) => setFormFW(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Battery Level (%)</Label><Input type="number" value={formBatt} onChange={(e) => setFormBatt(e.target.value)} /></div><div><Label className="text-xs">IP Address</Label><Input value={formIP} onChange={(e) => setFormIP(e.target.value)} /></div></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button className="bg-gradient-primary shadow-glow" onClick={save}>{editId ? "Update" : "Add"} Device</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={readingOpen} onOpenChange={setReadingOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Log Telemetry Reading</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Device</Label><Select value={readingDevice} onValueChange={setReadingDevice}><SelectTrigger><SelectValue placeholder="Select device" /></SelectTrigger><SelectContent>{devices.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Metric</Label><Input value={readingMetric} onChange={(e) => setReadingMetric(e.target.value)} placeholder="e.g. temperature, humidity" /></div><div><Label className="text-xs">Value</Label><Input type="number" step="any" value={readingVal} onChange={(e) => setReadingVal(e.target.value)} /></div></div>
            <div><Label className="text-xs">Unit</Label><Input value={readingUnit} onChange={(e) => setReadingUnit(e.target.value)} placeholder="e.g. °C, %, ppm" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setReadingOpen(false)}>Cancel</Button><Button className="bg-gradient-primary shadow-glow" onClick={saveReading}>Save Reading</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rfidOpen} onOpenChange={setRfidOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>RFID Scan Log</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">RFID Reader</Label><Select value={rfidReader} onValueChange={setRfidReader}><SelectTrigger><SelectValue placeholder="Select reader" /></SelectTrigger><SelectContent>{devices.filter((d) => d.type === "rfid_reader" || d.type === "gateway").map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Tag / Card ID</Label><Input value={rfidTag} onChange={(e) => setRfidTag(e.target.value)} placeholder="Scan tag number" /></div>
            <div><Label className="text-xs">Student Name</Label><Input value={rfidStudent} onChange={(e) => setRfidStudent(e.target.value)} /></div>
            <div><Label className="text-xs">Direction</Label><Select value={rfidDirection} onValueChange={(v) => setRfidDirection(v as "in" | "out")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="in">IN (Entry)</SelectItem><SelectItem value="out">OUT (Exit)</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRfidOpen(false)}>Cancel</Button><Button className="bg-gradient-primary shadow-glow" onClick={saveRfid}>Log Scan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
