import { useState, useMemo } from "react";
import { MessageSquare, Send, Users, Type } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { sendBulkMessage } from "../../core/comms/service";
import type { MessageType } from "../../core/comms/service";

const CHANNELS: { value: MessageType; label: string; maxChars?: number }[] = [
  { value: "sms", label: "SMS", maxChars: 160 },
  { value: "email", label: "Email" },
  { value: "push", label: "Push Notification", maxChars: 500 },
  { value: "notice", label: "Notice", maxChars: 2000 },
];

const AUDIENCE_PRESETS = [
  { label: "All Students", value: { type: "role", role: "student" } },
  { label: "All Staff", value: { type: "role", role: "staff" } },
  { label: "All Parents", value: { type: "role", role: "parent" } },
  { label: "All Teachers", value: { type: "role", role: "teacher" } },
  { label: "Entire Institution", value: { type: "all" } },
];

export default function CommsBulkComposer() {
  const [channel, setChannel] = useState<MessageType>("sms");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<string>("All Students");
  const [customAudience, setCustomAudience] = useState("");
  const [recipientCount, setRecipientCount] = useState(50);
  const [sending, setSending] = useState(false);

  const maxChars = CHANNELS.find((c) => c.value === channel)?.maxChars;
  const charCount = body.length;
  const overLimit = maxChars ? charCount > maxChars : false;

  const detectedVars = useMemo(() => {
    const matches = body.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
  }, [body]);

  const handleSend = async () => {
    if (!body) { toast.error("Message body is required"); return; }
    if (overLimit) { toast.error(`Exceeds ${maxChars} character limit for ${channel.toUpperCase()}`); return; }
    setSending(true);
    try {
      let audienceQuery: Record<string, any>;
      if (audience === "Custom") {
        try { audienceQuery = JSON.parse(customAudience || "{}"); } catch { toast.error("Invalid audience JSON"); return; }
      } else {
        audienceQuery = AUDIENCE_PRESETS.find((p) => p.label === audience)?.value ?? { type: "all" };
      }
      await sendBulkMessage({
        name: `Bulk ${channel.toUpperCase()} - ${new Date().toLocaleDateString()}`,
        channel,
        body,
        subject: channel === "email" ? subject : undefined,
        audience_query: audienceQuery,
        recipient_count: recipientCount,
      });
      toast.success(`Message sent to ${recipientCount} recipients`);
      setBody("");
      setSubject("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Bulk Message Composer" subtitle="Send one-shot messages across channels" icon={<MessageSquare className="h-6 w-6" />} />

      <div className="max-w-2xl space-y-4">
        <Card className="border-border/40">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="bulkChannel">Channel</Label>
                <Select value={channel} onValueChange={(v) => { setChannel(v as MessageType); setSubject(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((ch) => (
                      <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs" htmlFor="bulkAudience">Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_PRESETS.map((p) => (
                      <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
                    ))}
                    <SelectItem value="Custom">Custom (JSON)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {audience === "Custom" && (
              <div>
                <Label className="text-xs">Audience Query (JSON)</Label>
                <Textarea className="mt-1 h-20 text-xs font-mono" placeholder='{"type":"role","role":"student","class":"10A"}' value={customAudience} onChange={(e) => setCustomAudience(e.target.value)} />
              </div>
            )}

            <div>
              <Label className="text-xs" htmlFor="bulkCount">Recipient Count</Label>
              <Input id="bulkCount" type="number" min={1} max={10000} value={recipientCount} onChange={(e) => setRecipientCount(Number(e.target.value))} />
            </div>

            {channel === "email" && (
              <div>
                <Label className="text-xs" htmlFor="bulkSubject">Subject</Label>
                <Input id="bulkSubject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject line" />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs" htmlFor="bulkBody">Message Body</Label>
                <div className="flex items-center gap-2">
                  {maxChars && (
                    <Badge className={`text-[10px] ${overLimit ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>
                      <Type className="h-3 w-3 mr-1" />{charCount}/{maxChars}
                    </Badge>
                  )}
                </div>
              </div>
              <Textarea id="bulkBody" value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder={channel === "email" ? "Write your email body here... Use {{variable}} for placeholders" : "Type your message here... Use {{variable}} for placeholders"} />
            </div>

            {detectedVars.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Detected variables: {detectedVars.map((v) => <Badge key={v} className="font-mono text-[10px] mx-0.5 bg-primary/10 text-primary border border-primary/20">{`{{${v}}}`}</Badge>)}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-border/40">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Sending <strong>{channel.toUpperCase()}</strong> to <strong>{recipientCount}</strong> recipients
              </span>
            </div>

            <Button className="w-full rounded-xl bg-gradient-primary shadow-glow" disabled={!body || overLimit || sending} onClick={handleSend}>
              <Send className="h-4 w-4 mr-2" />{sending ? "Sending..." : `Send to ${recipientCount} Recipients`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
