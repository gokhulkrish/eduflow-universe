import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, ExternalLink, X } from "lucide-react";
import type { RegistryAiState, ReviewQueueItem } from "@/lib/registry-ai-queue";
import type { HeaderRegistryDiagnosticIssue } from "@/lib/header-registry";

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  conflict: { label: 'Conflict', className: 'bg-destructive/10 text-destructive border border-destructive/30' },
  'low-confidence': { label: 'Low Confidence', className: 'bg-warning/10 text-warning border border-warning/30' },
  unmapped: { label: 'Unmapped', className: 'bg-muted text-muted-foreground border border-border/60' },
};

const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

function confidenceLevel(score: number): string {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

const COUNTER_CONFIG = [
  { key: 'reviewQueue' as const, label: 'Review Queue', color: 'bg-warning/10 text-warning border border-warning/30' },
  { key: 'unmapped' as const, label: 'Unmapped Headers', color: 'bg-destructive/10 text-destructive border border-destructive/30' },
  { key: 'conflicts' as const, label: 'Conflicts', color: 'bg-destructive/10 text-destructive border border-destructive/30' },
  { key: 'duplicates' as const, label: 'Duplicate Aliases', color: 'bg-warning/10 text-warning border border-warning/30' },
  { key: 'orphans' as const, label: 'Orphan Groups', color: 'bg-muted text-muted-foreground border border-border/60' },
  { key: 'warnings' as const, label: 'Profile Warnings', color: 'bg-warning/10 text-warning border border-warning/30' },
];

interface DiagnosticsCounts {
  reviewQueue: number;
  unmapped: number;
  conflicts: number;
  duplicates: number;
  orphans: number;
  warnings: number;
}

export interface RegistryDiagnosticsViewProps {
  aiState: RegistryAiState;
  structuralIssues?: HeaderRegistryDiagnosticIssue[];
  onApprove: (detectedHeader: string, fieldKey: string) => void;
  onReject: (detectedHeader: string, fieldKey: string) => void;
  onRebuild: () => void;
  onNavigateField?: (fieldId: string) => void;
  onNavigateGroup?: (groupKey: string) => void;
  onNavigateProfile?: (profileId: string) => void;
  onRefresh?: () => void;
}

export default function RegistryDiagnosticsView({
  aiState,
  structuralIssues = [],
  onApprove,
  onReject,
  onRebuild,
  onNavigateField,
  onNavigateGroup,
  onNavigateProfile,
  onRefresh,
}: RegistryDiagnosticsViewProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const counts: DiagnosticsCounts = useMemo(() => {
    const rq = aiState.reviewQueue.length;
    const un = aiState.reviewQueue.filter(i => i.type === 'unmapped').length;
    const cf = aiState.reviewQueue.filter(i => i.type === 'conflict').length;
    const structuralConflictCount = structuralIssues.filter(i => i.severity === 'critical').length;
    return {
      reviewQueue: rq,
      unmapped: un,
      conflicts: cf + structuralConflictCount,
      duplicates: structuralIssues.filter(i => i.id?.startsWith('duplicate-')).length,
      orphans: 0,
      warnings: structuralIssues.filter(i => i.severity === 'warning' && !i.id?.startsWith('duplicate-')).length,
    };
  }, [aiState, structuralIssues]);

  const total = counts.reviewQueue + counts.unmapped + counts.conflicts + counts.duplicates + counts.orphans + counts.warnings;
  const critical = counts.conflicts;
  const review = counts.reviewQueue;
  const resolved = Math.max(0, total - critical - review);

  function handleExport() {
    const items: { name: string; type: string }[] = [];
    for (const item of aiState.reviewQueue) {
      items.push({ name: item.detectedHeader, type: `${item.type} (${Math.round(item.confidence)}%)` });
    }
    for (const issue of structuralIssues) {
      items.push({ name: issue.title, type: issue.severity });
    }
    const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), total: items.length, items }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'registry-issues.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function handleRefresh() {
    onRefresh?.();
  }

  function handleDiagnosticAction(fieldId: string, view: string) {
    const w = window as any;
    w.registryContextState = { ...(w.registryContextState || {}), field: fieldId, view, module: w.registryContextState?.module || 'student' };
    window.dispatchEvent(new CustomEvent('sms:navigate-registry-tab', { detail: { tab: view, fieldId } }));
    onNavigateField?.(fieldId);
  }

  const panels = [
    { id: 'reviewQueue', label: 'Review Queue', count: counts.reviewQueue, color: 'bg-warning/10 text-warning' },
    { id: 'unmapped', label: 'Unmapped Headers', count: counts.unmapped, color: 'bg-destructive/10 text-destructive' },
    { id: 'conflicts', label: 'Conflicts', count: counts.conflicts, color: 'bg-destructive/10 text-destructive' },
    { id: 'duplicates', label: 'Duplicate Aliases', count: counts.duplicates, color: 'bg-warning/10 text-warning' },
    { id: 'orphans', label: 'Orphan Groups', count: counts.orphans, color: 'bg-muted text-muted-foreground' },
    { id: 'warnings', label: 'Profile Warnings', count: counts.warnings, color: 'bg-warning/10 text-warning' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Summary Bar */}
      <Card className="glass p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-muted-foreground">Registry Health</span>
            <Badge id="diagnosticTotalIssues" variant="secondary">Total: {total}</Badge>
            <Badge id="diagnosticCritical" variant="secondary" className="bg-destructive/10 text-destructive">Critical: {critical}</Badge>
            <Badge id="diagnosticReview" variant="secondary" className="bg-warning/10 text-warning">Needs Review: {review}</Badge>
            <Badge id="diagnosticResolved" variant="secondary" className="bg-success/10 text-success">Resolved: {resolved}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={handleExport}>
              <Download className="mr-1 h-3 w-3" /> Export Issues
            </Button>
            <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={handleRefresh}>
              <RefreshCw className="mr-1 h-3 w-3" /> Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Issue Counters */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {panels.map(p => (
          <button
            key={p.id}
            className={`rounded-xl border border-border/60 bg-card/60 p-3 text-left transition-colors hover:bg-muted/30 ${activePanel === p.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setActivePanel(activePanel === p.id ? null : p.id)}
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.label}</p>
            <p className={`mt-1 text-lg font-bold ${p.color.split(' ')[1] || 'text-foreground'}`}>{p.count}</p>
          </button>
        ))}
      </div>

      {/* Active Panel Content */}
      {activePanel && (
        <Card className="glass p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">{panels.find(p => p.id === activePanel)?.label || activePanel}</p>
            <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setActivePanel(null)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {activePanel === 'reviewQueue' && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {aiState.reviewQueue.length === 0 ? (
                <ReviewQueueEmpty />
              ) : (
                aiState.reviewQueue.map((item, idx) => (
                  <ReviewQueueCard
                    key={idx}
                    item={item}
                    onApprove={onApprove}
                    onReject={onReject}
                    onNavigateField={handleDiagnosticAction}
                  />
                ))
              )}
            </div>
          )}

          {activePanel === 'conflicts' && (
            <div id="conflictsList" className="space-y-2 max-h-96 overflow-y-auto">
              {aiState.reviewQueue.filter(i => i.type === 'conflict').map((item, idx) => (
                <DiagnosticIssueItem
                  key={idx}
                  name={item.detectedHeader}
                  reason="Multiple canonical candidates with similar scores"
                  fieldId={item.suggestions[0]?.field.key}
                  onNavigate={handleDiagnosticAction}
                />
              ))}
              {structuralIssues.filter(i => i.severity === 'critical').map((issue) => (
                <DiagnosticIssueItem
                  key={issue.id}
                  name={issue.title}
                  reason={issue.detail}
                  fieldId={issue.id || undefined}
                  onNavigate={handleDiagnosticAction}
                />
              ))}
              {aiState.reviewQueue.filter(i => i.type === 'conflict').length === 0 && structuralIssues.filter(i => i.severity === 'critical').length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">No conflicts detected.</p>
              )}
            </div>
          )}

          {activePanel === 'unmapped' && (
            <div id="unmappedList" className="space-y-2 max-h-96 overflow-y-auto">
              {aiState.reviewQueue.filter(i => i.type === 'unmapped').map((item, idx) => (
                <DiagnosticIssueItem
                  key={idx}
                  name={item.detectedHeader}
                  reason="No canonical field suggestion above minimum score"
                  onNavigate={handleDiagnosticAction}
                />
              ))}
              {aiState.reviewQueue.filter(i => i.type === 'unmapped').length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">All detected headers have suggestions above the minimum score.</p>
              )}
            </div>
          )}

          {activePanel === 'duplicates' && (
            <div id="duplicatesList" className="space-y-2 max-h-96 overflow-y-auto">
              {structuralIssues.filter(i => i.id?.startsWith('duplicate-')).map((issue) => (
                <DiagnosticIssueItem
                  key={issue.id}
                  name={issue.title}
                  reason={issue.detail}
                  onNavigate={handleDiagnosticAction}
                />
              ))}
              {structuralIssues.filter(i => i.id?.startsWith('duplicate-')).length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">No duplicate aliases found.</p>
              )}
            </div>
          )}

          {activePanel === 'orphans' && (
            <div id="orphansList" className="space-y-2 max-h-96 overflow-y-auto">
              <p className="py-8 text-center text-xs text-muted-foreground">No orphan groups detected.</p>
            </div>
          )}

          {activePanel === 'warnings' && (
            <div id="warningsList" className="space-y-2 max-h-96 overflow-y-auto">
              {structuralIssues.filter(i => i.severity === 'warning' && !i.id?.startsWith('duplicate-')).map((issue) => (
                <DiagnosticIssueItem
                  key={issue.id}
                  name={issue.title}
                  reason={issue.detail}
                  onNavigate={handleDiagnosticAction}
                />
              ))}
              {structuralIssues.filter(i => i.severity === 'warning' && !i.id?.startsWith('duplicate-')).length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">No warnings.</p>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Always-visible AI Mapping Review Queue Section */}
      <Card className="glass p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">AI Mapping Review Queue</p>
            <p className="text-xs text-muted-foreground">Fields and mappings that need manual review and resolution</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-destructive/10 text-destructive">
              Conflicts: {aiState.diagnostics.conflicts}
            </Badge>
            <Badge variant="secondary" className="bg-warning/10 text-warning">
              Low: {aiState.diagnostics.lowConfidence}
            </Badge>
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              Unmapped: {aiState.diagnostics.unmapped}
            </Badge>
            <Button size="sm" variant="outline" className="rounded-lg text-xs" onClick={onRebuild}>
              <RefreshCw className="mr-1 h-3 w-3" /> Rebuild
            </Button>
          </div>
        </div>

        <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
          {aiState.reviewQueue.length === 0 ? (
            <ReviewQueueEmpty />
          ) : (
            aiState.reviewQueue.map((item, idx) => (
              <ReviewQueueCard
                key={idx}
                item={item}
                onApprove={onApprove}
                onReject={onReject}
                onNavigateField={handleDiagnosticAction}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function ReviewQueueEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <p className="text-sm font-medium text-foreground">No items in review queue</p>
      <p className="mt-1 text-xs text-muted-foreground">All detected headers have confident mappings or have been resolved.</p>
    </div>
  );
}

function ReviewQueueCard({ item, onApprove, onReject, onNavigateField }: {
  item: ReviewQueueItem;
  onApprove: (detectedHeader: string, fieldKey: string) => void;
  onReject: (detectedHeader: string, fieldKey: string) => void;
  onNavigateField: (fieldId: string, view: string) => void;
}) {
  const [selectedSuggestion, setSelectedSuggestion] = useState(item.suggestions[0]?.field.key || '');
  const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.unmapped;
  const confLvl = confidenceLevel(item.confidence);
  const top = item.suggestions[0];

  return (
    <div className="review-queue-item flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className={`text-[10px] ${typeCfg.className}`}>
            {typeCfg.label}
          </Badge>
          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {CONFIDENCE_LABEL[confLvl] || 'Unknown'}
          </span>
          <span className="review-queue-header-name text-sm font-medium truncate">
            {item.detectedHeader}
          </span>
          <span className="text-xs text-muted-foreground">({Math.round(item.confidence)}%)</span>
        </div>

        {top && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Top suggestion:</span>
            <span
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground cursor-pointer hover:bg-muted/80"
              onClick={() => onNavigateField(top.field.key, 'mapping')}
            >
              {top.field.label} ({top.field.key}) — {Math.round(top.score)}
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </span>
          </div>
        )}

        {item.suggestions.length > 1 && (
          <div className="flex flex-wrap items-center gap-1">
            {item.suggestions.slice(1, 4).map((s) => (
              <span
                key={s.field.key}
                className="inline-flex rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground cursor-pointer hover:bg-muted/80"
                onClick={() => onNavigateField(s.field.key, 'mapping')}
              >
                {s.field.label} ({Math.round(s.score)})
              </span>
            ))}
            {item.suggestions.length > 4 && (
              <span className="text-[10px] text-muted-foreground">+{item.suggestions.length - 4} more</span>
            )}
          </div>
        )}

        {item.suggestions.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              className="h-7 rounded-md border border-border bg-background px-2 text-xs"
              value={selectedSuggestion}
              onChange={(e) => setSelectedSuggestion(e.target.value)}
            >
              {item.suggestions.map((s) => (
                <option key={s.field.key} value={s.field.key}>
                  {s.field.label} ({s.field.key}) — {Math.round(s.score)}
                </option>
              ))}
            </select>
            <button className="text-xs text-primary hover:underline" onClick={() => onApprove(item.detectedHeader, selectedSuggestion)}>
              Approve
            </button>
            <button
              className="text-xs text-primary hover:underline"
              onClick={() => onNavigateField(selectedSuggestion, 'mapping')}
            >
              Map Now
            </button>
          </div>
        )}
      </div>
      <button
        className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
        onClick={() => onReject(item.detectedHeader, selectedSuggestion || item.detectedHeader)}
      >
        Ignore
      </button>
    </div>
  );
}

function DiagnosticIssueItem({ name, reason, fieldId, groupKey, onNavigate }: {
  name: string;
  reason: string;
  fieldId?: string;
  groupKey?: string;
  onNavigate: (fieldId: string, view: string) => void;
}) {
  return (
    <div className="diagnostic-issue-item flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-card/60 p-3">
      <div className="min-w-0 flex-1">
        <p className="diagnostic-issue-name text-sm font-medium">{name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{reason}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {fieldId && (
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => onNavigate(fieldId, 'mapping')}
          >
            Open field
          </button>
        )}
        {groupKey && onNavigate && (
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => onNavigate(groupKey, 'groups')}
          >
            Open group
          </button>
        )}
      </div>
    </div>
  );
}
