import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Plus, Trash2, Send, BarChart3, GripVertical, Download, Upload } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export";
import { useNavigate } from "react-router-dom";
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
import { getFeedbacks, createFeedback, updateFeedback, deleteFeedback, FeedbackForm } from "@/lib/comms-feedback";
import { generateId } from "@/lib/utils";

type QuestionType = "text" | "rating" | "choice";
interface Question { id: string; type: QuestionType; label: string; options: string[]; required: boolean; }

const AUDIENCE_PRESETS = ["All Students", "All Staff", "All Parents", "All Teachers", "Entire Institution"];

export default function CommsFeedback() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedbackForm[]>([]);
  const refresh = useCallback(async () => { setItems(await getFeedbacks()); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useRealtime("comms_feedback", refresh);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audience, setAudience] = useState("All Students");
  const [channel, setChannel] = useState("email");
  const [status, setStatus] = useState<FeedbackForm["status"]>("draft");
  const [questions, setQuestions] = useState<any[]>([]);

  const addQuestion = (type: QuestionType) => {
    setQuestions([...questions, {
      id: generateId(),
      type,
      label: "",
      options: type === "choice" ? ["Option 1"] : [],
      required: true,
    }]);
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map((q) => q.id === id ? { ...q, [field]: value } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const addOption = (qId: string) => {
    setQuestions(questions.map((q) =>
      q.id === qId ? { ...q, options: [...q.options, `Option ${q.options.length + 1}`] } : q
    ));
  };

  const updateOption = (qId: string, oi: number, value: string) => {
    setQuestions(questions.map((q) =>
      q.id === qId ? { ...q, options: q.options.map((o, i) => i === oi ? value : o) } : q
    ));
  };

  const removeOption = (qId: string, oi: number) => {
    setQuestions(questions.map((q) =>
      q.id === qId ? { ...q, options: q.options.filter((_, i) => i !== oi) } : q
    ));
  };

  const openCreate = () => {
    setEditingId(null);
    setTitle(""); setDescription(""); setAudience("All Students");
    setChannel("email"); setStatus("draft"); setQuestions([]);
    setOpen(true);
  };

  const openEdit = (f: FeedbackForm) => {
    setEditingId(f.id);
    setTitle(f.title); setDescription(f.description);
    setAudience(f.audience); setChannel(f.channel);
    setStatus(f.status); setQuestions(f.questions);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!title) { toast.error("Title is required"); return; }
    if (questions.length === 0) { toast.error("Add at least one question"); return; }
    if (questions.some((q) => !q.label)) { toast.error("All questions need a label"); return; }
    if (editingId) {
      await updateFeedback(editingId, { title, description, questions, audience, channel, status });
      toast.success("Form updated");
    } else {
      await createFeedback({ title, description, questions, audience, channel, status });
      toast.success("Form created");
    }
    setOpen(false);
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteFeedback(id);
    refresh();
    toast.success("Form deleted");
  };

  const handleSend = async (id: string) => {
    await updateFeedback(id, { status: "published" });
    refresh();
    toast.success("Form published and sent to audience");
  };

  return (
    <div>
      <PageHeader title="Feedback Forms" subtitle="Create surveys & feedback campaigns" icon={<ClipboardCheck className="h-6 w-6" />} />

      <div className="flex justify-end gap-2 mb-4">
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/import?module=comms-feedback")}><Upload className="h-4 w-4 mr-1" /> Import</Button>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportToCsv(items, "feedback-forms", [{key:"title",label:"Title"},{key:"description",label:"Description"},{key:"audience",label:"Audience"},{key:"channel",label:"Channel"},{key:"status",label:"Status"},{key:"responseCount",label:"Responses"}])}><Download className="h-4 w-4 mr-1" /> Export</Button>
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> New Feedback Form
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && (
          <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No feedback forms created</CardContent></Card>
        )}
        {items.map((f) => (
          <Card key={f.id} className="border-border/40 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(f)}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm">{f.title}</CardTitle>
                <div className="flex items-center gap-1">
                  <Badge className={`text-[9px] ${f.status === "published" ? "bg-success/15 text-success" : f.status === "closed" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>{f.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p className="text-muted-foreground line-clamp-2">{f.description || "No description"}</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{f.questions.length} question(s)</span>
                <span>·</span>
                <span>{f.audience}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="text-[9px] bg-muted text-muted-foreground">{f.channel}</Badge>
                <span className="text-muted-foreground">{f.responseCount} response(s)</span>
              </div>
              <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                {f.status === "draft" && (
                  <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => handleSend(f.id)}>
                    <Send className="h-3 w-3 mr-1" /> Publish & Send
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => setDeleteId(f.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Form</AlertDialogTitle><AlertDialogDescription>This will permanently remove this feedback form. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (deleteId) { await deleteFeedback(deleteId); refresh(); toast.success("Deleted"); } setDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{editingId ? "Edit Form" : "New Feedback Form"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            <div>
              <Label className="text-xs" htmlFor="fbTitle">Title</Label>
              <Input id="fbTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Course Feedback Q1 2026" />
            </div>
            <div>
              <Label className="text-xs" htmlFor="fbDesc">Description</Label>
              <Textarea id="fbDesc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional description or instructions" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_PRESETS.map((a) => (<SelectItem key={a} value={a}>{a}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Channel</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="notice">Notice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t border-border/40 pt-3">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium">Questions</Label>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => addQuestion("text")}>+ Text</Button>
                  <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => addQuestion("rating")}>+ Rating</Button>
                  <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => addQuestion("choice")}>+ Choice</Button>
                </div>
              </div>
              {questions.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">No questions yet. Add a question above.</p>
              )}
              {questions.map((q, qi) => (
                <Card key={q.id} className="mb-2 border-border/40">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <Badge className="text-[9px] bg-muted text-muted-foreground">{q.type}</Badge>
                      <span className="text-[10px] text-muted-foreground">Q{qi + 1}</span>
                      <div className="flex-1" />
                      <Switch checked={q.required} onCheckedChange={(v) => updateQuestion(q.id, "required", v)} />
                      <Label className="text-[10px]">Required</Label>
                      <Button variant="ghost" size="sm" className="rounded-lg h-6 w-6 text-destructive" onClick={() => removeQuestion(q.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input size={1} placeholder="Question text" value={q.label} onChange={(e) => updateQuestion(q.id, "label", e.target.value)} className="h-8 text-xs" />
                    {q.type === "choice" && (
                      <div className="space-y-1 pl-5">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-1">
                            <Input size={1} value={opt} onChange={(e) => updateOption(q.id, oi, e.target.value)} className="h-7 text-xs flex-1" />
                            <Button variant="ghost" size="sm" className="rounded-lg h-6 w-6 text-destructive" onClick={() => removeOption(q.id, oi)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" className="rounded-lg h-6 text-[10px]" onClick={() => addOption(q.id)}>+ Add Option</Button>
                      </div>
                    )}
                    {q.type === "rating" && (
                      <p className="text-[10px] text-muted-foreground pl-5">Rating: 1-5 scale (survey default)</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!title || questions.length === 0} onClick={handleSave}>
              <ClipboardCheck className="h-4 w-4 mr-1" /> {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
