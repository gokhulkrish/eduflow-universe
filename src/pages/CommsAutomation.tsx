import { useCallback, useEffect, useState } from "react";
import { Workflow, Plus, Trash2, Power, PowerOff, History } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useRealtime } from "@/lib/use-realtime";
import { getAutomations, createAutomation, updateAutomation, deleteAutomation, AutomationRule } from "@/lib/comms-automation";

type TriggerType = "attendance_below" | "birthday" | "fee_overdue" | "new_enrollment" | "exam_published" | "inactivity";
type ActionType = "send_sms" | "send_email" | "send_push" | "post_class_wall" | "send_notice";

const TRIGGER_OPTIONS: { value: TriggerType; label: string; params: { key: string; label: string; type: string }[] }[] = [
  { value: "attendance_below", label: "Attendance Below Threshold", params: [{ key: "threshold", label: "Threshold %", type: "number" }] },
  { value: "birthday", label: "Student/Staff Birthday", params: [] },
  { value: "fee_overdue", label: "Fee Overdue", params: [{ key: "days", label: "Days Overdue", type: "number" }] },
  { value: "new_enrollment", label: "New Enrollment", params: [] },
  { value: "exam_published", label: "Exam Result Published", params: [] },
  { value: "inactivity", label: "Inactivity Period", params: [{ key: "days", label: "Days Inactive", type: "number" }] },
];

const ACTION_OPTIONS: { value: ActionType; label: string; params: { key: string; label: string; type: string }[] }[] = [
  { value: "send_sms", label: "Send SMS", params: [{ key: "template", label: "Template Code", type: "text" }] },
  { value: "send_email", label: "Send Email", params: [{ key: "template", label: "Template Code", type: "text" }] },
  { value: "send_push", label: "Send Push Notification", params: [{ key: "template", label: "Template Code", type: "text" }] },
  { value: "post_class_wall", label: "Post to Class Wall", params: [{ key: "message", label: "Message", type: "text" }] },
  { value: "send_notice", label: "Send Notice", params: [{ key: "template", label: "Template Code", type: "text" }] },
];

const TRIGGER_LABELS: Record<string, string> = Object.fromEntries(TRIGGER_OPTIONS.map((t) => [t.value, t.label]));
const ACTION_LABELS: Record<string, string> = Object.fromEntries(ACTION_OPTIONS.map((a) => [a.value, a.label]));

