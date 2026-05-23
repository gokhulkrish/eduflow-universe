import { Sparkles, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStudentRiskInsights, getSmartSuggestions } from "@/lib/ai";

const severityStyles: Record<string, string> = { high: "bg-destructive/15 text-destructive border-destructive/30", medium: "bg-warning/15 text-warning border-warning/30", info: "bg-info/15 text-info border-info/30" };
const typeIcons: Record<string, any> = { risk: AlertTriangle, insight: Lightbulb };

export default function AI() {
  const { data: insights } = useQuery({ queryKey: ["ai-insights"], queryFn: getStudentRiskInsights });
  const { data: suggestions } = useQuery({ queryKey: ["ai-suggestions"], queryFn: getSmartSuggestions });

  return (
    <div>
      <PageHeader title="AI Assistant" subtitle="Insights, risk detection & suggestions" icon={<Sparkles className="h-6 w-6" />} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Risk Detection & Insights</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(insights ?? []).map((ins) => {
              const Icon = typeIcons[ins.type] ?? Sparkles;
              return (
                <div key={ins.id} className={`rounded-lg border p-3 ${severityStyles[ins.severity] ?? ""}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2"><p className="text-sm font-medium">{ins.title}</p><Badge className="text-[9px]">{ins.severity}</Badge></div>
                      <p className="text-xs text-muted-foreground mt-0.5">{ins.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Smart Suggestions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {(suggestions ?? []).map((s, i) => (
              <div key={i} className="rounded-lg border border-border/40 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-lg h-7 text-[10px] shrink-0">{s.action} <ArrowRight className="h-3 w-3 ml-1" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
