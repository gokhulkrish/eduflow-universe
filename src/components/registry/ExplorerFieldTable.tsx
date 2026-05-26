import type { RegistryFieldRow } from "@/lib/registry-explorer";
import ExplorerFieldRow from "./ExplorerFieldRow";

export interface ExplorerFieldTableProps {
  fields: RegistryFieldRow[];
  onOpenMapping?: (fieldId: string) => void;
  onViewAiLinks?: (fieldId: string) => void;
}

function openMapping(fieldId: string) {
  const w = window as any;
  w.registryContextState = { ...(w.registryContextState || {}), field: fieldId, view: 'mapping', module: w.registryContextState?.module || 'student' };
  window.dispatchEvent(new CustomEvent('sms:navigate-registry-tab', { detail: { tab: 'mapping', fieldId } }));
}

function viewAiLinks(fieldId: string) {
  const w = window as any;
  w.registryContextState = { ...(w.registryContextState || {}), field: fieldId, view: 'diagnostics', module: w.registryContextState?.module || 'student' };
  window.dispatchEvent(new CustomEvent('sms:navigate-registry-tab', { detail: { tab: 'diagnostics', fieldId } }));
}

export default function ExplorerFieldTable({
  fields,
  onOpenMapping,
  onViewAiLinks,
}: ExplorerFieldTableProps) {
  const handleOpenMapping = onOpenMapping ?? openMapping;
  const handleViewAiLinks = onViewAiLinks ?? viewAiLinks;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/60">
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
          <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2 text-left font-semibold">Field</th>
            <th className="px-3 py-2 text-left font-semibold">Group</th>
            <th className="px-3 py-2 text-left font-semibold">Type</th>
            <th className="px-3 py-2 text-left font-semibold">Status</th>
            <th className="px-3 py-2 text-left font-semibold">Source</th>
            <th className="px-3 py-2 text-left font-semibold">Order</th>
            <th className="px-3 py-2 text-left font-semibold">AI / Mapping</th>
          </tr>
        </thead>
        <tbody>
          {fields.map(field => (
            <ExplorerFieldRow
              key={field.id}
              field={field}
              onOpenMapping={handleOpenMapping}
              onViewAiLinks={handleViewAiLinks}
            />
          ))}
        </tbody>
      </table>
      {fields.length === 0 && (
        <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
          No fields match the selected filters
        </div>
      )}
    </div>
  );
}
