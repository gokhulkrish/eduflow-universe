import { useMemo, useState } from "react";
import { GitMerge, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { resolveDuplicateFeedbackLoop } from "@/lib/student-workspace-messaging";
import {
  updateDuplicateIssue,
} from "@/lib/duplicate-issues-store";
import type { DuplicateIssue, FieldDiff } from "@/lib/student-import";

type Props = {
  issue: DuplicateIssue;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMerged: (updated: DuplicateIssue) => void;
};

export default function DuplicateMergeWizard({ issue, open, onOpenChange, onMerged }: Props) {
  const [selectedMaster, setSelectedMaster] = useState<"existing" | "incoming">("existing");
  const [picks, setPicks] = useState<Record<string, "existing" | "incoming">>({});

  const fieldPicks = useMemo(() => {
    return issue.fieldDiffs.reduce(
      (acc, diff) => {
        acc[diff.fieldKey] = picks[diff.fieldKey] ?? selectedMaster;
        return acc;
      },
      {} as Record<string, "existing" | "incoming">,
    );
  }, [issue.fieldDiffs, picks, selectedMaster]);

  const handleFieldPick = (fieldKey: string, source: "existing" | "incoming") => {
    setPicks((prev) => ({ ...prev, [fieldKey]: source }));
  };

  const handleMasterChange = (master: "existing" | "incoming") => {
    setSelectedMaster(master);
  };

  const resolvedCount = useMemo(() => {
    return issue.fieldDiffs.filter(
      (d) => (picks[d.fieldKey] ?? selectedMaster) === "incoming",
    ).length;
  }, [issue.fieldDiffs, picks, selectedMaster]);

  const mergedValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const diff of issue.fieldDiffs) {
      const source = fieldPicks[diff.fieldKey];
      values[diff.fieldKey] = source === "incoming" ? diff.incomingValue : (diff.existingValue ?? "");
    }
    return values;
  }, [issue.fieldDiffs, fieldPicks]);

  const handleConfirmMerge = () => {
    const updated = updateDuplicateIssue(issue.id, {
      resolution: "resolved",
      mergeResolution: "field-pick",
      mergedValues,
    });
    const found = updated.find((i) => i.id === issue.id);
    if (found) onMerged(found);
    resolveDuplicateFeedbackLoop();
    toast.success("Merge completed");
    onOpenChange(false);
  };

  const handleMasterMerge = () => {
    const updated = updateDuplicateIssue(issue.id, {
      resolution: "resolved",
      mergeResolution: "master",
      mergedValues: {},
    });
    const found = updated.find((i) => i.id === issue.id);
    if (found) onMerged(found);
    resolveDuplicateFeedbackLoop();
    toast.success(
      selectedMaster === "existing"
        ? "Kept existing record as master"
        : "Replaced with incoming record",
    );
    onOpenChange(false);
  };

  const resetDialog = () => {
    setSelectedMaster("existing");
    setPicks({});
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetDialog();
        onOpenChange(next);
      }}
    >
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-indigo-500" />
            Merge Duplicate: {issue.identityKey}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Pick a master record, then choose field values from either side.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Master selector */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Master record</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleMasterChange("existing")}
              className={cn(
                "rounded-lg border p-3 text-left text-xs transition-all",
                selectedMaster === "existing"
                  ? "border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-300"
                  : "border-border/60 bg-card hover:border-muted-foreground/30",
              )}
            >
              <p className="font-semibold text-sm">{issue.existingRecordLabel ?? "Existing"}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Existing student record</p>
            </button>
            <button
              type="button"
              onClick={() => handleMasterChange("incoming")}
              className={cn(
                "rounded-lg border p-3 text-left text-xs transition-all",
                selectedMaster === "incoming"
                  ? "border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-300"
                  : "border-border/60 bg-card hover:border-muted-foreground/30",
              )}
            >
              <p className="font-semibold text-sm">{issue.newRowLabel}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Incoming import row</p>
            </button>
          </div>
        </div>

        {/* Field diffs */}
        {issue.fieldDiffs.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <p className="text-xs font-medium text-muted-foreground">
              Differing fields ({issue.fieldDiffs.length}) — click a value to pick it
            </p>
            <div className="space-y-1.5">
              {issue.fieldDiffs.map((diff) => {
                const currentPick = fieldPicks[diff.fieldKey];
                return (
                  <div
                    key={diff.fieldKey}
                    className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg border border-border/40 bg-card p-2.5 text-xs"
                  >
                    <button
                      type="button"
                      disabled={!diff.existingValue}
                      onClick={() => handleFieldPick(diff.fieldKey, "existing")}
                      className={cn(
                        "rounded-md px-2 py-1 text-left transition-all",
                        !diff.existingValue
                          ? "text-muted-foreground/40"
                          : currentPick === "existing"
                            ? "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300"
                            : "hover:bg-muted/60 text-muted-foreground",
                      )}
                    >
                      <span className="block text-[10px] text-muted-foreground/60 mb-0.5">Existing</span>
                      <span className={cn(!diff.existingValue && "italic opacity-50")}>
                        {diff.existingValue || "(empty)"}
                      </span>
                    </button>

                    <div className="flex flex-col items-center gap-0.5 min-w-0">
                      <span className="font-medium text-[10px] text-center leading-tight">{diff.label}</span>
                      {currentPick === "existing" && diff.existingValue
                        ? <Badge variant="outline" className="h-4 text-[9px] px-1 border-indigo-300 bg-indigo-50 text-indigo-700">master</Badge>
                        : currentPick === "incoming" && diff.incomingValue
                          ? <Badge variant="outline" className="h-4 text-[9px] px-1 border-amber-300 bg-amber-50 text-amber-700">new</Badge>
                          : null}
                    </div>

                    <button
                      type="button"
                      disabled={!diff.incomingValue}
                      onClick={() => handleFieldPick(diff.fieldKey, "incoming")}
                      className={cn(
                        "rounded-md px-2 py-1 text-left transition-all",
                        !diff.incomingValue
                          ? "text-muted-foreground/40"
                          : currentPick === "incoming"
                            ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                            : "hover:bg-muted/60 text-muted-foreground",
                      )}
                    >
                      <span className="block text-[10px] text-muted-foreground/60 mb-0.5">Incoming</span>
                      <span className={cn(!diff.incomingValue && "italic opacity-50")}>
                        {diff.incomingValue || "(empty)"}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary */}
        {issue.fieldDiffs.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              {issue.fieldDiffs.length - resolvedCount} field(s) will use master value
            </span>
            <span className="font-medium text-indigo-700">
              {resolvedCount} field(s) picked from incoming
            </span>
          </div>
        )}

        {issue.fieldDiffs.length === 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50/40 p-4 text-center text-xs text-green-700">
            <CheckCircle2 className="mx-auto h-5 w-5 mb-1" />
            No field-level differences — records match.
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="outline"
            className="rounded-lg text-xs"
            onClick={handleMasterMerge}
          >
            <ArrowRight className="mr-1 h-3.5 w-3.5" />
            Keep master record
          </Button>
          <AlertDialogAction onClick={handleConfirmMerge} disabled={issue.fieldDiffs.length === 0}>
            <GitMerge className="mr-1 h-3.5 w-3.5" />
            Apply merge
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
