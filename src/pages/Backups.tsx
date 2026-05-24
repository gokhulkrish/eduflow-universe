import { useEffect, useState } from "react";
import { Database, Plus, Download, Trash2, RotateCcw, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { subscribeAppSync } from "@/lib/app-sync";
import { backupsKey, backupScheduleKey, getBackups, createBackup, deleteBackup, setSchedule, getSchedule } from "@/lib/backups";

export default function Backups() {
  const [tab, setTab] = useState("backups");
  const [items, setItems] = useState(() => getBackups());
  const [schedule, setScheduleState] = useState(() => getSchedule());
  const refresh = () => setItems(getBackups());
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [encrypted, setEncrypted] = useState(false);

  useEffect(() => subscribeAppSync([backupsKey, backupScheduleKey], () => {
    refresh();
    setScheduleState(getSchedule());
  }), []);

  const pag = usePagination({ data: items, pageSize: 10 });

  return (
    <div>
      <PageHeader title="Backups" subtitle="Encrypted snapshots, schedule & restore" icon={<Database className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 w-full flex-nowrap overflow-x-auto">
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="backups">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setName(""); setEncrypted(false); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Create Backup</Button></div>
          <Card>
            <CardContent className="p-0">
              <TablePagination {...pag} />
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <Table className="min-w-max">
                  <TableHeader className="">
                    <TableRow><TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Size</TableHead><TableHead className="text-xs">Tables</TableHead><TableHead className="text-xs">Rows</TableHead><TableHead className="text-xs">Encrypted</TableHead><TableHead className="text-xs">Created</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-12">No backups created</TableCell></TableRow>}
                    {pag.pageData.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="text-xs font-medium">{b.name}</TableCell>
                        <TableCell className="text-xs">{b.size}</TableCell>
                        <TableCell className="text-xs">{b.tables}</TableCell>
                        <TableCell className="text-xs">{b.rows.toLocaleString()}</TableCell>
                        <TableCell>{b.encrypted ? <Shield className="h-3 w-3 text-success" /> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-xs">{new Date(b.created_at).toLocaleString()}</TableCell>
                        <TableCell><Badge className={`text-[9px] ${b.status === "completed" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{b.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => toast.success("Download started")}><Download className="h-3 w-3 mr-1" /></Button>
                            <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => toast.success("Restore queued")}><RotateCcw className="h-3 w-3 mr-1" /></Button>
                            <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { deleteBackup(b.id); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader><CardTitle className="text-sm">Auto-Backup Schedule</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <Label className="text-xs">Frequency</Label>
                <Select value={schedule} onValueChange={(v) => { setSchedule(v); setScheduleState(v); toast.success(`Schedule set to ${v}`); }}>
                  <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never (manual only)</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly (Sunday)</SelectItem>
                    <SelectItem value="monthly">Monthly (1st)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="encrypt-auto" defaultChecked />
                <Label htmlFor="encrypt-auto" className="text-xs">Encrypt automatic backups</Label>
              </div>
              {schedule !== "never" && (
                <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Next backup scheduled: {schedule === "daily" ? "tomorrow at 02:00" : schedule === "weekly" ? "next Sunday at 02:00" : "1st of next month at 02:00"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Create Backup</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Backup Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pre-term backup" /></div>
            <div className="flex items-center gap-2"><Switch checked={encrypted} onCheckedChange={setEncrypted} id="encrypt" /><Label htmlFor="encrypt" className="text-xs">Encrypt backup</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name} onClick={() => { createBackup(name, encrypted); refresh(); setOpen(false); toast.success(encrypted ? "Encrypted backup created" : "Backup created"); }}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
