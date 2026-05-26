import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { Phone, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";

type Contact = { id: string; name: string; role: string; phone: string; email: string; department: string; };
export const contactsKey = "eduflow_contacts";
function ls(): Contact[] { try { return JSON.parse(localStorage.getItem(contactsKey) ?? "[]"); } catch { return []; } }
function ss(v: Contact[]) { localStorage.setItem(contactsKey, JSON.stringify(v)); emitAppSync(contactsKey); }

export default function TelephoneDirectory() {
  const [items, setItems] = useState(ls()); const [search, setSearch] = useState(""); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [role, setRole] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState(""); const [dept, setDept] = useState("");
  const filtered = items.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.department.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => subscribeAppSync([contactsKey], refresh), []);

  return (
    <div>
      <PageHeader title="Telephone Directory" subtitle="Staff & department contacts" icon={<Phone className="h-6 w-6" />} />
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1"><Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input id="contactSearch" name="contactSearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, or department..." className="pl-9 h-9 text-xs" /></div>
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow shrink-0" onClick={() => { setName(""); setRole(""); setPhone(""); setEmail(""); setDept(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Contact</Button>
      </div>
      <div className="space-y-2">
        {filtered.map((c) => (
          <Card key={c.id} className="border-border/40">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.role} · {c.department}</p>
                <p className="text-xs font-mono text-primary">{c.phone}</p>
                {c.email && <p className="text-[10px] text-muted-foreground">{c.email}</p>}
              </div>
              <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7 text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== c.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">{search ? "No matching contacts" : "No contacts added"}</CardContent></Card>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="contactName">Name</Label><Input id="contactName" name="contactName" value={name} onChange={(e) => setName(e.target.value)} /></div><div><Label className="text-xs" htmlFor="contactRole">Role</Label><Input id="contactRole" name="contactRole" value={role} onChange={(e) => setRole(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="contactPhone">Phone</Label><Input id="contactPhone" name="contactPhone" value={phone} onChange={(e) => setPhone(e.target.value)} /></div><div><Label className="text-xs" htmlFor="contactEmail">Email</Label><Input id="contactEmail" name="contactEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div></div>
            <div><Label className="text-xs" htmlFor="contactDept">Department</Label><Select name="contactDept" value={dept} onValueChange={setDept}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Academic">Academic</SelectItem><SelectItem value="Admin">Admin</SelectItem><SelectItem value="Finance">Finance</SelectItem><SelectItem value="Transport">Transport</SelectItem><SelectItem value="Library">Library</SelectItem><SelectItem value="Management">Management</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name || !phone} onClick={() => { const items = ls(); items.push({ id: crypto.randomUUID(), name, role, phone, email, department: dept }); ss(items); refresh(); setOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
