import { useState } from "react";
import { BarChart3, Send, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEvaluateObservation, useBatchEvaluate } from "@/hooks/useScoring";
import { useMonitoringOverview } from "@/hooks/useMonitoring";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ScoringWorkspace() {
  const [tab, setTab] = useState("evaluate");
  const [studentId, setStudentId] = useState("");
  const [observationText, setObservationText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [batchText, setBatchText] = useState("");
  const [batchResults, setBatchResults] = useState<any[]>([]);

  const evaluateObs = useEvaluateObservation();
  const batchEval = useBatchEvaluate();
  const { data: overview } = useMonitoringOverview({});

  const handleEvaluate = async () => {
    if (!observationText.trim()) { toast.error("Enter observation text"); return; }
    const score = await evaluateObs.mutateAsync({
      studentId: studentId || "unknown",
      teacherId: "current-user",
      text: observationText,
      date: new Date().toISOString().split("T")[0],
    });
    setResult(score);
    toast.success(`Score: ${score.score}/10 (Composite: ${score.compositeIndex})`);
  };

  const handleBatchEvaluate = async () => {
    if (!batchText.trim()) { toast.error("Enter observations"); return; }
    const lines = batchText.split("\n").filter((l) => l.trim());
    const events = lines.map((line, i) => ({
      studentId: `batch-${i}`,
      teacherId: "current-user",
      text: line,
      date: new Date().toISOString().split("T")[0],
    }));
    const scores = await batchEval.mutateAsync(events);
    setBatchResults(scores);
    toast.success(`Evaluated ${scores.length} observations`);
  };

  const scoreColor = (s: number) => {
    if (s >= 8) return "text-success";
    if (s >= 6) return "text-warning";
    return "text-destructive";
  };

  return (
    <div>
      <PageHeader title="Scoring Workspace" subtitle="Subjective observation to standardized scores" icon={<BarChart3 className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="evaluate">Single Evaluation</TabsTrigger>
          <TabsTrigger value="batch">Batch</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="evaluate">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Observation Input</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label className="text-xs">Student ID (optional)</Label><Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="s-001" className="h-8 text-xs" /></div>
                <div><Label className="text-xs">Observation Text</Label><Textarea value={observationText} onChange={(e) => setObservationText(e.target.value)} placeholder="Describe student behavior, participation, and effort..." className="min-h-[120px] text-xs" /></div>
                <Button onClick={handleEvaluate} disabled={evaluateObs.isPending || !observationText.trim()} size="sm"><Send className="h-3 w-3 mr-1" />Evaluate</Button>
              </CardContent>
            </Card>

            {result && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Score Result</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <p className="text-4xl font-bold" style={{ color: result.score >= 7 ? "#22c55e" : result.score >= 5 ? "#eab308" : "#ef4444" }}>{result.score}</p>
                    <p className="text-xs text-muted-foreground">Composite Index: {result.compositeIndex}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(result.breakdown).map(([dim, score]) => (
                      <div key={dim} className="border rounded-lg p-2 text-center">
                        <p className="text-[10px] text-muted-foreground capitalize">{dim.replace(/([A-Z])/g, " $1")}</p>
                        <p className={`text-lg font-semibold ${scoreColor(score as number)}`}>{score as number}</p>
                        <p className="text-[9px] text-muted-foreground">{result.dimensions[dim as keyof typeof result.dimensions]?.level}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1">Matched Keywords</p>
                    {Object.entries(result.matchedKeywords).map(([dim, keywords]) =>
                      (keywords as string[]).length > 0 ? (
                        <div key={dim} className="flex gap-1 flex-wrap mb-1">
                          <span className="text-[9px] text-muted-foreground capitalize">{dim}:</span>
                          {(keywords as string[]).map((kw, i) => <Badge key={i} className="text-[8px] bg-muted text-muted-foreground">{kw}</Badge>)}
                        </div>
                      ) : null
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="batch">
          <Card>
            <CardHeader><CardTitle className="text-sm">Batch Observation Evaluation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label className="text-xs">One observation per line</Label><Textarea value={batchText} onChange={(e) => setBatchText(e.target.value)} placeholder={`Student is very participative and completes homework on time\nStudent is disruptive in class and needs improvement\nStudent shows good behavior but needs to participate more`} className="min-h-[150px] text-xs" /></div>
              <Button onClick={handleBatchEvaluate} disabled={batchEval.isPending || !batchText.trim()} size="sm"><UserCheck className="h-3 w-3 mr-1" />Evaluate All</Button>
              {batchResults.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead className="text-xs">#</TableHead><TableHead className="text-xs">Score</TableHead><TableHead className="text-xs">Composite</TableHead><TableHead className="text-xs">Phrases</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchResults.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{i + 1}</TableCell>
                        <TableCell><span className={`text-xs font-medium ${scoreColor(r.score)}`}>{r.score}/10</span></TableCell>
                        <TableCell className="text-xs">{r.compositeIndex}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.phrases.length} phrases</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader><CardTitle className="text-sm">Student Scores Overview</CardTitle></CardHeader>
            <CardContent>
              {overview?.rows && overview.rows.filter((r: any) => r.subjective_score !== null).length === 0 && (
                <p className="text-xs text-muted-foreground py-8 text-center">No scored observations yet. Use the evaluation tab to score students.</p>
              )}
              {overview?.rows && overview.rows.filter((r: any) => r.subjective_score !== null).length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Score</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.rows.filter((r: any) => r.subjective_score !== null).map((row: any) => (
                      <TableRow key={row.student_id}>
                        <TableCell className="text-xs">{row.display_name}</TableCell>
                        <TableCell><span className={`text-xs font-medium ${scoreColor(row.subjective_score)}`}>{row.subjective_score}/10</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
