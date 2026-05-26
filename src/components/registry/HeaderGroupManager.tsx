import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { defaultGroupForField, normalizeToKey, DEFAULT_GROUPS, type RegistryGroup, type RegistryFieldConfig } from "@/lib/registry-groups";
import { HeaderGroupFieldTable } from "@/components/registry/HeaderGroupFieldTable";

interface HeaderGroupManagerProps {
  groups: RegistryGroup[];
  fields: RegistryFieldConfig[];
  onGroupsChange: (groups: RegistryGroup[]) => void;
  onFieldsChange: (fields: RegistryFieldConfig[]) => void;
}

export function HeaderGroupManager({
  groups,
  fields,
  onGroupsChange,
  onFieldsChange,
}: HeaderGroupManagerProps) {
  const [selectedGroupKey, setSelectedGroupKey] = useState<string>("basicInfo");
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const groupedFields = useMemo(() => {
    const map: Record<string, RegistryFieldConfig[]> = {};
    for (const g of groups) map[g.key] = [];
    for (const f of fields) {
      const key = map[f.groupKey] ? f.groupKey : "other";
      (map[key] ??= []).push(f);
    }
    for (const list of Object.values(map)) list.sort((a, b) => a.order - b.order);
    return map;
  }, [groups, fields]);

  const selectedFields = useMemo(
    () => fields.filter((f) => f.groupKey === selectedGroupKey).sort((a, b) => a.order - b.order),
    [fields, selectedGroupKey],
  );

  const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.order - b.order), [groups]);
  const defaultGroupKeys = useMemo(() => new Set(DEFAULT_GROUPS.map((g) => g.key)), []);

  const totalGroups = groups.length;
  const totalFields = fields.length;
  const unmappedCount = fields.filter((f) => !groups.some((g) => g.key === f.groupKey)).length;

  function handleAddGroup() {
    const name = newGroupName.trim();
    if (!name) return;
    const key = normalizeToKey(name);
    if (!key) return;
    if (groups.some((g) => g.key === key)) {
      setSelectedGroupKey(key);
      setNewGroupName("");
      return;
    }
    const maxOrder = groups.reduce((m, g) => Math.max(m, g.order), 0);
    onGroupsChange([...groups, { key, label: name, order: maxOrder + 1, isDefault: false }]);
    setNewGroupName("");
    setSelectedGroupKey(key);
  }

  function handleRenameGroup(key: string) {
    if (!editingLabel.trim()) return;
    onGroupsChange(groups.map((g) => (g.key === key ? { ...g, label: editingLabel.trim() } : g)));
    setEditingGroupKey(null);
    setEditingLabel("");
  }

  function handleDeleteGroup(key: string) {
    if (defaultGroupKeys.has(key)) return;
    const nextGroups = groups.filter((g) => g.key !== key);
    const nextFields = fields.map((f) =>
      f.groupKey === key ? { ...f, groupKey: "other", updatedAt: new Date().toISOString() } : f,
    );
    onGroupsChange(nextGroups);
    onFieldsChange(nextFields);
    if (selectedGroupKey === key) setSelectedGroupKey("other");
  }

  function handleResetDefaults() {
    if (!window.confirm("Reset groups and field group assignments to defaults?")) return;
    const reGrouped = fields.map((f) => ({
      ...f,
      groupKey: defaultGroupForField(f.key),
      updatedAt: new Date().toISOString(),
    }));
    onGroupsChange(DEFAULT_GROUPS.map((g) => ({ ...g })));
    onFieldsChange(reGrouped);
    setSelectedGroupKey("basicInfo");
  }

  function handleGroupFieldChange(updatedGroupFields: RegistryFieldConfig[]) {
    const updatedKeys = new Set(updatedGroupFields.map((f) => f.key));
    const nextFields = fields.map((f) =>
      updatedKeys.has(f.key) ? updatedGroupFields.find((ugf) => ugf.key === f.key)! : f,
    );
    onFieldsChange(nextFields);
  }

  return (
    <div className="flex flex-col h-full header-registry-group-manager">
      <div className="flex gap-2 px-4 pb-2">
        <Badge variant="secondary" className="text-xs">{totalGroups} group{totalGroups !== 1 ? "s" : ""}</Badge>
        <Badge variant="secondary" className="text-xs">{totalFields} field{totalFields !== 1 ? "s" : ""}</Badge>
        {unmappedCount > 0 && (
          <Badge variant="destructive" className="text-xs">{unmappedCount} unmapped</Badge>
        )}
      </div>

      <div className="flex-1 flex gap-4 p-4 min-h-0">
        <div className="w-72 flex-shrink-0 flex flex-col gap-2 border rounded-lg bg-card p-3 overflow-y-auto header-registry-group-list">
          <div className="flex items-center gap-1">
            <Input
              id="newRegistryGroupName"
              placeholder="New group name…"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddGroup()}
              className="h-8 text-xs flex-1"
            />
            <Button id="addRegistryGroupBtn" size="sm" variant="default" className="h-8 text-xs" onClick={handleAddGroup}>
              Add
            </Button>
          </div>

          <div className="flex flex-col gap-0.5">
            {sortedGroups.map((g) => {
              const count = groupedFields[g.key]?.length ?? 0;
              const isDefault = defaultGroupKeys.has(g.key);
              const isSelected = selectedGroupKey === g.key;

              if (editingGroupKey === g.key) {
                return (
                  <div key={g.key} className="flex items-center gap-1 p-1">
                    <Input
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameGroup(g.key);
                        if (e.key === "Escape") setEditingGroupKey(null);
                      }}
                      autoFocus
                      className="h-7 text-xs flex-1"
                    />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-xs" onClick={() => handleRenameGroup(g.key)}>
                      ✓
                    </Button>
                  </div>
                );
              }

              return (
                <div
                  key={g.key}
                  className={cn(
                    "header-registry-group-item flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors",
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted/50",
                  )}
                  onClick={() => setSelectedGroupKey(g.key)}
                >
                  <span className="flex-1 truncate">{g.label}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">{count}</span>
                  {isDefault && (
                    <span className="text-[9px] text-muted-foreground/50 ml-0.5" title="Default group">●</span>
                  )}
                  {!isDefault && (
                    <button
                      className="ml-1 text-muted-foreground hover:text-destructive"
                      title="Delete group"
                      onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.key); }}
                    >
                      ×
                    </button>
                  )}
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    title="Rename group"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingGroupKey(g.key);
                      setEditingLabel(g.label);
                    }}
                  >
                    ✎
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pt-2 border-t">
            <Button id="resetRegistryGroupsBtn" variant="outline" size="sm" className="w-full text-xs" onClick={handleResetDefaults}>
              Reset Defaults
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <h3 className="text-sm font-semibold px-1">
            {groups.find((g) => g.key === selectedGroupKey)?.label ?? selectedGroupKey}
            <span className="text-muted-foreground font-normal ml-2">
              ({selectedFields.length} field{selectedFields.length !== 1 ? "s" : ""})
            </span>
          </h3>

          <HeaderGroupFieldTable
            groups={groups}
            groupKey={selectedGroupKey}
            fields={selectedFields}
            onFieldsChange={handleGroupFieldChange}
            onSaveField={(field) => {
              const { key, ...rest } = field;
              const updated = fields.map((f) => (f.key === field.key ? field : f));
              onFieldsChange(updated);
            }}
            onMoveToGroup={(fieldKey, newGroupKey) => {
              const now = new Date().toISOString();
              const updated = fields.map((f) =>
                f.key === fieldKey ? { ...f, groupKey: newGroupKey, updatedAt: now } : f,
              );
              onFieldsChange(updated);
            }}
          />
        </div>
      </div>
    </div>
  );
}
