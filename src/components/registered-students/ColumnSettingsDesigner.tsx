import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ColumnDef {
  key: string;
  label: string;
  width: number;
  visible: boolean;
}

export interface ColumnSettingsDesignerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnDef[];
  onSave: (columns: ColumnDef[]) => void;
}

const RENDER_LIMIT = 250;

export function ColumnSettingsDesigner({
  open,
  onOpenChange,
  columns,
  onSave,
}: ColumnSettingsDesignerProps) {
  const [available, setAvailable] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [config, setConfig] = useState<Record<string, ColumnDef & { alias: string }>>({});
  const [activeAvailable, setActiveAvailable] = useState<string | null>(null);
  const [activeSelected, setActiveSelected] = useState<string | null>(null);
  const [availableSearch, setAvailableSearch] = useState("");
  const [selectedSearch, setSelectedSearch] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const vis = columns.filter((c) => c.visible).map((c) => c.key);
    const hid = columns.filter((c) => !c.visible).map((c) => c.key);
    setSelected(vis);
    setAvailable(hid);
    setConfig(
      Object.fromEntries(
        columns.map((c) => [c.key, { ...c, alias: "" }]),
      ),
    );
    setActiveAvailable(null);
    setActiveSelected(null);
    setAvailableSearch("");
    setSelectedSearch("");
  }, [open, columns]);

  const filteredAvailable = available.filter(
    (k) => (config[k]?.label ?? k).toLowerCase().includes(availableSearch.toLowerCase()),
  );
  const filteredSelected = selected.filter(
    (k) => (config[k]?.label ?? k).toLowerCase().includes(selectedSearch.toLowerCase()),
  );
  const displayedAvailable = filteredAvailable.slice(0, RENDER_LIMIT);
  const displayedSelected = filteredSelected.slice(0, RENDER_LIMIT);

  const schedulePersist = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const merged = [...selected, ...available].map((key) => ({
        key,
        label: config[key]?.label ?? key,
        width: config[key]?.width ?? 120,
        visible: selected.includes(key),
      }));
      try { localStorage.setItem("sms.registered-columns.v1", JSON.stringify(merged)); } catch {}
    }, 600);
  }, [selected, available, config]);

  const addColumn = (key: string) => {
    setAvailable((p) => p.filter((k) => k !== key));
    setSelected((p) => [...p, key]);
    setConfig((p) => ({
      ...p,
      [key]: p[key] ?? { key, label: key, width: 120, visible: true, alias: "" },
    }));
    schedulePersist();
  };

  const removeColumn = (key: string) => {
    setSelected((p) => p.filter((k) => k !== key));
    setAvailable((p) => [...p, key]);
    if (activeSelected === key) setActiveSelected(null);
    schedulePersist();
  };

  const addAll = () => {
    const keys = [...available];
    setSelected((p) => [...p, ...keys]);
    setAvailable([]);
    setConfig((p) => {
      const next = { ...p };
      for (const k of keys) {
        if (!next[k]) next[k] = { key: k, label: k, width: 120, visible: true, alias: "" };
      }
      return next;
    });
    schedulePersist();
  };

  const removeAll = () => {
    setAvailable((p) => [...p, ...selected]);
    setSelected([]);
    setActiveSelected(null);
    schedulePersist();
  };

  const updateConfig = (key: string, updates: Partial<ColumnDef & { alias: string }>) => {
    setConfig((p) => ({ ...p, [key]: { ...p[key], ...updates } }));
    schedulePersist();
  };

  /* ── Drag & Drop reorder ── */
  const handleDragStart = (idx: number) => { setDragIdx(idx); };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...selected];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setSelected(reordered);
    setDragIdx(idx);
    schedulePersist();
  };
  const handleDragEnd = () => { setDragIdx(null); };

  const handleSave = () => {
    onSave(columns.map((c) => ({
      ...c,
      visible: selected.includes(c.key),
      label: config[c.key]?.label ?? c.label,
      width: config[c.key]?.width ?? c.width,
    })));
  };

  const handleReset = () => {
    const all = columns.map((c) => ({ ...c, alias: "" }));
    setSelected(all.filter((c) => c.visible).map((c) => c.key));
    setAvailable(all.filter((c) => !c.visible).map((c) => c.key));
    setConfig(Object.fromEntries(all.map((c) => [c.key, c])));
    setActiveAvailable(null);
    setActiveSelected(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Advanced Column Settings</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Choose visible columns, their order, labels, and aliases
          </p>
        </DialogHeader>

        <div className="designer-two-panel flex-1 min-h-0">
          {/* Available Columns */}
          <div className="sort-panel">
            <h4>Available Columns ({available.length})</h4>
            <Input
              placeholder="Search available…"
              value={availableSearch}
              onChange={(e) => setAvailableSearch(e.target.value)}
              className="h-7 text-xs"
            />
            <div className="sort-list">
              {available.length > RENDER_LIMIT && (
                <p className="render-limit-info">Showing first {RENDER_LIMIT} of {available.length}</p>
              )}
              {displayedAvailable.map((key) => (
                <div
                  key={key}
                  className={cn("sort-item", activeAvailable === key && "selected")}
                  onClick={() => { setActiveAvailable(key); setActiveSelected(null); }}
                >
                  <span className="truncate">{config[key]?.label ?? key}</span>
                  <span className="sort-item-sub">{key}</span>
                </div>
              ))}
              {displayedAvailable.length === 0 && (
                <p className="p-2 text-xs text-muted-foreground italic">All columns selected</p>
              )}
            </div>
          </div>

          {/* List Actions */}
          <div className="designer-list-actions">
            <button
              onClick={() => activeAvailable && addColumn(activeAvailable)}
              disabled={!activeAvailable}
            >
              Add &rarr;
            </button>
            <button
              onClick={() => activeSelected && removeColumn(activeSelected)}
              disabled={!activeSelected}
            >
              &larr; Remove
            </button>
            <button onClick={addAll} disabled={available.length === 0}>
              Add All &raquo;
            </button>
            <button onClick={removeAll} disabled={selected.length === 0}>
              &laquo; Remove All
            </button>
          </div>

          {/* Selected Columns */}
          <div className="sort-panel">
            <h4>Selected Columns ({selected.length})</h4>
            <Input
              placeholder="Search selected…"
              value={selectedSearch}
              onChange={(e) => setSelectedSearch(e.target.value)}
              className="h-7 text-xs"
            />
            <div className="sort-list">
              {selected.length > RENDER_LIMIT && (
                <p className="render-limit-info">Showing first {RENDER_LIMIT} of {selected.length}</p>
              )}
              {displayedSelected.map((key, idx) => (
                <div
                  key={key}
                  draggable
                  className={cn("sort-item", activeSelected === key && "selected", dragIdx === idx && "dragging")}
                  onClick={() => { setActiveSelected(key); setActiveAvailable(null); }}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="truncate">{config[key]?.label ?? key}</span>
                  <span className="sort-item-sub">{key}</span>
                </div>
              ))}
              {displayedSelected.length === 0 && (
                <p className="p-2 text-xs text-muted-foreground italic">No columns selected</p>
              )}
            </div>
          </div>
        </div>

        {/* Column Configuration Panel */}
        {activeSelected && config[activeSelected] && (
          <div className="column-config-panel mt-2">
            <h4>Column Configuration: {config[activeSelected].label}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="config-field">
                <label>Key (readonly)</label>
                <input type="text" value={activeSelected} readOnly />
              </div>
              <div className="config-field">
                <label>Custom Label</label>
                <input
                  type="text"
                  value={config[activeSelected].label}
                  onChange={(e) => updateConfig(activeSelected, { label: e.target.value })}
                />
              </div>
              <div className="config-field">
                <label>Alias</label>
                <input
                  type="text"
                  value={config[activeSelected].alias}
                  onChange={(e) => updateConfig(activeSelected, { alias: e.target.value })}
                  placeholder="Alternative name for exports"
                />
              </div>
              <div className="config-field">
                <label>Width (px)</label>
                <input
                  type="number"
                  value={config[activeSelected].width}
                  onChange={(e) => updateConfig(activeSelected, { width: Math.max(40, Math.min(600, Number(e.target.value))) })}
                  min={40}
                  max={600}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset to defaults
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save Column Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}