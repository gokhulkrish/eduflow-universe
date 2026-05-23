import { useEffect, useState } from "react";
import { IdCard, Plus, RotateCcw, Ban, Palette, Layers, Bus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { subscribeAppSync } from "@/lib/app-sync";
import { digitalIdTemplatesKey, digitalIdsKey, busPassesKey, getIDs, createID, createBulkIDs, updateID, revokeID, getTemplates, createTemplate, deleteTemplate, getBusPasses, createBusPass, updateBusPass, deleteBusPass, FONTS, FIELD_OPTIONS } from "@/lib/digital-id";

export default function DigitalID() {
  const [tab, setTab] = useState("ids");
  const [items, setItems] = useState(() => getIDs());
  const [templates, setTemplates] = useState(() => getTemplates());
  const [busPasses, setBusPasses] = useState(() => getBusPasses());
  const refresh = () => setItems(getIDs());
  const refreshTemplates = () => setTemplates(getTemplates());
  const refreshBus = () => setBusPasses(getBusPasses());

  useEffect(() => subscribeAppSync([digitalIdsKey, digitalIdTemplatesKey, busPassesKey], () => {
    setItems(getIDs());
    setTemplates(getTemplates());
    setBusPasses(getBusPasses());
  }), []);

  const [open, setOpen] = useState(false);
  const [type, setType] = useState(""); const [name, setName] = useState(""); const [idNum, setIdNum] = useState(""); const [issue, setIssue] = useState(""); const [expiry, setExpiry] = useState(""); const [templateId, setTemplateId] = useState("");
  const [tplOpen, setTplOpen] = useState(false); const [tplName, setTplName] = useState(""); const [bgColor, setBgColor] = useState("#1e40af"); const [textColor, setTextColor] = useState("#ffffff"); const [font, setFont] = useState("Arial"); const [fields, setFields] = useState<string[]>([]); const [logoUrl, setLogoUrl] = useState("");
  const [preview, setPreview] = useState<string>("");
  const [bulkPrefix, setBulkPrefix] = useState("ID"); const [bulkCount, setBulkCount] = useState("10"); const [bulkType, setBulkType] = useState("student");
  const [bpOpen, setBpOpen] = useState(false); const [bpStudent, setBpStudent] = useState(""); const [bpRoute, setBpRoute] = useState(""); const [bpPickup, setBpPickup] = useState(""); const [bpDropoff, setBpDropoff] = useState(""); const [bpFee, setBpFee] = useState("");

  const previewCard = () => { setPreview(`bg:${bgColor} | text:${textColor} | font:${font} | fields:${fields.join(",") || "none"}`); };

  const pag1 = usePagination({ data: items, pageSize: 10 });
  const pag2 = usePagination({ data: busPasses, pageSize: 10 });

  return (
    <div>
      <PageHeader title="Digital ID & Bus Pass" subtitle="ID cards, templates & bus passes" icon={<IdCard className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="ids">IDs</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="buspass">Bus Pass</TabsTrigger>
          <TabsTrigger value="bulk">Bulk</TabsTrigger>
        </TabsList>

        <TabsContent value="ids">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setType(""); setName(""); setIdNum(""); setIssue(""); setExpiry(""); setTemplateId(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Issue ID</Button></div>
          <TablePagination {...pag1} />
          <Table>
            <TableHeader className=""><TableRow><TableHead className="text-xs">ID #</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Template</TableHead><TableHead className="text-xs">Issue</TableHead><TableHead className="text-xs">Expiry</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {items.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">No IDs issued</TableCell></TableRow>}
              {pag1.pageData.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-xs font-mono">{d.id_number}</TableCell>
                  <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{d.entity_type}</Badge></TableCell>
                  <TableCell className="text-xs">{d.entity_name}</TableCell>
                  <TableCell className="text-xs">{templates.find((t) => t.id === d.template_id)?.name ?? "—"}</TableCell>
                  <TableCell className="text-xs">{new Date(d.issue_date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs">{new Date(d.expiry_date).toLocaleDateString()}</TableCell>
                  <TableCell><Badge className={`text-[9px] ${d.status === "active" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{d.status}</Badge></TableCell>
                  <TableCell>{d.status === "active" ? <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { revokeID(d.id); refresh(); toast.success("Revoked"); }}><Ban className="h-3 w-3 mr-1" />Revoke</Button> : <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => { updateID(d.id, { status: "active" }); refresh(); toast.success("Reactivated"); }}><RotateCcw className="h-3 w-3 mr-1" />Reactivate</Button>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="templates">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setTplName(""); setBgColor("#1e40af"); setTextColor("#ffffff"); setFont("Arial"); setFields([]); setLogoUrl(""); setTplOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Template</Button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No templates</CardContent></Card>}
            {templates.map((t) => (
              <Card key={t.id} className="border-border/40">
                <CardHeader className="pb-2"><div className="flex items-center gap-2"><div className="h-6 w-6 rounded" style={{ backgroundColor: t.bg_color }} /><CardTitle className="text-sm">{t.name}</CardTitle></div></CardHeader>
                <CardContent className="text-xs space-y-1">
                  <p className="text-muted-foreground">Font: {t.font} · Fields: {t.fields.length}</p>
                  <div className="flex gap-1 flex-wrap">{t.fields.map((f) => <Badge key={f} className="text-[8px] bg-muted text-muted-foreground">{f}</Badge>)}</div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => { setBgColor(t.bg_color); setTextColor(t.text_color); setFont(t.font); setFields(t.fields); setLogoUrl(t.logo_url); previewCard(); }}><Palette className="h-3 w-3 mr-1" />Preview</Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { deleteTemplate(t.id); refreshTemplates(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {preview && <Card className="mt-4"><CardContent><div className="rounded-xl p-6 text-center" style={{ backgroundColor: bgColor, color: textColor, fontFamily: font }}><p className="text-lg font-bold">SAMPLE ID</p><p className="text-sm">John Doe</p><p className="text-[10px] opacity-80">ID: STU-001</p><div className="mt-2 flex gap-2 justify-center">{fields.map((f) => <Badge key={f} className="text-[8px]" style={{ backgroundColor: textColor, color: bgColor }}>{f}</Badge>)}</div></div></CardContent></Card>}
        </TabsContent>

        <TabsContent value="buspass">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setBpStudent(""); setBpRoute(""); setBpPickup(""); setBpDropoff(""); setBpFee(""); setBpOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Issue Bus Pass</Button></div>
          <TablePagination {...pag2} />
          <Table>
            <TableHeader className=""><TableRow><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Route</TableHead><TableHead className="text-xs">Pickup</TableHead><TableHead className="text-xs">Dropoff</TableHead><TableHead className="text-xs">Fee</TableHead><TableHead className="text-xs">Expiry</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {pag2.pageData.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs">{b.student}</TableCell>
                  <TableCell className="text-xs">{b.route}</TableCell>
                  <TableCell className="text-xs">{b.pickup}</TableCell>
                  <TableCell className="text-xs">{b.dropoff}</TableCell>
                  <TableCell className="text-xs">₹{b.fee}</TableCell>
                  <TableCell className="text-xs">{new Date(b.expiry_date).toLocaleDateString()}</TableCell>
                  <TableCell><Badge className={`text-[9px] ${b.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{b.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {b.status === "active" ? <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => { updateBusPass(b.id, { status: "expired" }); refreshBus(); toast.success("Expired"); }}>Expire</Button> : <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => { updateBusPass(b.id, { status: "active" }); refreshBus(); toast.success("Reactivated"); }}><RotateCcw className="h-3 w-3 mr-1" /></Button>}
                      <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { deleteBusPass(b.id); refreshBus(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {busPasses.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">No bus passes issued</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader><CardTitle className="text-sm">Bulk ID Generation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Type</Label><Select value={bulkType} onValueChange={setBulkType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="student">Students</SelectItem><SelectItem value="staff">Staff</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">ID Prefix</Label><Input value={bulkPrefix} onChange={(e) => setBulkPrefix(e.target.value)} /></div>
                <div><Label className="text-xs">Count</Label><Input type="number" value={bulkCount} onChange={(e) => setBulkCount(e.target.value)} /></div>
              </div>
              <div><Label className="text-xs">Template</Label><Select value={templateId} onValueChange={setTemplateId}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
              <Button className="rounded-xl" disabled={!templateId || !bulkPrefix} onClick={() => {
                const c = Number(bulkCount); const entries = Array.from({ length: c }, (_, i) => ({ entity_type: bulkType, entity_id: `${bulkPrefix}${String(i + 1).padStart(3, "0")}`, entity_name: `${bulkType} ${i + 1}`, id_number: `${bulkPrefix}${String(i + 1).padStart(3, "0")}`, template_id: templateId, issue_date: new Date().toISOString(), expiry_date: new Date(Date.now() + 365 * 86400000).toISOString(), status: "active" as const }));
                createBulkIDs(entries); refresh(); toast.success(`${c} IDs generated`);
              }}><Layers className="h-4 w-4 mr-2" /> Generate {bulkCount} IDs</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Issue ID</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Type</Label><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="student">Student</SelectItem><SelectItem value="staff">Staff</SelectItem><SelectItem value="parent">Parent</SelectItem></SelectContent></Select></div><div><Label className="text-xs">ID #</Label><Input value={idNum} onChange={(e) => setIdNum(e.target.value)} /></div></div>
            <div><Label className="text-xs">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label className="text-xs">Template</Label><Select value={templateId} onValueChange={setTemplateId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Issue Date</Label><Input type="date" value={issue} onChange={(e) => setIssue(e.target.value)} /></div><div><Label className="text-xs">Expiry</Label><Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { createID({ entity_type: type, entity_id: idNum, entity_name: name, id_number: idNum, template_id: templateId, issue_date: new Date(issue).toISOString(), expiry_date: new Date(expiry).toISOString(), status: "active" }); refresh(); setOpen(false); toast.success("Issued"); }} disabled={!type || !name || !idNum || !issue || !expiry}>Issue</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tplOpen} onOpenChange={setTplOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Template</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Name</Label><Input value={tplName} onChange={(e) => setTplName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Bg Color</Label><Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} /></div><div><Label className="text-xs">Text Color</Label><Input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Font</Label><Select value={font} onValueChange={setFont}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-xs">Logo URL</Label><Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} /></div></div>
            <div><Label className="text-xs">Fields</Label><div className="flex flex-wrap gap-1 mt-1">{FIELD_OPTIONS.filter((f) => f !== "Photo" && f !== "QR Code").map((f) => <Badge key={f} className={`cursor-pointer text-[9px] ${fields.includes(f) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`} onClick={() => setFields(fields.includes(f) ? fields.filter((x) => x !== f) : [...fields, f])}>{f}</Badge>)}</div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTplOpen(false)}>Cancel</Button><Button onClick={() => { createTemplate({ name: tplName, bg_color: bgColor, text_color: textColor, font, logo_url: logoUrl, fields, card_width: 85, card_height: 54 }); refreshTemplates(); setTplOpen(false); toast.success("Created"); }} disabled={!tplName}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bpOpen} onOpenChange={setBpOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Issue Bus Pass</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Student</Label><Input value={bpStudent} onChange={(e) => setBpStudent(e.target.value)} /></div><div><Label className="text-xs">Route</Label><Input value={bpRoute} onChange={(e) => setBpRoute(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Pickup</Label><Input value={bpPickup} onChange={(e) => setBpPickup(e.target.value)} /></div><div><Label className="text-xs">Dropoff</Label><Input value={bpDropoff} onChange={(e) => setBpDropoff(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Fee (₹)</Label><Input type="number" value={bpFee} onChange={(e) => setBpFee(e.target.value)} /></div><div><Label className="text-xs">Expiry</Label><Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setBpOpen(false)}>Cancel</Button><Button disabled={!bpStudent || !bpRoute} onClick={() => { createBusPass({ student: bpStudent, route: bpRoute, pickup: bpPickup, dropoff: bpDropoff, fee: Number(bpFee) || 0, issue_date: new Date().toISOString(), expiry_date: expiry ? new Date(expiry).toISOString() : new Date(Date.now() + 365 * 86400000).toISOString(), status: "active" }); refreshBus(); setBpOpen(false); toast.success("Bus pass issued"); }}>Issue</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
