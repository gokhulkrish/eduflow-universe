import { useEffect, useState } from "react";
import { AlertTriangle, Send, History, Radio, Users, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { sendEmergencyBroadcast, getEmergencyBroadcasts } from "../../core/comms/service";
import type { EmergencyBroadcast, MessageType } from "../../core/comms/service";

const ALL_CHANNELS: { value: MessageType; label: string }[] = [
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "push", label: "Push" },
  { value: "notice", label: "Notice" },
];

const AUDIENCE_PRESETS = [
  { label: "Entire Institution", value: { type: "all" } },
  { label: "All Students", value: { type: "role", role: "student" } },
  { label: "All Staff", value: { type: "role", role: "staff" } },
  { label: "All Parents", value: { type: "role", role: "parent" } },
  { label: "All Teachers", value: { type: "role", role: "teacher" } },
];

const CHANNEL_BADGE: Record<string, string> = {
  sms: "bg-blue-100 text-blue-700",
  email: "bg-purple-100 text-purple-700",
  push: "bg-amber-100 text-amber-700",
  notice: "bg-emerald-100 text-emerald-700",
};

export default function CommsEmergency() {
  const [tab, setTab] = useState("compose");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("Entire Institution");
  const [recipientCount, setRecipientCount] = useState(500);
  const [channels, setChannels] = useState<MessageType[]>(["sms", "email", "push", "notice"]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<EmergencyBroadcast[]>([]);

  useEffect(() => { setHistory(getEmergencyBroadcasts()); }, []);

  const toggleChannel = (ch: MessageType) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleSend = async () => {
    if (!title || !body) { toast.error("Title and body are required"); return; }
    if (channels.length === 0) { toast.error("Select at least one channel"); return; }
    setConfirmOpen(true);
  };

  const confirmSend = async () => {
    setSending(true);
    try {
      const audienceQuery = AUDIENCE_PRESETS.find((p) => p.label === audience)?.value ?? { type: "all" };
      const result = await sendEmergencyBroadcast({
        title, body, channels, audience_query: audienceQuery, recipient_count: recipientCount,
      });
      toast.success(`🚨 Emergency broadcast sent to ${recipientCount} recipients via ${channels.length} channels`);
      setHistory(getEmergencyBroadcasts());
      setTitle(""); setBody(""); setConfirmOpen(false);
    } catch (e: any) { toast.error(e?.message ?? "Failed to send"); }
    finally { setSending(false); }
  };

  return (
    <div>
      <PageHeader title="Emergency Broadcast" subtitle="Urgent alerts — sent across all channels simultaneously" icon={<Radio className="h-6 w-6" />} />

      <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>Emergency broadcasts bypass user notification preferences and are sent immediately to all selected channels. Use only for genuine emergencies.</span>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="compose"><Send className="h-3.5 w-3.5 mr-1" /> Compose Broadcast</TabsTrigger>
          <TabsTrigger value="history"><History className="h-3.5 w-3.5 mr-1" /> Broadcast History</TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <div className="max-w-2xl space-y-4">
            <Card className="border-destructive/30 border-2">
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label className="text-xs text-destructive font-semibold" htmlFor="emTitle">Alert Title</Label>
                  <Input id="emTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Campus Closure - Severe Weather Warning" className="border-destructive/30" />
                </div>
                <div>
                  <Label className="text-xs text-destructive font-semibold" htmlFor="emBody">Alert Message</Label>
                  <Textarea id="emBody" value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Provide clear instructions and essential details..." className="border-destructive/30" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs" htmlFor="emAudience">Target Audience</Label>
                    <Select value={audience} onValueChange={setAudience}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {AUDIENCE_PRESETS.map((p) => (
                          <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs" htmlFor="emCount">Estimated Recipients</Label>
                    <Input id="emCount" type="number" min={1} max={100000} value={recipientCount} onChange={(e) => setRecipientCount(Number(e.target.value))} />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Broadcast Channels</Label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {ALL_CHANNELS.map((ch) => (
                      <label key={ch.value} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer text-xs transition-colors ${channels.includes(ch.value) ? "bg-destructive/10 border-destructive/30 text-destructive font-medium" : "bg-muted/30 border-border/40 text-muted-foreground"}`}>
                        <Switch checked={channels.includes(ch.value)} onCheckedChange={() => toggleChannel(ch.value)} className="h-3.5 w-6" />
                        {ch.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>Broadcasting to <strong>{audience}</strong> — <strong>{recipientCount}</strong> people via <strong>{channels.length}</strong> channel(s)</span>
                </div>

                <Button className="w-full rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-glow" disabled={!title || !body || channels.length === 0} onClick={handleSend}>
                  <AlertTriangle className="h-4 w-4 mr-2" /> Send Emergency Broadcast
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-3">
            {history.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No emergency broadcasts sent yet</CardContent></Card>
            ) : history.map((b, i) => (
              <Card key={b.id ?? i} className="border-destructive/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                        <p className="text-sm font-medium">{b.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.body}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {b.channels.map((ch) => (
                          <Badge key={ch} className={`text-[9px] ${CHANNEL_BADGE[ch] ?? ""}`}>{ch}</Badge>
                        ))}
                        <Badge className="text-[9px] bg-muted text-muted-foreground">{b.audience}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          <Users className="h-3 w-3 inline mr-0.5" />{b.recipient_count}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{new Date(b.sent_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm border-destructive/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Confirm Emergency Broadcast
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>This will send an urgent alert to <strong>{recipientCount}</strong> recipients ({audience}) via:</p>
            <div className="flex gap-1.5">
              {channels.map((ch) => (
                <Badge key={ch} className={`text-[10px] ${CHANNEL_BADGE[ch] ?? ""}`}>{ch.toUpperCase()}</Badge>
              ))}
            </div>
            <div className="p-2 rounded bg-muted/50 text-xs mt-2">
              <p className="font-medium">{title}</p>
              <p className="text-muted-foreground mt-1 line-clamp-3">{body}</p>
            </div>
            <p className="text-xs text-destructive font-medium mt-2">This action cannot be undone. All selected recipients will be notified immediately.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={sending}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button variant="destructive" onClick={confirmSend} disabled={sending}>
              <CheckCircle2 className="h-4 w-4 mr-1" /> {sending ? "Sending..." : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
