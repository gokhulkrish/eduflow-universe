import { useState, useRef, useEffect } from "react";
import { MessagesSquare, Send, Plus, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getThreads, getMessages, sendMessage, markThreadRead, createThread } from "@/lib/chat";

export default function Chat() {
  const qc = useQueryClient();
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [msgText, setMsgText] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const msgEnd = useRef<HTMLDivElement>(null);

  const { data: threads } = useQuery({ queryKey: ["chat-threads"], queryFn: getThreads });
  const { data: messages } = useQuery({ queryKey: ["chat-msgs", activeThread], queryFn: () => getMessages(activeThread!), enabled: !!activeThread });

  useEffect(() => { if (activeThread) markThreadRead(activeThread).then(() => qc.invalidateQueries({ queryKey: ["chat-threads"] })); }, [activeThread]);
  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMut = useMutation({
    mutationFn: () => sendMessage(activeThread!, msgText),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["chat-msgs", activeThread] }); qc.invalidateQueries({ queryKey: ["chat-threads"] }); setMsgText(""); },
    onError: (e) => toast.error(e.message),
  });

  const createMut = useMutation({
    mutationFn: () => createThread(newTitle, "channel", []),
    onSuccess: (t) => { qc.invalidateQueries({ queryKey: ["chat-threads"] }); setActiveThread(t.id); setCreateOpen(false); toast.success("Thread created"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Chat Rooms" subtitle="Real-time messaging" icon={<MessagesSquare className="h-6 w-6" />} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
        <Card className="md:col-span-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Threads</CardTitle>
            <Button variant="outline" size="sm" className="rounded-lg h-7 w-7" onClick={() => { setNewTitle(""); setCreateOpen(true); }}><Plus className="h-3 w-3" /></Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2">
            {(threads ?? []).map((t) => (
              <button key={t.id} className={`w-full text-left p-2.5 rounded-lg text-sm mb-1 transition-colors ${activeThread === t.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50 border border-transparent"}`} onClick={() => setActiveThread(t.id)}>
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{t.title}</span>
                  {(t.unread ?? 0) > 0 && <Badge className="text-[9px] h-4 min-w-4 px-1 ml-1">{t.unread}</Badge>}
                </div>
                {t.last_message && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{t.last_message}</p>}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 overflow-hidden flex flex-col">
          {!activeThread ? (
            <CardContent className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Select a thread</CardContent>
          ) : (
            <>
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-sm">{threads?.find((t) => t.id === activeThread)?.title}</CardTitle>
              </CardHeader>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {(messages ?? []).map((m) => (
                    <div key={m.id} className="flex gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-medium text-primary">{m.sender_name?.[0] ?? "?"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{m.sender_name}</span>
                          <span className="text-[9px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm mt-0.5">{m.message}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={msgEnd} />
                </div>
              </ScrollArea>
              <div className="p-3 border-t flex gap-2">
                <Input value={msgText} onChange={(e) => setMsgText(e.target.value)} placeholder="Type a message..." onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && msgText.trim() && sendMut.mutate()} />
                <Button size="icon" className="rounded-xl shrink-0" onClick={() => sendMut.mutate()} disabled={!msgText.trim() || sendMut.isPending}>
                  {sendMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Thread</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Thread Name</Label><Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. B.Com Sem 4 - Finance" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate()} disabled={!newTitle || createMut.isPending}>{createMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
