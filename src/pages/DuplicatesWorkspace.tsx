import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GitCompare, Search, Filter, CheckCircle2, XCircle, Eye, ExternalLink, GitMerge } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "@/hooks/usePagination";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  loadDuplicateIssues,
  updateDuplicateIssue,
} from "@/lib/duplicate-issues-store";
import { subscribeAppSync } from "@/lib/app-sync";
import { resolveDuplicateFeedbackLoop } from "@/lib/student-workspace-messaging";
import DuplicateMergeWizard from "@/components/DuplicateMergeWizard";
import { duplicateIssueStage } from "@/lib/student-import";
import type { DuplicateIssue } from "@/lib/student-import";

const PAGE_SIZE = 10;

function batchNameOptions(issues: DuplicateIssue[]): string[] {
  const names = new Set(issues.map((i) => i.batchName));
  return Array.from(names).sort();
}

export default function DuplicatesWorkspace() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<DuplicateIssue[]>([]);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [mergeIssue, setMergeIssue] = useState<DuplicateIssue | null>(null);

  const refresh = () => setIssues(loadDuplicateIssues());

  useEffect(() => {
    refresh();
    return subscribeAppSync(["sms.duplicate-issues.v1"], refresh);
  }, []);

  const sourceOptions = useMemo(() => {
    const set = new Set(issues.map((i) => i.source));
    return Array.from(set).sort();
  }, [issues]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const issue of issues) {
      const stage = duplicateIssueStage(issue);
      counts[stage] = (counts[stage] ?? 0) + 1;
    }
    return counts;
  }, [issues]);

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      if (stageFilter !== "all" && duplicateIssueStage(issue) !== stageFilter) return false;
      if (sourceFilter !== "all" && issue.source !== sourceFilter) return false;
      if (batchFilter !== "all" && issue.batchName !== batchFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchLabel = issue.newRowLabel.toLowerCase().includes(q);
        const matchExisting = issue.existingRecordLabel?.toLowerCase().includes(q) ?? false;
        const matchKey = issue.identityKey.toLowerCase().includes(q);
        if (!matchLabel && !matchExisting && !matchKey) return false;
      }
      return true;
    });
  }, [issues, stageFilter, sourceFilter, batchFilter, searchQuery]);

  const pagination = usePagination({ data: filtered, pageSize: PAGE_SIZE });

  const counts = useMemo(() => {
    const pending = issues.filter((i) => i.resolution === "pending").length;
    const resolved = issues.filter((i) => i.resolution === "resolved").length;
    const ignored = issues.filter((i) => i.resolution === "ignored").length;
    const detected = issues.filter((i) => duplicateIssueStage(i) === "detected").length;
    return { total: issues.length, pending, resolved, ignored, detected };
  }, [issues]);

  const handleResolve = (id: string) => {
    const updated = updateDuplicateIssue(id, { resolution: "resolved" });
    setIssues(updated);
    resolveDuplicateFeedbackLoop();
    toast.success("Marked as resolved");
  };

  const handleIgnore = (id: string) => {
    const updated = updateDuplicateIssue(id, { resolution: "ignored" });
    setIssues(updated);
    resolveDuplicateFeedbackLoop();
    toast.success("Ignored");
  };

  return (
    <div>
      <PageHeader
        title="Duplicate Records"
        subtitle={`${counts.total} total · ${counts.detected} detected · ${counts.resolved} resolved · ${counts.ignored} ignored`}
        icon={<GitCompare className="h-6 w-6" />}
      />

      <div className="space-y-4 p-6">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1">
            {(["all", "detected", "in-review", "merged", "resolved", "ignored"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStageFilter(s === "all" ? "all" : s)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  stageFilter === s
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted",
                )}
              >
                {s === "all" ? "All" : s.replace("-", " ")}
                <span className="ml-1.5 text-[10px] opacity-70">({s === "all" ? issues.length : stageCounts[s] ?? 0})</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-48 rounded-lg pl-8 text-xs"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="h-8 w-36 rounded-lg text-xs">
                <Filter className="mr-1.5 h-3 w-3" />
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {(["detected", "in-review", "merged", "resolved", "ignored"] as const).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}
                    <span className="ml-1.5 text-[10px] opacity-60">({stageCounts[s] ?? 0})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-8 w-40 rounded-lg text-xs">
                <Filter className="mr-1.5 h-3 w-3" />
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {sourceOptions.map((src) => (
                  <SelectItem key={src} value={src}>{src.replace("-", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={batchFilter} onValueChange={setBatchFilter}>
              <SelectTrigger className="h-8 w-44 rounded-lg text-xs">
                <Filter className="mr-1.5 h-3 w-3" />
                <SelectValue placeholder="All batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All batches</SelectItem>
                {batchNameOptions(issues).map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <Card className="border-dashed border-border/60 bg-card/40 p-10 text-center">
            <GitCompare className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-semibold text-muted-foreground">No duplicate issues</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {issues.length === 0
                ? "Duplicate issues appear here after importing batches with conflicts."
                : "Try adjusting your filters to see more results."}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {pagination.pageData.map((issue) => (
              <Card
                key={issue.id}
                data-issue-id={issue.id}
                data-resolution={issue.resolution}
                className={cn(
                  "border p-4 transition-shadow hover:shadow-sm",
                  issue.resolution === "pending" && "border-amber-200 bg-amber-50/30",
                  issue.resolution === "resolved" && "border-green-200 bg-green-50/30",
                  issue.resolution === "ignored" && "border-border/60 bg-muted/20",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{issue.newRowLabel}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          issue.resolution === "pending" && "border-amber-300 bg-amber-100/60 text-amber-800",
                          issue.resolution === "resolved" && "border-green-300 bg-green-100/60 text-green-800",
                          issue.resolution === "ignored" && "border-border/60 text-muted-foreground",
                        )}
                      >
                        {issue.resolution === "pending" ? "Pending" : issue.resolution === "resolved" ? "Resolved" : "Ignored"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          duplicateIssueStage(issue) === "detected" && "border-sky-300 bg-sky-100/60 text-sky-700",
                          duplicateIssueStage(issue) === "in-review" && "border-purple-300 bg-purple-100/60 text-purple-700",
                          duplicateIssueStage(issue) === "merged" && "border-indigo-300 bg-indigo-100/60 text-indigo-700",
                          duplicateIssueStage(issue) === "resolved" && "border-green-300 bg-green-100/60 text-green-700",
                          duplicateIssueStage(issue) === "ignored" && "border-border/60 text-muted-foreground",
                        )}
                      >
                        {duplicateIssueStage(issue).replace("-", " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Identity key: <span className="font-mono">{issue.identityKey}</span>
                      {issue.existingRecordId && (
                        <> · Existing student: <span className="font-medium">{issue.existingRecordLabel ?? issue.existingRecordId}</span></>
                      )}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Row {issue.newRowIndex} · Batch: {issue.batchName} · Source: {issue.source.replace("-", " ")}
                    </p>
                  </div>

                  {issue.resolution === "pending" && (
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      {issue.existingRecordId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 rounded-lg text-xs"
                          onClick={() => navigate(`/students/${issue.existingRecordId}`)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View existing
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-lg text-xs text-indigo-600 hover:text-indigo-800 border-indigo-200 hover:border-indigo-400"
                        onClick={() => setMergeIssue(issue)}
                      >
                        <GitMerge className="mr-1 h-3.5 w-3.5" />
                        Merge
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-lg text-xs text-green-700 hover:text-green-800"
                        onClick={() => handleResolve(issue.id)}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Resolved
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-lg text-xs text-muted-foreground hover:text-red-600"
                        onClick={() => handleIgnore(issue.id)}
                      >
                        <XCircle className="mr-1 h-3.5 w-3.5" />
                        Ignore
                      </Button>
                    </div>
                  )}
                  {issue.resolution !== "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-lg text-xs"
                      onClick={() => {
                        const updated = updateDuplicateIssue(issue.id, { resolution: "pending" });
                        setIssues(updated);
                        toast.success("Re-opened");
                      }}
                    >
                      Re-open
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <TablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            from={pagination.from}
            to={pagination.to}
            setPage={pagination.setPage}
            next={pagination.next}
            prev={pagination.prev}
            pageSize={pagination.pageSize}
            setPageSize={pagination.setPageSize}
          />
        )}
      </div>

      {mergeIssue && (
        <DuplicateMergeWizard
          issue={mergeIssue}
          open={!!mergeIssue}
          onOpenChange={(open) => { if (!open) setMergeIssue(null); }}
          onMerged={(updated) => {
            setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            resolveDuplicateFeedbackLoop();
          }}
        />
      )}
    </div>
  );
}
