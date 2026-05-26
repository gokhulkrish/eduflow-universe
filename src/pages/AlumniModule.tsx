import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { GraduationCap, Plus, Trash2, Search } from "lucide-react";
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
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";

type Alumni = { id: string; name: string; batch: string; email: string; phone: string; occupation: string; company: string; city: string; };
const ALUMNI_KEY = "eduflow_alumni";
function ls(): Alumni[] { try { return JSON.parse(localStorage.getItem(ALUMNI_KEY) ?? "[]"); } catch { return []; } }
function ss(v: Alumni[]) { localStorage.setItem(ALUMNI_KEY, JSON.stringify(v)); emitAppSync(ALUMNI_KEY); }

export default function AlumniModule() {
  const [items, setItems] = useState(ls()); const [search, setSearch] = useState(""); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [batch, setBatch] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [occupation, setOccupation] = useState(""); const [company, setCompany] = useState(""); const [city, setCity] = useState("");
  const filtered = items.filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.batch.includes(search) || a.company?.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => subscribeAppSync([ALUMNI_KEY], refresh), []);

  const pag = usePagination({ data: filtered, pageSize: 10 });

  return (
    <div>
      <PageHeader title="Alumni Module" subtitle="Graduate directory & engagement" icon={<GraduationCap className="h-6 w-6" />} />
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1"><Input id="search-alumni" name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search alumni..." className="pl-3 h-9 text-xs" /></div>
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setName(""); setBatch(""); setEmail(""); setPhone(""); setOccupation(""); setCompany(""); setCity(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Alumni</Button>
      </div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader className=""><TableRow><TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Batch</TableHead><TableHead className="text-xs">Contact</TableHead><TableHead className="text-xs">Occupation</TableHead><TableHead className="text-xs">Company</TableHead><TableHead className="text-xs">Location</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="text-xs font-medium">{a.name}</TableCell>
              <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{a.batch}</Badge></TableCell>
              <TableCell className="text-xs">{a.email}<br/>{a.phone}</TableCell>
              <TableCell className="text-xs">{a.occupation || "—"}</TableCell>
              <TableCell className="text-xs">{a.company || "—"}</TableCell>
              <TableCell className="text-xs">{a.city || "—"}</TableCell>
              <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== a.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">{search ? "No matching alumni" : "No alumni added"}</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Alumni</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="name">Name</Label><Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} /></div><div><Label className="text-xs" htmlFor="batch">Batch</Label><Input id="batch" name="batch" value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="e.g. 2024" /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div><div><Label className="text-xs" htmlFor="phone">Phone</Label><Input id="phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="occupation">Occupation</Label><Input id="occupation" name="occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} /></div><div><Label className="text-xs" htmlFor="company">Company</Label><Input id="company" name="company" value={company} onChange={(e) => setCompany(e.target.value)} /></div></div>
            <div><Label className="text-xs" htmlFor="city">City</Label><Input id="city" name="city" value={city} onChange={(e) => setCity(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name || !batch} onClick={() => { const items = ls(); items.push({ id: crypto.randomUUID(), name, batch, email, phone, occupation, company, city }); ss(items); refresh(); setOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