export default function CommsAutomation() {
  const [items, setItems] = useState<AutomationRule[]>([]);
  const refresh = useCallback(async () => { setItems(await getAutomations()); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useRealtime("comms_automation", refresh);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<TriggerType>("attendance_below");
  const [triggerParams, setTriggerParams] = useState<Record<string, string>>({});
  const [action, setAction] = useState<ActionType>("send_email");
  const [actionParams, setActionParams] = useState<Record<string, string>>({});
  const [active, setActive] = useState(true);

  const triggerOpt = TRIGGER_OPTIONS.find((t) => t.value === trigger);
  const actionOpt = ACTION_OPTIONS.find((a) => a.value === action);

  const openCreate = () => {
    setEditingId(null);
    setName(""); setDescription(""); setTrigger("attendance_below");
    setTriggerParams({}); setAction("send_email"); setActionParams({});
    setActive(true);
    setOpen(true);
  };

  const openEdit = (r: AutomationRule) => {
    setEditingId(r.id);
    setName(r.name); setDescription(r.description);
    setTrigger(r.trigger); setTriggerParams(r.triggerParams);
    setAction(r.action); setActionParams(r.actionParams);
    setActive(r.active);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name) { toast.error("Rule name is required"); return; }
    if (editingId) {
      await updateAutomation(editingId, { name, description, trigger, triggerParams, action, actionParams, active });
      toast.success("Rule updated");
    } else {
      await createAutomation({ name, description, trigger, triggerParams, action, actionParams, active });
      toast.success("Rule created");
    }
    setOpen(false);
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteAutomation(id);
    refresh();
    toast.success("Rule deleted");
  };

  const toggleActive = async (id: string, current: boolean) => {
    await updateAutomation(id, { active: !current });
    refresh();
  };

  const handleRunNow = async (id: string, runCount: number) => {
    await updateAutomation(id, { runCount: runCount + 1, lastRun: new Date().toISOString() });
    refresh();
    toast.success("Rule executed");
  };

  return (
    <div>
      <PageHeader title="Automation Rules" subtitle="If-this-then-that triggers for automated communications" icon={<Workflow className="h-6 w-6" />} />

      <div className="flex justify-end mb-4">
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> New Rule
        </Button>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No automation rules configured</CardContent></Card>
        )}
        {items.map((r) => (
          <Card key={r.id} className="border-border/40 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(r)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {r.active ? <Power className="h-3.5 w-3.5 text-success" /> : <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />}
                    <p className="text-sm font-medium">{r.name}</p>
                    <Badge className={`text-[9px] ${r.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{r.active ? "Active" : "Inactive"}</Badge>
                  </div>
                  {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
                  <div className="flex items-center gap-2 mt-1.5 text-xs">
                    <Badge className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">IF {TRIGGER_LABELS[r.trigger] ?? r.trigger}</Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge className="text-[9px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">THEN {ACTION_LABELS[r.action] ?? r.action}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span>{r.runCount} execution(s)</span>
                    {r.lastRun && <span>Last: {new Date(r.lastRun).toLocaleString()}</span>}
                  </div>
                </div>
                <div className="flex gap-1 ml-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" className="rounded-lg h-7 text-[9px]" onClick={() => handleRunNow(r.id, r.runCount)} title="Run Now">
                    <History className="h-3 w-3 mr-1" /> Run
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7" onClick={() => toggleActive(r.id, r.active)} title={r.active ? "Deactivate" : "Activate"}>
                    {r.active ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7 text-destructive" onClick={() => handleDelete(r.id)} title="Delete">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Edit Rule" : "New Automation Rule"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs" htmlFor="ruleName">Rule Name</Label>
              <Input id="ruleName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Low Attendance Alert" />
            </div>
            <div>
              <Label className="text-xs" htmlFor="ruleDesc">Description (optional)</Label>
              <Textarea id="ruleDesc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="When should this rule fire?" />
            </div>

            <div className="border-t border-border/40 pt-3">
              <Label className="text-xs font-medium flex items-center gap-2 mb-2"><Badge className="text-[9px] bg-blue-100 text-blue-700">IF</Badge> Trigger</Label>
              <Select value={trigger} onValueChange={(v) => { setTrigger(v as TriggerType); setTriggerParams({}); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {triggerOpt?.params.map((p) => (
                <div key={p.key} className="mt-2">
                  <Label className="text-xs">{p.label}</Label>
                  <Input type={p.type} className="h-8 text-xs" value={triggerParams[p.key] ?? ""} onChange={(e) => setTriggerParams({ ...triggerParams, [p.key]: e.target.value })} />
                </div>
              ))}
            </div>

            <div className="border-t border-border/40 pt-3">
              <Label className="text-xs font-medium flex items-center gap-2 mb-2"><Badge className="text-[9px] bg-purple-100 text-purple-700">THEN</Badge> Action</Label>
              <Select value={action} onValueChange={(v) => { setAction(v as ActionType); setActionParams({}); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {actionOpt?.params.map((p) => (
                <div key={p.key} className="mt-2">
                  <Label className="text-xs">{p.label}</Label>
                  <Input type={p.type} className="h-8 text-xs" value={actionParams[p.key] ?? ""} onChange={(e) => setActionParams({ ...actionParams, [p.key]: e.target.value })} />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Switch checked={active} onCheckedChange={setActive} />
              <Label className="text-xs">Rule active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!name} onClick={handleSave}>
              <Workflow className="h-4 w-4 mr-1" /> {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
