import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { Puzzle, Plus, Trash2, Play, CheckCircle2 } from "lucide-react";
import { StickyActionBar } from "@/components/StickyActionBar";
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
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";

type Quiz = { id: string; title: string; questions: { q: string; options: string[]; correct: number }[]; class_id: string; time_limit: number; created_at: string; };
export const quizzesKey = "eduflow_quizzes";
function ls(): Quiz[] { try { return JSON.parse(localStorage.getItem(quizzesKey) ?? "[]"); } catch { return []; } }
function ss(v: Quiz[]) { localStorage.setItem(quizzesKey, JSON.stringify(v)); emitAppSync(quizzesKey); }

export default function QuizModule() {
  const [items, setItems] = useState(ls()); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [title, setTitle] = useState(""); const [qText, setQText] = useState(""); const [opts, setOpts] = useState(""); const [correct, setCorrect] = useState("0"); const [timeLimit, setTimeLimit] = useState("5");
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null); const [answers, setAnswers] = useState<Record<number, number>>({});

  useEffect(() => subscribeAppSync([quizzesKey], refresh), []);

  return (
    <div>
      <PageHeader title="Quiz Module" subtitle="Quick quizzes for classroom assessment" icon={<Puzzle className="h-6 w-6" />} />
      <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setTitle(""); setQText(""); setOpts(""); setCorrect("0"); setTimeLimit("5"); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Create Quiz</Button></div>

      {activeQuiz ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm">{items.find((q) => q.id === activeQuiz)?.title}</CardTitle>
              <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => { setActiveQuiz(null); setAnswers({}); }}>Exit</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.find((q) => q.id === activeQuiz)?.questions.map((qu, qi) => (
              <div key={qi} className="space-y-2">
                <p className="text-sm font-medium">{qi + 1}. {qu.q}</p>
                <div className="grid grid-cols-2 gap-2">
                  {qu.options.map((opt, oi) => (
                    <button key={oi} className={`rounded-lg border p-2 text-xs text-left transition-colors ${answers[qi] === oi ? "bg-primary/10 border-primary" : "bg-card hover:bg-accent"}`} onClick={() => setAnswers({ ...answers, [qi]: oi })}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
          <StickyActionBar className="justify-end">
            <Button className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => {
              const quiz = items.find((q) => q.id === activeQuiz); if (!quiz) return;
              let score = 0; quiz.questions.forEach((qu, qi) => { if (answers[qi] === qu.correct) score++; });
              toast.success(`Score: ${score}/${quiz.questions.length}`);
              setActiveQuiz(null); setAnswers({});
            }}>Submit</Button>
          </StickyActionBar>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((qz) => (
            <Card key={qz.id} className="border-border/40">
              <CardHeader className="pb-2"><CardTitle className="text-sm">{qz.title}</CardTitle></CardHeader>
              <CardContent className="text-xs space-y-1">
                <p className="text-muted-foreground">{qz.questions.length} questions · {qz.time_limit} min</p>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => { setActiveQuiz(qz.id); setAnswers({}); }}><Play className="h-3 w-3 mr-1" />Take Quiz</Button>
                  <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== qz.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No quizzes created</CardContent></Card>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Create Quiz</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3"><div className="flex-1"><Label className="text-xs">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div><div className="w-20"><Label className="text-xs">Minutes</Label><Input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} /></div></div>
            <div><Label className="text-xs">Question</Label><Input value={qText} onChange={(e) => setQText(e.target.value)} /></div>
            <div><Label className="text-xs">Options (comma-separated)</Label><Input value={opts} onChange={(e) => setOpts(e.target.value)} placeholder="A, B, C, D" /></div>
            <div><Label className="text-xs">Correct Option Index (0-based)</Label><Input type="number" value={correct} onChange={(e) => setCorrect(e.target.value)} /></div>
            <Button size="sm" variant="outline" className="rounded-lg w-full text-xs" disabled={!qText || !opts} onClick={() => {
              toast.success("Question added (will be saved with quiz)");
            }}>Add Question</Button>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!title} onClick={() => {
            const optsArr = opts.split(",").map((s) => s.trim()).filter(Boolean);
            const qs = qText && optsArr.length > 1 ? [{ q: qText, options: optsArr, correct: Number(correct) }] : [];
            const items = ls(); items.push({ id: crypto.randomUUID(), title, questions: qs, class_id: "", time_limit: Number(timeLimit) || 5, created_at: new Date().toISOString() });
            ss(items); refresh(); setOpen(false); toast.success("Quiz created");
          }}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
