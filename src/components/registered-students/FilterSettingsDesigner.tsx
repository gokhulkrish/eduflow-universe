import { useEffect, useMemo, useRef, useState } from "react";
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

export interface FilterDef {
  key: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "text";
  mapTo: string;
}

export interface FilterSettingsDesignerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableFilters: FilterDef[];
  enabledFilters: FilterDef[];
  filterConfig: Record<string, FilterConfig>;
  onSave: (config: {
    enabledKeys: string[];
    filterConfig: Record<string, FilterConfig>;
  }) => void;
  canonicalHeaders: { key: string; label: string }[];
}

const RENDER_LIMIT = 250;

export function FilterSettingsDesigner({
  open,
  onOpenChange,
  availableFilters,
  enabledFilters,
  filterConfig: initialConfig,
  onSave,
  canonicalHeaders,
}: FilterSettingsDesignerProps) {
  const [enabledKeys, setEnabledKeys] = useState<string[]>([]);
  const [config, setConfig] = useState<Record<string, FilterConfig>>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [availableSearch, setAvailableSearch] = useState("");
  const [enabledSearch, setEnabledSearch] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setEnabledKeys(enabledFilters.map((f) => f.key));
      setConfig({ ...initialConfig });
      setSelectedKey(null);
      setAvailableSearch("");
      setEnabledSearch("");
      setDragIdx(null);
    }
  }, [open, enabledFilters, initialConfig]);

  const availablePool = useMemo(() => {
    const enabledSet = new Set(enabledKeys);
    return availableFilters.filter((f) => !enabledSet.has(f.key));
  }, [availableFilters, enabledKeys]);

  const allEnabledDefs = useMemo(
    () => enabledKeys.map((key) => {
      const def = enabledFilters.find((f) => f.key === key) ?? availableFilters.find((f) => f.key === key);
      return { key, label: def?.label ?? config[key]?.label ?? key };
    }),
    [enabledKeys, enabledFilters, availableFilters, config],
  );

  const filteredAvailable = useMemo(
    () => availablePool.filter((f) => f.label.toLowerCase().includes(availableSearch.toLowerCase())),
    [availablePool, availableSearch],
  );

  const filteredEnabled = useMemo(
    () => allEnabledDefs.filter((f) => f.label.toLowerCase().includes(enabledSearch.toLowerCase())),
    [allEnabledDefs, enabledSearch],
  );

  const displayedAvailable = filteredAvailable.slice(0, RENDER_LIMIT);
  const displayedEnabled = filteredEnabled.slice(0, RENDER_LIMIT);

  const selectedConfig = selectedKey ? config[selectedKey] : null;

  const addFilter = (key: string) => {
    setEnabledKeys((prev) => [...prev, key]);
    if (!config[key]) {
      const filter = availableFilters.find((f) => f.key === key);
      setConfig((prev) => ({
        ...prev,
        [key]: { key, label: filter?.label ?? key, type: "select", mapTo: key },
      }));
    }
  };

  const removeFilter = (key: string) => {
    setEnabledKeys((prev) => prev.filter((k) => k !== key));
    setConfig((prev) => ({ ...prev, [key]: { ...prev[key], enabled: false } }));
    if (selectedKey === key) setSelectedKey(null);
  };

  const addAll = () => {
    const newKeys = availablePool.map((f) => f.key);
    const newConfig = { ...config };
    for (const f of availablePool) {
      if (!newConfig[f.key]) {
        newConfig[f.key] = { key: f.key, label: f.label, type: "select", mapTo: f.key };
      }
    }
    setEnabledKeys((prev) => [...prev, ...newKeys]);
    setConfig(newConfig);
  };

  const removeAll = () => {
    setEnabledKeys([]);
    setSelectedKey(null);
  };

  const updateConfig = (updates: Partial<FilterConfig>) => {
    if (!selectedKey) return;
    setConfig((prev) => ({
      ...prev,
      [selectedKey]: { ...prev[selectedKey], ...updates },
    }));
  };

  /* ── Drag & Drop reorder ── */
  const handleDragStart = (idx: number) => { setDragIdx(idx); };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setEnabledKeys((prev) => {
      const reordered = [...prev];
      const [moved] = reordered.splice(dragIdx, 1);
      reordered.splice(idx, 0, moved);
      return reordered;
    });
    setDragIdx(idx);
  };
  const handleDragEnd = () => { setDragIdx(null); };

  const handleSave = () => {
    onSave({ enabledKeys, filterConfig: config });
  };

  const handleReset = () => {
    const allKeys = availableFilters.map((f) => f.key);
    const freshConfig: Record<string, FilterConfig> = {};
    for (const f of availableFilters) {
      freshConfig[f.key] = { key: f.key, label: f.label, type: "select", mapTo: f.key };
    }
    for (const f of enabledFilters) {
      freshConfig[f.key] = { key: f.key, label: f.label ?? f.key, type: "select", mapTo: f.key };
    }
    setEnabledKeys(enabledFilters.map((f) => f.key));
    setConfig(freshConfig);
    setSelectedKey(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Advanced Filter Settings</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Enable filters, arrange their order, edit labels and mapping
          </p>
        </DialogHeader>

        <div className="designer-two-panel flex-1 min-h-0">
          {/* Available Filters */}
          <div className="sort-panel">
            <h4>Available Filters ({availablePool.length})</h4>
            <Input
              placeholder="Search available…"
              value={availableSearch}
              onChange={(e) => setAvailableSearch(e.target.value)}
              className="h-7 text-xs"
            />
            <div className="sort-list">
              {availablePool.length > RENDER_LIMIT && (
                <p className="render-limit-info">Showing first {RENDER_LIMIT} of {availablePool.length}</p>
              )}
              {displayedAvailable.map((f) => (
                <div
                  key={f.key}
                  className={cn("sort-item", selectedKey === f.key && !enabledKeys.includes(f.key) && "selected")}
                  onClick={() => setSelectedKey(f.key)}
                >
                  <span className="truncate">{f.label}</span>
                  <span className="sort-item-sub">{f.key}</span>
                </div>
              ))}
              {displayedAvailable.length === 0 && (
                <p className="p-2 text-xs text-muted-foreground italic">All filters enabled</p>
              )}
            </div>
          </div>

          {/* List Actions */}
          <div className="designer-list-actions">
            <button
              onClick={() => selectedKey && !enabledKeys.includes(selectedKey) && addFilter(selectedKey)}
              disabled={!selectedKey || enabledKeys.includes(selectedKey)}
            >
              Add &rarr;
            </button>
            <button
              onClick={() => selectedKey && removeFilter(selectedKey)}
              disabled={!selectedKey || !enabledKeys.includes(selectedKey)}
            >
              &larr; Remove
            </button>
            <button onClick={addAll} disabled={availablePool.length === 0}>
              Add All &raquo;
            </button>
            <button onClick={removeAll} disabled={enabledKeys.length === 0}>
              &laquo; Remove All
            </button>
          </div>

          {/* Enabled Filters */}
          <div className="sort-panel">
            <h4>Enabled Filters Order ({enabledKeys.length})</h4>
            <Input
              placeholder="Search enabled…"
              value={enabledSearch}
              onChange={(e) => setEnabledSearch(e.target.value)}
              className="h-7 text-xs"
            />
            <div className="sort-list">
              {enabledKeys.length > RENDER_LIMIT && (
                <p className="render-limit-info">Showing first {RENDER_LIMIT} of {enabledKeys.length}</p>
              )}
              {displayedEnabled.map((f, idx) => (
                <div
                  key={f.key}
                  draggable
                  className={cn("sort-item", selectedKey === f.key && "selected", dragIdx === idx && "dragging")}
                  onClick={() => setSelectedKey(f.key)}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="truncate">{f.label}</span>
                  <span className="sort-item-sub">
                    Type {config[f.key]?.type ?? "select"} &middot; Map {config[f.key]?.mapTo ?? f.key}
                  </span>
                </div>
              ))}
              {displayedEnabled.length === 0 && (
                <p className="p-2 text-xs text-muted-foreground italic">No filters enabled</p>
              )}
            </div>
          </div>
        </div>

        {/* Filter Configuration Panel */}
        {selectedConfig && (
          <div className="column-config-panel mt-2">
            <h4>Filter Configuration: {selectedConfig.label}</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="config-field">
                <label>Filter Key (readonly)</label>
                <input type="text" value={selectedConfig.key} readOnly />
              </div>
              <div className="config-field">
                <label>Custom Label</label>
                <input
                  type="text"
                  value={selectedConfig.label}
                  onChange={(e) => updateConfig({ label: e.target.value })}
                />
              </div>
              <div className="config-field">
                <label>Filter Type</label>
                <select
                  value={selectedConfig.type}
                  onChange={(e) => updateConfig({ type: e.target.value as "select" | "text" })}
                >
                  <option value="select">Dropdown</option>
                  <option value="text">Free text search</option>
                </select>
              </div>
              <div className="config-field">
                <label>Map To Header</label>
                <select
                  value={selectedConfig.mapTo}
                  onChange={(e) => updateConfig({ mapTo: e.target.value })}
                >
                  {canonicalHeaders.map((h) => (
                    <option key={h.key} value={h.key}>{h.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset Filter Settings
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save Filter Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}