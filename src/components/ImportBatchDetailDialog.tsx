import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ImportBatch } from "@/lib/import-engine";

interface ImportBatchDetailDialogProps {
  batch: ImportBatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  mapped: "bg-primary/10 text-primary",
  keyed: "bg-primary/10 text-primary",
  validated: "bg-primary/10 text-primary",
  previewed: "bg-primary/10 text-primary",
  transferred: "bg-success/15 text-success",
  rolled_back: "bg-warning/15 text-warning",
};

export default function ImportBatchDetailDialog({ batch, open, onOpenChange }: ImportBatchDetailDialogProps) {
  if (!batch) return null;

  const transferred = batch.status === "transferred";
  const rolledBack = batch.status === "rolled_back";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {batch.batchName}
            <Badge variant="secondary" className={cn("text-xs", statusColor[batch.status])}>{batch.status}</Badge>
          </DialogTitle>
          <DialogDescription>
            Created {new Date(batch.createdAt).toLocaleString()}
            {batch.completedAt ? ` · Completed ${new Date(batch.completedAt).toLocaleString()}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-4">
          <div className="space-y-4">
            {batch.batchDescription ? (
              <p className="text-sm text-muted-foreground">{batch.batchDescription}</p>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 text-center">
                <p className="font-display text-2xl font-bold">{batch.rowCount}</p>
                <p className="text-xs text-muted-foreground">Total rows</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="font-display text-2xl font-bold">{batch.mappingLines.length}</p>
                <p className="text-xs text-muted-foreground">Mapped fields</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="font-display text-2xl font-bold text-success">{batch.insertedCount}</p>
                <p className="text-xs text-muted-foreground">Inserted</p>
              </Card>
              <Card className="p-3 text-center">
                <p className="font-display text-2xl font-bold text-primary">{batch.updatedCount}</p>
                <p className="text-xs text-muted-foreground">Updated</p>
              </Card>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">Keying Configuration</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Match strategy: <span className="font-medium text-foreground">{batch.matchStrategy}</span></p>
                <p>Transfer mode: <span className="font-medium text-foreground">{batch.defaultImportType}</span></p>
                {batch.keyingConfig.enabled ? (
                  <>
                    <p>Import key fields: <span className="font-medium text-foreground">{batch.keyingConfig.importKey.join(", ") || "auto"}</span></p>
                    <p>Duplicate key fields: <span className="font-medium text-foreground">{batch.keyingConfig.duplicateKey.join(", ") || "none"}</span></p>
                  </>
                ) : null}
              </div>
            </div>

            {batch.mappingLines.length ? (
              <div>
                <p className="mb-2 text-sm font-semibold">Field Mapping ({batch.mappingLines.length})</p>
                <div className="space-y-1">
                  {batch.mappingLines.slice(0, 20).map((m, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-card/60 px-3 py-1.5 text-sm">
                      <span className="font-medium">{m.importField}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className={m.targetField ? "" : "text-muted-foreground italic"}>{m.targetField || "ignored"}</span>
                      <Badge variant="secondary" className="ml-auto text-xs">{m.transferMode}</Badge>
                    </div>
                  ))}
                  {batch.mappingLines.length > 20 ? (
                    <p className="text-xs text-muted-foreground">...and {batch.mappingLines.length - 20} more fields</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {transferred || rolledBack ? (
              <div>
                <p className="mb-2 text-sm font-semibold">Transfer Results</p>
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div className="rounded-lg bg-card/60 p-2">
                    <p className="font-bold text-success">{batch.insertedCount}</p>
                    <p className="text-xs text-muted-foreground">Inserted</p>
                  </div>
                  <div className="rounded-lg bg-card/60 p-2">
                    <p className="font-bold text-primary">{batch.updatedCount}</p>
                    <p className="text-xs text-muted-foreground">Updated</p>
                  </div>
                  <div className="rounded-lg bg-card/60 p-2">
                    <p className="font-bold">{batch.skippedCount}</p>
                    <p className="text-xs text-muted-foreground">Skipped</p>
                  </div>
                  <div className="rounded-lg bg-card/60 p-2">
                    <p className="font-bold text-warning">{batch.transferredCount ? batch.rowCount - batch.insertedCount - batch.updatedCount - batch.skippedCount : 0}</p>
                    <p className="text-xs text-muted-foreground">Errors</p>
                  </div>
                </div>
              </div>
            ) : null}

            {rolledBack ? (
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
                This batch was rolled back. All changes have been reverted.
              </div>
            ) : null}

            {batch.rollbackData?.length ? (
              <div>
                <p className="mb-2 text-sm font-semibold">Rollback Data</p>
                <p className="text-sm text-muted-foreground">
                  {batch.rollbackData.filter((r) => r.changeType === "inserted").length} inserted records
                  {" · "}
                  {batch.rollbackData.filter((r) => r.changeType === "updated").length} updated snapshots
                </p>
              </div>
            ) : null}

            <div className="border-t border-border/60 pt-3 text-xs text-muted-foreground">
              <p>Batch ID: {batch.batchId}</p>
              <p>Last updated: {new Date(batch.updatedAt).toLocaleString()}</p>
              {batch.startedAt ? <p>Started: {new Date(batch.startedAt).toLocaleString()}</p> : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
