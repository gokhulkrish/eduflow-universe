import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { RegistryGroup, RegistryFieldConfig } from "@/lib/registry-groups";

export interface HeaderGroupFieldTableProps {
  groups: RegistryGroup[];
  groupKey: string;
  fields: RegistryFieldConfig[];
  onFieldsChange: (updated: RegistryFieldConfig[]) => void;
  onSaveField?: (field: RegistryFieldConfig) => Promise<void> | void;
  onMoveToGroup?: (fieldKey: string, groupKey: string) => Promise<void> | void;
}

function fieldTypeLabel(t: RegistryFieldConfig["type"]): string {
  const map: Record<string, string> = {
    text: "Text", number: "Number", date: "Date", enum: "Choice", boolean: "Yes/No",
  };
  return map[t] ?? t;
}

export function HeaderGroupFieldTable({
  groups,
  groupKey,
  fields,
  onFieldsChange,
  onSaveField,
  onMoveToGroup,
}: HeaderGroupFieldTableProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function handleReorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= fields.length || to >= fields.length) return;
    const reordered = [...fields];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const withOrder = reordered.map((f, index) => ({ ...f, order: index + 1 }));
    onFieldsChange(withOrder);
  }

  function handleLabelBlur(index: number, value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const updated = [...fields];
    updated[index] = { ...updated[index], label: trimmed };
    onFieldsChange(updated);
    onSaveField?.(updated[index]);
  }

  function handleDefaultBlur(index: number, value: string) {
    const trimmed = value.trim();
    const updated = [...fields];
    updated[index] = { ...updated[index], defaultValue: trimmed || undefined };
    onFieldsChange(updated);
    onSaveField?.(updated[index]);
  }

  function handleNotesBlur(index: number, value: string) {
    const trimmed = value.trim();
    const updated = [...fields];
    updated[index] = { ...updated[index], notes: trimmed || undefined };
    onFieldsChange(updated);
    onSaveField?.(updated[index]);
  }

  function handleGroupChange(index: number, nextGroupKey: string) {
    onMoveToGroup?.(fields[index].key, nextGroupKey);
  }

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.order - b.order), [groups]);

  if (!fields.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-6 text-xs text-muted-foreground">
        No fields mapped to this group yet. Use the group selector or reset defaults to assign headers.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Fields in group &middot; {groupKey}
      </div>
      <div className="max-h-[480px] overflow-auto">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-card/90 backdrop-blur">
            <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="w-6 px-2 py-2" />
              <th className="px-2 py-2 text-left">Field</th>
              <th className="px-2 py-2 text-left">Label</th>
              <th className="px-2 py-2 text-left">Type</th>
              <th className="px-2 py-2 text-left">Group</th>
              <th className="px-2 py-2 text-left">Default</th>
              <th className="px-2 py-2 text-left">Notes</th>
              <th className="w-16 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {fields.map((f, index) => (
              <FieldRow
                key={f.key}
                field={f}
                index={index}
                dragIndex={dragIndex}
                sortedGroups={sortedGroups}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragIndex === null || dragIndex === index) return;
                  handleReorder(dragIndex, index);
                  setDragIndex(index);
                }}
                onDragEnd={() => setDragIndex(null)}
                onLabelBlur={(v) => handleLabelBlur(index, v)}
                onDefaultBlur={(v) => handleDefaultBlur(index, v)}
                onNotesBlur={(v) => handleNotesBlur(index, v)}
                onGroupChange={(gk) => handleGroupChange(index, gk)}
                onSave={() => onSaveField?.(fields[index])}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Internal FieldRow ── */

function FieldRow({
  field,
  index,
  dragIndex,
  sortedGroups,
  onDragStart,
  onDragOver,
  onDragEnd,
  onLabelBlur,
  onDefaultBlur,
  onNotesBlur,
  onGroupChange,
  onSave,
}: {
  field: RegistryFieldConfig;
  index: number;
  dragIndex: number | null;
  sortedGroups: RegistryGroup[];
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onLabelBlur: (value: string) => void;
  onDefaultBlur: (value: string) => void;
  onNotesBlur: (value: string) => void;
  onGroupChange: (groupKey: string) => void;
  onSave: () => void;
}) {
  const [labelDraft, setLabelDraft] = useState(field.label);
  const [defaultDraft, setDefaultDraft] = useState(field.defaultValue ?? "");
  const [notesDraft, setNotesDraft] = useState(field.notes ?? "");

  useEffect(() => { setLabelDraft(field.label); }, [field.label]);
  useEffect(() => { setDefaultDraft(field.defaultValue ?? ""); }, [field.defaultValue]);
  useEffect(() => { setNotesDraft(field.notes ?? ""); }, [field.notes]);

  const isDragging = dragIndex === index;

  return (
    <tr
      data-header={field.key}
      className={cn(
        "header-group-row border-b border-border/60 transition-colors",
        isDragging ? "dragging opacity-40 bg-muted" : "hover:bg-muted/40",
      )}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <td className="px-2 py-1 text-muted-foreground cursor-grab align-top select-none">⋮⋮</td>
      <td className="px-2 py-2 align-top">
        <div className="font-mono text-[11px] text-muted-foreground truncate" title={field.key}>
          {field.key}
        </div>
        <div className="mt-0.5 text-[10px] text-muted-foreground/60">order {field.order}</div>
      </td>
      <td className="px-2 py-2 align-top">
        <input
          value={labelDraft}
          onChange={(e) => setLabelDraft(e.target.value)}
          onBlur={() => onLabelBlur(labelDraft)}
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-[11px] outline-none focus:border-primary"
        />
      </td>
      <td className="px-2 py-2 align-top text-[11px] text-muted-foreground">
        {fieldTypeLabel(field.type)}
      </td>
      <td className="px-2 py-2 align-top">
        <select
          value={field.groupKey}
          onChange={(e) => onGroupChange(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-[11px] outline-none focus:border-primary"
        >
          {sortedGroups.map((g) => (
            <option key={g.key} value={g.key}>
              {g.label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2 align-top">
        <input
          value={defaultDraft}
          onChange={(e) => setDefaultDraft(e.target.value)}
          onBlur={() => onDefaultBlur(defaultDraft)}
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-[11px] outline-none focus:border-primary"
          placeholder="Default"
        />
      </td>
      <td className="px-2 py-2 align-top">
        <textarea
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          onBlur={() => onNotesBlur(notesDraft)}
          rows={2}
          className="w-full resize-none rounded-md border border-border bg-background px-2 py-1 text-[11px] outline-none focus:border-primary"
          placeholder="Notes…"
        />
      </td>
      <td className="px-2 py-2 align-top text-right">
        <button
          type="button"
          className="inline-flex items-center rounded-full bg-primary/90 px-3 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary transition-colors"
          onClick={onSave}
        >
          Save
        </button>
      </td>
    </tr>
  );
}
