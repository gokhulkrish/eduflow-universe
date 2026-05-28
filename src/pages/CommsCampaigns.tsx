import { useEffect, useState, useCallback } from "react";
import { Send, Plus, Play, XCircle, Clock, Users, Eye } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { getCampaigns, getCampaignById, getTemplates, createCampaign, updateCampaign, launchCampaign, cancelCampaign } from "../../core/comms/service";
import type { MessageCampaign, MessageTemplate, CampaignStatus } from "../../core/comms/service";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  queued: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  sending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  failed: "bg-destructive/15 text-destructive",
  partial: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

const AUDIENCE_PRESETS = [
  { label: "All Students", value: { type: "role", role: "student" } },
  { label: "All Staff", value: { type: "role", role: "staff" } },
  { label: "All Parents", value: { type: "role", role: "parent" } },
  { label: "All Teachers", value: { type: "role", role: "teacher" } },
  { label: "Entire Institution", value: { type: "all" } },
];

export default function CommsCampaigns() {
  const [campaigns, setCampaigns] = useState<MessageCampaign[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailCampaign, setDetailCampaign] = useState<MessageCampaign | null>(null);

  const [formName, setFormName] = useState("");
  const [formTemplateId, setFormTemplateId] = useState("");
  const [formAudience, setFormAudience] = useState<string>("all");
  const [formCustomAudience, setFormCustomAudience] = useState("");
  const [formSchedule, setFormSchedule] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [camps, tmpls] = await Promise.all([getCampaigns(), getTemplates()]);
      setCampaigns(camps);
      setTemplates(tmpls);
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setFormName("");
    setFormTemplateId("");
    setFormAudience("all");
    setFormCustomAudience("");
    setFormSchedule("");
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formName || !formTemplateId) { toast.error("Name and template are required"); return; }
    let audienceQuery: Record<string, any>;
    if (formAudience === "custom") {
      try { audienceQuery = JSON.parse(formCustomAudience || "{}"); } catch { toast.error("Invalid audience JSON"); return; }
    } else {
      audienceQuery = AUDIENCE_PRESETS.find((p) => p.label === formAudience)?.value ?? { type: "all" };
    }
    try {
      await createCampaign({
        name: formName,
        template_id: formTemplateId,
        audience_query: audienceQuery,
        scheduled_at: formSchedule || undefined,
      });
      toast.success("Campaign created");
      setDialogOpen(false);
      loadData();
    } catch (e: any) { toast.error(e?.message ?? "Failed to create campaign"); }
  };

  const handleLaunch = async (id: string) => {
    try { await launchCampaign(id); toast.success("Campaign launched"); loadData(); }
    catch { toast.error("Failed to launch campaign"); }
  };

  const handleCancel = async (id: string) => {
    try { await cancelCampaign(id); toast.success("Campaign cancelled"); loadData(); }
    catch { toast.error("Failed to cancel campaign"); }
  };

  const openDetail = async (id: string) => {
    const c = await getCampaignById(id);
    setDetailCampaign(c);
  };

  const filtered = statusFilter === "all"
    ? campaigns
    : campaigns.filter((c) => c.status === statusFilter);

  const selectedTemplate = templates.find((t) => t.id === formTemplateId);
  const audienceLabel = (aq: Record<string, any>) => {
    if (!aq) return "—";
    const found = AUDIENCE_PRESETS.find((p) => JSON.stringify(p.value) === JSON.stringify(aq));
    if (found) return found.label;
    return JSON.stringify(aq);
  };

  return (
    <div>
      <PageHeader title="Campaign Management" subtitle="Create, schedule & monitor message campaigns" icon={<Send className="h-6 w-6" />} />

      <div className="flex items-center justify-between mb-4">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="queued">Queued</TabsTrigger>
            <TabsTrigger value="sending">Sending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
            <TabsTrigger value="partial">Partial</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> New Campaign</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">Loading campaigns...</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No campaigns found</CardContent></Card>
        ) : filtered.map((c) => (
          <Card key={c.id} className="border-border/40 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(c.id)}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm">{c.name}</CardTitle>
                <Badge className={`text-[9px] ${STATUS_BADGE[c.status] ?? ""}`}>{c.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Badge className="text-[9px] bg-muted text-muted-foreground font-mono">{c.template_name ?? "—"}</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{audienceLabel(c.audience_query)}</span>
              </div>
              {c.scheduled_at && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(c.scheduled_at).toLocaleString()}</span>
                </div>
              )}
              <div className="flex gap-3 pt-1 text-muted-foreground">
                <span>Sent: {c.sent_count ?? 0}</span>
                <span>Failed: {c.fail_count ?? 0}</span>
              </div>
              <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                {c.status === "draft" && (
                  <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => handleLaunch(c.id)}>
                    <Play className="h-3 w-3 mr-1" />Launch
                  </Button>
                )}
                {(c.status === "draft" || c.status === "queued" || c.status === "sending") && (
                  <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => handleCancel(c.id)}>
                    <XCircle className="h-3 w-3 mr-1" />Cancel
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => openDetail(c.id)}>
                  <Eye className="h-3 w-3 mr-1" />Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Campaign</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs" htmlFor="campName">Campaign Name</Label>
              <Input id="campName" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Welcome Batch 2026" />
            </div>
            <div>
              <Label className="text-xs" htmlFor="campTemplate">Template</Label>
              <Select value={formTemplateId} onValueChange={setFormTemplateId}>
                <SelectTrigger><SelectValue placeholder="Select a template" /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name} ({t.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{selectedTemplate.body}</p>
              )}
            </div>
            <div>
              <Label className="text-xs" htmlFor="campAudience">Audience</Label>
              <Select value={formAudience} onValueChange={setFormAudience}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AUDIENCE_PRESETS.map((p) => (
                    <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
                  ))}
                  <SelectItem value="custom">Custom (JSON)</SelectItem>
                </SelectContent>
              </Select>
              {formAudience === "custom" && (
                <Textarea className="mt-2 h-20 text-xs font-mono" placeholder='{"type":"role","role":"student","class":"10A"}' value={formCustomAudience} onChange={(e) => setFormCustomAudience(e.target.value)} />
              )}
            </div>
            <div>
              <Label className="text-xs" htmlFor="campSchedule">Schedule (optional)</Label>
              <Input id="campSchedule" type="datetime-local" value={formSchedule} onChange={(e) => setFormSchedule(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button disabled={!formName || !formTemplateId} onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailCampaign} onOpenChange={(o) => { if (!o) setDetailCampaign(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Campaign Details</DialogTitle></DialogHeader>
          {detailCampaign && (
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{detailCampaign.name}</span></div>
              <div><span className="text-muted-foreground">Template:</span> <span className="font-medium">{detailCampaign.template_name ?? detailCampaign.template_id}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <Badge className={`text-[10px] ${STATUS_BADGE[detailCampaign.status] ?? ""}`}>{detailCampaign.status}</Badge></div>
              <div><span className="text-muted-foreground">Audience:</span> <span className="font-medium">{audienceLabel(detailCampaign.audience_query)}</span></div>
              {detailCampaign.scheduled_at && (
                <div><span className="text-muted-foreground">Scheduled:</span> <span className="font-medium">{new Date(detailCampaign.scheduled_at).toLocaleString()}</span></div>
              )}
              <div className="flex gap-4">
                <div><span className="text-muted-foreground">Sent:</span> <span className="font-medium text-emerald-600">{detailCampaign.sent_count ?? 0}</span></div>
                <div><span className="text-muted-foreground">Failed:</span> <span className="font-medium text-destructive">{detailCampaign.fail_count ?? 0}</span></div>
              </div>
              <div><span className="text-muted-foreground">Created:</span> <span>{new Date(detailCampaign.created_at).toLocaleString()}</span></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailCampaign(null)}>Close</Button>
            {detailCampaign?.status === "draft" && (
              <Button onClick={async () => { await handleLaunch(detailCampaign.id); setDetailCampaign(null); }}>Launch</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
