import { useEffect, useState, useCallback } from "react";
import { FileText, Plus, Pencil, Trash2, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { getTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate, expandTemplate } from "../../core/comms/service";
import type { MessageTemplate, MessageType } from "../../core/comms/service";

type FormState = "closed" | "create" | "edit";

const CHANNELS: { value: MessageType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "push", label: "Push" },
  { value: "notice", label: "Notice" },
];

const CHANNEL_BADGE = {
  sms: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  email: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  push: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  notice: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

function extractVariables(body: string): string[] {
  const matches = body.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
}

interface TemplateForm {
  name: string;
  code: string;
  type: MessageType;
  subject: string;
  body: string;
}

const emptyForm: TemplateForm = {
  name: "",
  code: "",
  type: "sms",
  subject: "",
  body: "",
};

export default function CommsTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<MessageType | "all">("all");
  const [formState, setFormState] = useState<FormState>("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm);
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const detectedVars = extractVariables(form.body);

  const openCreate = () => {
    setForm(emptyForm);
    setPreviewVars({});
    setEditingId(null);
    setFormState("create");
  };

  const openEdit = async (id: string) => {
    try {
      const tpl = await getTemplateById(id);
      if (!tpl) { toast.error("Template not found"); return; }
      setForm({
        name: tpl.name,
        code: tpl.code ?? "",
        type: tpl.type,
        subject: tpl.subject ?? "",
        body: tpl.body,
      });
      setEditingId(id);
      setPreviewVars({});
      setFormState("edit");
    } catch {
      toast.error("Failed to load template");
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.body) { toast.error("Name and body are required"); return; }
    try {
      if (formState === "create") {
        await createTemplate({ ...form, variables: detectedVars, is_active: true });
        toast.success("Template created");
      } else if (editingId) {
        await updateTemplate(editingId, { ...form, variables: detectedVars });
        toast.success("Template updated");
      }
      setFormState("closed");
      loadTemplates();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save template");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(id);
      toast.success("Template deleted");
      loadTemplates();
    } catch {
      toast.error("Failed to delete template");
    }
  };

  const previewBody = showPreview && detectedVars.length > 0
    ? expandTemplate({ ...form, variables: detectedVars } as MessageTemplate, previewVars)
    : "";

  const filtered = channelFilter === "all"
    ? templates
    : templates.filter((t) => t.type === channelFilter);

  return (
    <div>
      <PageHeader title="Template Management" subtitle="Create, edit & preview message templates" icon={<FileText className="h-6 w-6" />} />

      <div className="flex items-center justify-between mb-4">
        <Tabs value={channelFilter} onValueChange={(v) => setChannelFilter(v as any)}>
          <TabsList>
            {CHANNELS.map((ch) => (
              <TabsTrigger key={ch.value} value={ch.value}>{ch.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={loadTemplates}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
          <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Template</Button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Loading templates...</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No templates found</CardContent></Card>
        ) : filtered.map((tpl) => (
          <Card key={tpl.id} className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{tpl.name}</p>
                    <Badge className={`text-[9px] ${CHANNEL_BADGE[tpl.type]}`}>{tpl.type}</Badge>
                    {tpl.code && <Badge className="text-[9px] bg-muted text-muted-foreground font-mono">{tpl.code}</Badge>}
                    {tpl.is_active === false && <Badge className="text-[9px] bg-destructive/15 text-destructive">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tpl.body}</p>
                  {tpl.variables.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Variables: {tpl.variables.map((v) => `{{${v}}}`).join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 ml-3 shrink-0">
                  <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7" onClick={() => openEdit(tpl.id)} title="Edit">
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7 text-destructive" onClick={() => handleDelete(tpl.id)} title="Delete">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={formState !== "closed"} onOpenChange={(open) => { if (!open) setFormState("closed"); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formState === "create" ? "New Template" : "Edit Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="tplName">Name</Label>
                <Input id="tplName" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Welcome SMS" />
              </div>
              <div>
                <Label className="text-xs" htmlFor="tplCode">Code</Label>
                <Input id="tplCode" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. welcome_sms" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="tplType">Channel</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as MessageType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.filter((c) => c.value !== "all").map((ch) => (
                      <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.type === "email" && (
                <div>
                  <Label className="text-xs" htmlFor="tplSubject">Subject</Label>
                  <Input id="tplSubject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Email subject line" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs" htmlFor="tplBody">Body</Label>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] rounded-lg" onClick={() => setShowPreview(!showPreview)}>
                  {showPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                  {showPreview ? "Hide Preview" : "Preview"}
                </Button>
              </div>
              <Textarea id="tplBody" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} placeholder="Hello {{studentName}}, your class {{className}} starts tomorrow!" />
            </div>

            {detectedVars.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border/40 text-xs space-y-2">
                <p className="font-medium text-muted-foreground">Detected Variables ({detectedVars.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {detectedVars.map((v) => (
                    <Badge key={v} className="font-mono text-[10px] bg-primary/10 text-primary border border-primary/20">{`{{${v}}}`}</Badge>
                  ))}
                </div>
                {showPreview && (
                  <div className="space-y-2 pt-1">
                    <p className="font-medium text-muted-foreground">Preview Values</p>
                    {detectedVars.map((v) => (
                      <div key={v} className="flex items-center gap-2">
                        <span className="w-24 text-muted-foreground shrink-0">{v}</span>
                        <Input size={1} className="h-7 text-xs" placeholder={`Value for ${v}`} value={previewVars[v] ?? ""} onChange={(e) => setPreviewVars({ ...previewVars, [v]: e.target.value })} />
                      </div>
                    ))}
                    <div className="p-2 rounded border border-border/40 bg-background mt-2 text-xs whitespace-pre-wrap">{previewBody || form.body}</div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormState("closed")}>Cancel</Button>
            <Button disabled={!form.name || !form.body} onClick={handleSave}>
              {formState === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
