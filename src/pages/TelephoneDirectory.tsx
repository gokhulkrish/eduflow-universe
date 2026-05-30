import { useEffect, useState } from "react";
import { Phone, Plus, Pencil, Trash2, Search, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useRealtime } from "@/lib/use-realtime";
import { getContacts, createContact, updateContact, deleteContact, contactsKey, type Contact } from "@/lib/contacts";

export default function TelephoneDirectory() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Contact[]>([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(""); const refresh = async () => setItems(await getContacts());
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null); const [name, setName] = useState(""); const [role, setRole] = useState(""); const [phone, setPhone] = useState(""); const [email, setEmail] = useState(""); const [dept, setDept] = useState(""); const [deleteId, setDeleteId] = useState<string | null>(null);
  const openAdd = () => { setEditId(null); setName(""); setRole(""); setPhone(""); setEmail(""); setDept(""); setOpen(true); };
  const openEdit = (c: Contact) => { setEditId(c.id); setName(c.name); setRole(c.role); setPhone(c.phone); setEmail(c.email); setDept(c.department); setOpen(true); };
  const filtered = items.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.department.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => { refresh().then(() => setLoading(false)); }, []);
  useRealtime("contacts", refresh);

  const exportCols = [{key:"name",label:"Name"},{key:"role",label:"Role"},{key:"department",label:"Department"},{key:"phone",label:"Phone"},{key:"email",label:"Email"}];

  return (
    <div>
      <PageHeader title="Telephone Directory" subtitle="Staff & department contacts" icon={<Phone className="h-6 w-6" />} />
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1"><Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input id="contactSearch" name="contactSearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, or department..." className="pl-9 h-9 text-xs" /></div>
        <Button size="sm" variant="outline" className="rounded-xl shrink-0 mr-2" onClick={() => navigate("/import?module=telephone")}><Upload className="h-4 w-4 mr-1" /> Import</Button>
        <Button size="sm" variant="outline" className="rounded-xl shrink-0 mr-2" onClick={() => exportToCsv(items, "contacts", exportCols)}><Download className="h-4 w-4 mr-1" /> Export</Button>
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow shrink-0" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Contact</Button>
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
              <div className="flex gap-1"><Button variant="ghost" size="sm" className="rounded-lg h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button><Button variant="ghost" size="sm" className="rounded-lg h-7 w-7 text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="h-3 w-3" /></Button></div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">{search ? "No matching contacts" : "No contacts added"}</CardContent></Card>}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Contact</AlertDialogTitle><AlertDialogDescription>This will permanently remove this contact. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (deleteId) { await deleteContact(deleteId); await refresh(); toast.success("Deleted"); } setDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit Contact" : "Add Contact"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="contactName">Name</Label><Input id="contactName" name="contactName" value={name} onChange={(e) => setName(e.target.value)} /></div><div><Label className="text-xs" htmlFor="contactRole">Role</Label><Input id="contactRole" name="contactRole" value={role} onChange={(e) => setRole(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="contactPhone">Phone</Label><Input id="contactPhone" name="contactPhone" value={phone} onChange={(e) => setPhone(e.target.value)} /></div><div><Label className="text-xs" htmlFor="contactEmail">Email</Label><Input id="contactEmail" name="contactEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div></div>
            <div><Label className="text-xs" htmlFor="contactDept">Department</Label><Select name="contactDept" value={dept} onValueChange={setDept}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Academic">Academic</SelectItem><SelectItem value="Admin">Admin</SelectItem><SelectItem value="Finance">Finance</SelectItem><SelectItem value="Transport">Transport</SelectItem><SelectItem value="Library">Library</SelectItem><SelectItem value="Management">Management</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name || !phone} onClick={async () => { if (editId) { await updateContact(editId, { name, role, phone, email, department: dept }); } else { await createContact({ name, role, phone, email, department: dept }); } await refresh(); setOpen(false); toast.success(editId ? "Updated" : "Added"); }}>{editId ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
