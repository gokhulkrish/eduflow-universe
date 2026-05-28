import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getImportTargetFieldGroups, type ImportCustomFieldDefinition, type ImportTargetBinding } from "@/lib/student-import";
import type { AiReviewQueueResult } from "@/lib/student-import";

interface ImportDetectedHeadersProps {
  headers: string[];
  mapping: Record<string, ImportTargetBinding>;
  customFields: ImportCustomFieldDefinition[];
  aiReviewQueue: AiReviewQueueResult | null;
}

export default function ImportDetectedHeaders({ headers, mapping, customFields, aiReviewQueue }: ImportDetectedHeadersProps) {
  const mappedCount = Object.values(mapping).filter((v) => v !== "ignore").length;

  return (
    <Card className="border-border/60 bg-card/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">Detected Headers ({headers.length})</p>
        <Badge variant="secondary" className="text-[10px]">
          {mappedCount} mapped &middot; {headers.length - mappedCount} unmapped
        </Badge>
      </div>
      <div className="grid gap-1.5 max-h-[240px] overflow-y-auto">
        {headers.map((h) => {
          const target = mapping[h as keyof typeof mapping];
          const inQueue = aiReviewQueue?.queue.find((q) => q.detectedHeader === h);
          const status = !target || target === "ignore" ? "unmapped" : inQueue ? "review" : "mapped";
          const fieldDef = (getImportTargetFieldGroups(customFields) as { fields: { key: string; label: string }[] }[])
            .flatMap((g) => g.fields)
            .find((f) => f.key === target);
          return (
            <div key={h} className="flex items-center justify-between rounded-lg bg-card/40 px-3 py-2 border border-border/40 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate font-medium">{h}</span>
                {target && target !== "ignore" && (
                  <span className="text-muted-foreground shrink-0">&rarr; {fieldDef?.label ?? target}</span>
                )}
              </div>
              <Badge
                variant={status === "mapped" ? "secondary" : "outline"}
                className={cn(
                  "text-[10px] shrink-0 ml-2",
                  status === "mapped" ? "border-green-200 text-green-700 bg-green-50" : "",
                  status === "review" ? "border-amber-200 text-amber-700" : "",
                  status === "unmapped" ? "border-rose-200 text-rose-700" : "",
                )}
              >
                {status === "mapped" ? "Mapped" : status === "review" ? "Review" : "Unmapped"}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
