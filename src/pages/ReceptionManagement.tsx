import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { DoorOpen, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
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
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

type Visitor = { id: string; name: string; contact: string; purpose: string; host: string; in_time: string; out_time: string; status: string; };
export const visitorsKey = "eduflow_visitors";
function ls(): Visitor[] { try { return JSON.parse(localStorage.getItem(visitorsKey) ?? "[]"); } catch { return []; } }
function ss(v: Visitor[]) { localStorage.setItem(visitorsKey, JSON.stringify(v)); emitAppSync(visitorsKey); }

export default function ReceptionManagement() {
  const [items, setItems] = useState(ls()); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [contact, setContact] = useState(""); const [purpose, setPurpose] = useState(""); const [host, setHost] = useState("");

  const pag = usePagination({ data: items, pageSize: 10 });

  useEffect(() => subscribeAppSync([visitorsKey], refresh), []);

  return (
    <div>
      <PageHeader title="Reception Management" subtitle="Visitor check-in/out log" icon={<DoorOpen className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Today's Visitors</p><p className="text-2xl font-bold">{items.filter((v) => new Date(v.in_time).toDateString() === new Date().toDateString()).length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Checked In</p><p className="text-2xl font-bold text-warning">{items.filter((v) => v.status === "checked-in").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Checked Out</p><p className="text-2xl font-bold text-success">{items.filter((v) => v.status === "checked-out").length}</p></Card>
      </div>
      <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setName(""); setContact(""); setPurpose(""); setHost(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Check In Visitor</Button></div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader className=""><TableRow><TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Contact</TableHead><TableHead className="text-xs">Purpose</TableHead><TableHead className="text-xs">Host</TableHead><TableHead className="text-xs">In Time</TableHead><TableHead className="text-xs">Out Time</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((v) => (
            <TableRow key={v.id}>
              <TableCell className="text-xs font-medium">{v.name}</TableCell>
              <TableCell className="text-xs">{v.contact}</TableCell>
              <TableCell className="text-xs">{v.purpose}</TableCell>
              <TableCell className="text-xs">{v.host || "—"}</TableCell>
              <TableCell className="text-xs">{new Date(v.in_time).toLocaleTimeString()}</TableCell>
              <TableCell className="text-xs">{v.out_time ? new Date(v.out_time).toLocaleTimeString() : "—"}</TableCell>
              <TableCell><Badge className={`text-[9px] ${v.status === "checked-in" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{v.status}</Badge></TableCell>
              <TableCell>{v.status === "checked-in" && <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => { ss(ls().map((x) => x.id === v.id ? { ...x, status: "checked-out", out_time: new Date().toISOString() } : x)); refresh(); toast.success("Checked out"); }}>Check Out</Button>}</TableCell>
            </TableRow>
          ))}
          {items.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">No visitors today</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Check In Visitor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="visitorName">Name</Label><Input id="visitorName" name="visitorName" value={name} onChange={(e) => setName(e.target.value)} /></div><div><Label className="text-xs" htmlFor="visitorContact">Contact</Label><Input id="visitorContact" name="visitorContact" value={contact} onChange={(e) => setContact(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="visitorPurpose">Purpose</Label><Input id="visitorPurpose" name="visitorPurpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} /></div><div><Label className="text-xs" htmlFor="visitorHost">Host</Label><Input id="visitorHost" name="visitorHost" value={host} onChange={(e) => setHost(e.target.value)} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name} onClick={() => { const items = ls(); items.unshift({ id: crypto.randomUUID(), name, contact, purpose, host, in_time: new Date().toISOString(), out_time: "", status: "checked-in" }); ss(items); refresh(); setOpen(false); toast.success("Checked in"); }}>Check In</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
