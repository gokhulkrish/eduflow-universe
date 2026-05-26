import type { RegistryFieldRow } from "@/lib/registry-explorer";

const GROUP_LABEL: Record<string, string> = {
  basicInfo: 'Basic Info',
  instituteInfo: 'Institute',
  courseInfo: 'Course',
  academic: 'Academic',
  personal: 'Personal',
  contact: 'Contact',
  family: 'Family',
  hostel: 'Hostel',
  documents: 'Documents',
  other: 'Other',
  general: 'General',
  headOfInstitute: 'Head',
  nodalOfficer: 'Nodal',
};

const TYPE_LABEL: Record<string, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  textarea: 'Textarea',
  select: 'Select',
};

const SOURCE_CLS: Record<string, string> = {
  base: 'bg-indigo-900/40 text-indigo-300 border border-indigo-700/70',
  custom: 'bg-sky-900/40 text-sky-300 border border-sky-700/70',
  fetched: 'bg-amber-900/40 text-amber-300 border border-amber-700/70',
  import: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/70',
  'legacy-internal': 'bg-card text-muted-foreground border border-border/60',
};

const STATUS_CLS: Record<string, string> = {
  active: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/70',
  archived: 'bg-card text-muted-foreground border border-border/60',
  deleted: 'bg-rose-900/40 text-rose-300 border border-rose-700/70',
};

export interface ExplorerFieldRowProps {
  field: RegistryFieldRow;
  onOpenMapping: (fieldId: string) => void;
  onViewAiLinks?: (fieldId: string) => void;
}

export default function ExplorerFieldRow({
  field,
  onOpenMapping,
  onViewAiLinks,
}: ExplorerFieldRowProps) {
  const groupLabel = GROUP_LABEL[field.group] || field.group;
  const typeLabel = TYPE_LABEL[field.type] || field.type;
  const sourceCls = SOURCE_CLS[field.source] || 'bg-card text-muted-foreground border border-border/60';
  const statusCls = STATUS_CLS[field.status] || 'bg-card text-muted-foreground border border-border/60';

  return (
    <tr
      className="group cursor-pointer border-b border-border/30 bg-card/40 hover:bg-muted/20 transition-colors"
      onClick={() => onOpenMapping(field.id)}
    >
      <td className="px-3 py-3 align-top">
        <div className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
          {field.label}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {field.key}
          </code>
          <span className="rounded-full bg-muted/80 px-2 py-0.5 text-[10px] text-muted-foreground">
            {groupLabel}
          </span>
        </div>
      </td>
      <td className="px-3 py-3 align-top text-[11px]">
        <span className="inline-flex rounded-full bg-muted/80 px-2 py-0.5 text-[10px] text-muted-foreground">
          {groupLabel}
        </span>
      </td>
      <td className="px-3 py-3 align-top text-[11px] text-muted-foreground">
        {typeLabel}
      </td>
      <td className="px-3 py-3 align-top text-[11px]">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusCls}`}>
          {field.status}
        </span>
      </td>
      <td className="px-3 py-3 align-top text-[11px]">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${sourceCls}`}>
          {field.source}
        </span>
      </td>
      <td className="px-3 py-3 align-top text-[11px] text-muted-foreground">
        {field.order}
      </td>
      <td className="px-3 py-3 align-top text-[11px]">
        <div className="flex flex-wrap items-center gap-1.5">
          {field.isCanonical && (
            <span className="inline-flex rounded-full border border-indigo-500/60 bg-indigo-900/30 px-2 py-0.5 text-[10px] font-medium text-indigo-200">
              Canonical
            </span>
          )}
          {field.hasAiMapping && (
            <span className="inline-flex rounded-full border border-emerald-500/60 bg-emerald-900/30 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
              Mapped
            </span>
          )}
          {field.inReviewQueue && (
            <span className="inline-flex rounded-full border border-amber-500/60 bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-200">
              In review
            </span>
          )}
          {onViewAiLinks && (
            <button
              type="button"
              className="ml-1 inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-foreground"
              onClick={e => {
                e.stopPropagation();
                onViewAiLinks(field.id);
              }}
            >
              View AI links
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
