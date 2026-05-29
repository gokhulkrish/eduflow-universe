import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, History, Loader2, RefreshCw, RotateCcw, Search, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import ImportBatchDetailDialog from "@/components/ImportBatchDetailDialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  loadImportBatchesFromDB,
  deleteImportBatch,
  saveImportBatches,
  importBatchSyncKey,
} from "@/lib/import-engine/batch";
import { rollbackImport } from "@/lib/import-engine/transfer";
import { getModule } from "@/lib/import-engine/module-registry";
import type { ImportBatch } from "@/lib/import-engine/types";
import { emitAppSync } from "@/lib/app-sync";

type StatusFilter = "all" | "transferred" | "rolled_back" | "draft";

const statusBadge: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  mapped: "bg-primary/10 text-primary",
  keyed: "bg-primary/10 text-primary",
  validated: "bg-primary/10 text-primary",
  previewed: "bg-primary/10 text-primary",
  transferred: "bg-success/15 text-success",
  rolled_back: "bg-warning/15 text-warning",
};

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "transferred", label: "Transferred" },
  { key: "rolled_back", label: "Rolled Back" },
  { key: "draft", label: "Drafts" },
];

export default function ImportHistoryPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [detailBatch, setDetailBatch] = useState<ImportBatch | null>(null);
  const [rollbackBatchId, setRollbackBatchId] = useState<string | null>(null);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const all = await loadImportBatchesFromDB();
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBatches(all);
    } catch {
      toast.error("Failed to load batch history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBatches();
  }, []);

  const filtered = useMemo(() => {
    let list = batches;
    if (filter !== "all") {
      list = list.filter((b) => b.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) => b.batchName.toLowerCase().includes(q) || b.batchDescription?.toLowerCase().includes(q));
    }
    return list;
  }, [batches, filter, search]);

  const handleRollback = async (batch: ImportBatch) => {
    if (!batch.rollbackData?.length) {
      toast.error("No rollback data available for this batch.");
      return;
    }
    const mod = getModule(batch.moduleId);
    if (!mod) {
      toast.error(`Module "${batch.moduleId}" not found.`);
      return;
    }
    setRollbackBatchId(batch.batchId);
    try {
      const result = await rollbackImport(batch, {
        rollbackFn: mod.adapter.rollbackRows,
      });
      batch.status = "rolled_back";
      batch.updatedAt = new Date().toISOString();
      await saveImportBatches([batch]);
      emitAppSync(importBatchSyncKey);
      setBatches((prev) => prev.map((b) => (b.batchId === batch.batchId ? { ...batch } : b)));
      toast.success(`Rolled back: ${result.restored} records restored.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rollback failed");
    } finally {
      setRollbackBatchId(null);
    }
  };

  const handleDelete = async (batchId: string) => {
    try {
      await deleteImportBatch(batchId);
      setBatches((prev) => prev.filter((b) => b.batchId !== batchId));
      toast.success("Batch deleted");
    } catch {
      toast.error("Failed to delete batch");
    }
  };

  const countByStatus = (status: StatusFilter) => {
    if (status === "all") return batches.length;
    return batches.filter((b) => b.status === status).length;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeader
        title="Import History"
        description="Browse, rollback, and manage past imports."
      >
        <Button variant="outline" className="rounded-xl" onClick={() => navigate("/import")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Import
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {f.label} ({countByStatus(f.key)})
          </button>
        ))}
        <div className="relative ml-auto flex items-center gap-2">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search batches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-56 rounded-lg pl-9 text-sm"
          />
          <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => void loadBatches()}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {filtered.length === 0 && !loading && (
        <Card className="border-dashed border-border/60 bg-card/40 p-8 text-center text-sm text-muted-foreground">
          <History className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          {search || filter !== "all"
            ? "No batches match your search criteria."
            : "No import batches found. Complete an import to see it here."}
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {filtered.map((batch) => {
            const errorCount = batch.rowCount - batch.insertedCount - batch.updatedCount - batch.skippedCount;
            return (
              <Card key={batch.batchId} className="border-border/60 bg-card/60">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold">{batch.batchName}</span>
                      <Badge variant="secondary" className={cn("text-[10px]", statusBadge[batch.status])}>
                        {batch.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        {batch.moduleId}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span>{new Date(batch.createdAt).toLocaleDateString()}</span>
                      <span>{batch.rowCount} rows</span>
                      {batch.status === "transferred" && (
                        <>
                          <span className="text-success">{batch.insertedCount} ins</span>
                          <span className="text-primary">{batch.updatedCount} upd</span>
                          <span>{batch.skippedCount} skip</span>
                          {errorCount > 0 && <span className="text-destructive">{errorCount} err</span>}
                        </>
                      )}
                      {batch.rollbackData?.length ? (
                        <span className="text-warning">
                          {batch.rollbackData.filter((r) => r.changeType === "inserted").length} ins /{" "}
                          {batch.rollbackData.filter((r) => r.changeType === "updated").length} upd snapshots
                        </span>
                      ) : null}
                    </div>
                    {batch.batchDescription ? (
                      <p className="mt-1 truncate text-[11px] text-muted-foreground/70">{batch.batchDescription}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => setDetailBatch(batch)}>
                      Detail
                    </Button>
                    {batch.status === "transferred" && batch.rollbackData?.length ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs text-warning hover:text-warning"
                        onClick={() => void handleRollback(batch)}
                        disabled={rollbackBatchId === batch.batchId}
                      >
                        <RotateCcw className={cn("mr-1 h-3 w-3", rollbackBatchId === batch.batchId && "animate-spin")} />
                        Rollback
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => void handleDelete(batch.batchId)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ImportBatchDetailDialog
        batch={detailBatch}
        open={!!detailBatch}
        onOpenChange={(open) => { if (!open) setDetailBatch(null); }}
      />
    </div>
  );
}
