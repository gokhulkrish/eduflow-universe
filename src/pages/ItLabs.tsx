import "@/lib/runtime-storage";
import { useCallback, useEffect, useState } from "react";
import { Monitor, Plus, Calendar, Clock, CheckCircle2, XCircle, Download, Upload } from "lucide-react";
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
import { getLabs, createLab, updateLab, deleteLab, getBookings, createBooking, updateBooking, deleteBookingsByLab, ItLab, ItLabBooking } from "@/lib/it-labs";
type LabStatus = "active" | "inactive" | "maintenance";
type BookingStatus = "pending" | "approved" | "cancelled" | "completed";

const LAB_STATUS_COLORS: Record<LabStatus, string> = { active: "bg-success/15 text-success", inactive: "bg-muted text-muted-foreground", maintenance: "bg-warning/15 text-warning" };
const BOOKING_STATUS_COLORS: Record<BookingStatus, string> = { pending: "bg-warning/15 text-warning", approved: "bg-success/15 text-success", cancelled: "bg-destructive/15 text-destructive", completed: "bg-info/15 text-info" };

export default function ItLabs() {
  const navigate = useNavigate();
  const [labs, setLabs] = useState<ItLab[]>([]);
  const [bookings, setBookings] = useState<ItLabBooking[]>([]);
  const refresh = useCallback(async () => { setLabs(await getLabs()); setBookings(await getBookings()); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useRealtime("it_labs", refresh);
  useRealtime("it_lab_bookings", refresh);
  const [tab, setTab] = useState("labs");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredLabs = labs.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.location.toLowerCase().includes(q) || l.incharge.toLowerCase().includes(q);
  });
  const pag = usePagination({ data: filteredLabs, pageSize: 10 });

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState(""); const [formLoc, setFormLoc] = useState(""); const [formCap, setFormCap] = useState(""); const [formSys, setFormSys] = useState(""); const [formIncharge, setFormIncharge] = useState(""); const [formEquip, setFormEquip] = useState("");

  const [bookOpen, setBookOpen] = useState(false); const [bookLab, setBookLab] = useState<string>(""); const [bookDate, setBookDate] = useState(""); const [bookStart, setBookStart] = useState(""); const [bookEnd, setBookEnd] = useState(""); const [bookFaculty, setBookFaculty] = useState(""); const [bookPurpose, setBookPurpose] = useState(""); const [bookBatch, setBookBatch] = useState("");

  function openAdd() { setEditId(null); setFormName(""); setFormLoc(""); setFormCap(""); setFormSys(""); setFormIncharge(""); setFormEquip(""); setOpen(true); }
  function openEdit(l: ItLab) { setEditId(l.id); setFormName(l.name); setFormLoc(l.location); setFormCap(String(l.capacity)); setFormSys(String(l.systems_count)); setFormIncharge(l.incharge); setFormEquip(l.equipment); setOpen(true); }

  async function save() {
    if (!formName.trim()) { toast.error("Lab name is required"); return; }
    const data = { name: formName.trim(), location: formLoc, capacity: parseInt(formCap) || 0, systems_count: parseInt(formSys) || 0, incharge: formIncharge, equipment: formEquip };
    if (editId) {
      await updateLab(editId, data);
    } else {
      await createLab({ ...data, status: "active" });
    }
    refresh(); setOpen(false); toast.success(editId ? "Lab updated" : "Lab added");
  }

  async function toggleLabStatus(l: ItLab) {
    const next = l.status === "active" ? "maintenance" : l.status === "maintenance" ? "inactive" : "active";
    await updateLab(l.id, { status: next });
    refresh(); toast.success(`Lab ${next}`);
  }

  async function doDeleteLab(id: string) {
    await deleteLab(id);
    await deleteBookingsByLab(id);
    refresh(); toast.success("Lab deleted");
  }

  async function createBooking() {
    if (!bookLab || !bookDate || !bookStart || !bookEnd || !bookFaculty.trim()) { toast.error("Fill required fields"); return; }
    const lab = labs.find((l) => l.id === bookLab);
    await createBooking({ lab_id: bookLab, lab_name: lab?.name ?? "", date: bookDate, start_time: bookStart, end_time: bookEnd, faculty_name: bookFaculty.trim(), faculty_id: "", purpose: bookPurpose, batch: bookBatch, status: "pending" });
    refresh(); setBookOpen(false); toast.success("Booking request created");
  }

  async function updateBookingStatus(b: ItLabBooking, status: string) {
    await updateBooking(b.id, { status });
    refresh(); toast.success(`Booking ${status}`);
  }

  const todayBookings = bookings.filter((b) => b.date === new Date().toISOString().slice(0, 10)).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const pendingBookings = bookings.filter((b) => b.status === "pending");

  return (
    <div>
      <PageHeader title="Computer Lab Management" subtitle="Lab inventory, system tracking & booking schedule" icon={<Monitor className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-5 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Labs</p><p className="text-2xl font-bold">{labs.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Active</p><p className="text-2xl font-bold text-success">{labs.filter((l) => l.status === "active").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Systems</p><p className="text-2xl font-bold">{labs.reduce((s, l) => s + l.systems_count, 0)}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Today's Bookings</p><p className="text-2xl font-bold text-info">{todayBookings.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Pending Approval</p><p className="text-2xl font-bold text-warning">{pendingBookings.length}</p></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4"><TabsTrigger value="labs">Labs ({labs.length})</TabsTrigger><TabsTrigger value="bookings">Bookings ({bookings.length})</TabsTrigger></TabsList>

        <TabsContent value="labs">
          <div className="flex flex-wrap gap-3 mb-4 items-center">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search labs by name, location, incharge..." className="flex-1 min-w-[200px] h-9 text-xs" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LabStatus | "all")}>
              <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem></SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/import?module=it-labs")}><Upload className="h-4 w-4 mr-1" /> Import</Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportToCsv(filteredLabs, "it-labs", [{key:"name",label:"Lab"},{key:"location",label:"Location"},{key:"capacity",label:"Capacity"},{key:"systems_count",label:"Systems"},{key:"incharge",label:"Incharge"},{key:"status",label:"Status"}])}><Download className="h-4 w-4 mr-1" /> Export</Button>
            <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Lab</Button>
          </div>
          <TablePagination {...pag} />
          <Table>
            <TableHeader><TableRow><TableHead className="text-xs">Lab</TableHead><TableHead className="text-xs">Location</TableHead><TableHead className="text-xs">Capacity</TableHead><TableHead className="text-xs">Systems</TableHead><TableHead className="text-xs">Incharge</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {pag.pageData.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs font-medium">{l.name}</TableCell>
                  <TableCell className="text-xs">{l.location || "—"}</TableCell>
                  <TableCell className="text-xs">{l.capacity}</TableCell>
                  <TableCell className="text-xs">{l.systems_count}</TableCell>
                  <TableCell className="text-xs">{l.incharge || "—"}</TableCell>
                  <TableCell><Badge className={`text-[9px] border ${LAB_STATUS_COLORS[l.status]}`}>{l.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="rounded-lg h-7 px-2 text-[10px]" onClick={() => openEdit(l)}>Edit</Button>
                      <Button variant="outline" size="sm" className="rounded-lg h-7 px-2 text-[10px]" onClick={() => toggleLabStatus(l)}>{l.status === "active" ? "Maint" : l.status === "maintenance" ? "Deact" : "Activate"}</Button>
                      <Button variant="outline" size="sm" className="rounded-lg h-7 px-2 text-[10px] text-destructive" onClick={() => setDeleteId(l.id)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLabs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">{search ? "No matching labs" : "No labs. Click 'Add Lab' to begin."}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="bookings">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">{["pending", "approved", "completed", "cancelled"].map((s) => (
              <Badge key={s} className={`text-[9px] cursor-pointer ${BOOKING_STATUS_COLORS[s as BookingStatus]}`} onClick={() => setTab("bookings")}>{s}</Badge>
            ))}</div>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/import?module=it-labs")}><Upload className="h-4 w-4 mr-1" /> Import</Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportToCsv(bookings, "it-lab-bookings", [{key:"date",label:"Date"},{key:"lab_name",label:"Lab"},{key:"start_time",label:"Start"},{key:"end_time",label:"End"},{key:"faculty_name",label:"Faculty"},{key:"purpose",label:"Purpose"},{key:"batch",label:"Batch"},{key:"status",label:"Status"}])}><Download className="h-4 w-4 mr-1" /> Export</Button>
            <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setBookLab(labs[0]?.id ?? ""); setBookDate(new Date().toISOString().slice(0, 10)); setBookStart("09:00"); setBookEnd("10:00"); setBookFaculty(""); setBookPurpose(""); setBookBatch(""); setBookOpen(true); }}><Calendar className="h-4 w-4 mr-1" /> New Booking</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Lab</TableHead><TableHead className="text-xs">Time</TableHead><TableHead className="text-xs">Faculty</TableHead><TableHead className="text-xs">Purpose</TableHead><TableHead className="text-xs">Batch</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {[...bookings].sort((a, b) => b.date.localeCompare(a.date) || a.start_time.localeCompare(b.start_time)).map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs">{b.date}</TableCell>
                  <TableCell className="text-xs font-medium">{b.lab_name}</TableCell>
                  <TableCell className="text-xs">{b.start_time} - {b.end_time}</TableCell>
                  <TableCell className="text-xs">{b.faculty_name}</TableCell>
                  <TableCell className="text-xs max-w-[150px] truncate">{b.purpose || "—"}</TableCell>
                  <TableCell className="text-xs">{b.batch || "—"}</TableCell>
                  <TableCell><Badge className={`text-[9px] border ${BOOKING_STATUS_COLORS[b.status]}`}>{b.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {b.status === "pending" && <><Button variant="outline" size="sm" className="rounded-lg h-7 px-2 text-[10px] text-success" onClick={() => updateBookingStatus(b, "approved")}><CheckCircle2 className="h-3 w-3 mr-1" />Approve</Button><Button variant="outline" size="sm" className="rounded-lg h-7 px-2 text-[10px] text-destructive" onClick={() => updateBookingStatus(b, "cancelled")}><XCircle className="h-3 w-3 mr-1" />Reject</Button></>}
                      {b.status === "approved" && <Button variant="outline" size="sm" className="rounded-lg h-7 px-2 text-[10px]" onClick={() => updateBookingStatus(b, "completed")}><CheckCircle2 className="h-3 w-3 mr-1" />Complete</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {bookings.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">No bookings yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Lab</AlertDialogTitle><AlertDialogDescription>This will permanently remove this lab. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (deleteId) { await doDeleteLab(deleteId); } setDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editId ? "Edit Lab" : "Add Lab"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Lab Name</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Computer Lab A" /></div><div><Label className="text-xs">Location</Label><Input value={formLoc} onChange={(e) => setFormLoc(e.target.value)} placeholder="e.g. Ground Floor, Block B" /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Capacity (seats)</Label><Input type="number" value={formCap} onChange={(e) => setFormCap(e.target.value)} /></div><div><Label className="text-xs">No. of Systems</Label><Input type="number" value={formSys} onChange={(e) => setFormSys(e.target.value)} /></div></div>
            <div><Label className="text-xs">Lab Incharge</Label><Input value={formIncharge} onChange={(e) => setFormIncharge(e.target.value)} placeholder="Faculty name" /></div>
            <div><Label className="text-xs">Equipment (projector, UPS, smart board, etc.)</Label><Input value={formEquip} onChange={(e) => setFormEquip(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button className="bg-gradient-primary shadow-glow" onClick={save}>{editId ? "Update" : "Add"} Lab</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Lab Booking</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Lab</Label><Select value={bookLab} onValueChange={setBookLab}><SelectTrigger><SelectValue placeholder="Select lab" /></SelectTrigger><SelectContent>{labs.filter((l) => l.status === "active").map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Date</Label><Input type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Start Time</Label><Input type="time" value={bookStart} onChange={(e) => setBookStart(e.target.value)} /></div><div><Label className="text-xs">End Time</Label><Input type="time" value={bookEnd} onChange={(e) => setBookEnd(e.target.value)} /></div></div>
            <div><Label className="text-xs">Faculty Name</Label><Input value={bookFaculty} onChange={(e) => setBookFaculty(e.target.value)} /></div>
            <div><Label className="text-xs">Purpose</Label><Input value={bookPurpose} onChange={(e) => setBookPurpose(e.target.value)} placeholder="e.g. Java Lab Practical" /></div>
            <div><Label className="text-xs">Batch / Class</Label><Input value={bookBatch} onChange={(e) => setBookBatch(e.target.value)} placeholder="e.g. III-CSE, MCA I" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setBookOpen(false)}>Cancel</Button><Button className="bg-gradient-primary shadow-glow" onClick={createBooking}>Request Booking</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
