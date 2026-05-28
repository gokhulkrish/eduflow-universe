import { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowUp, ArrowDown, PencilLine, Trash2, Plus, Search,
  Layers, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  ensureHeaderFieldGroups,
  saveHeaderGroupList,
  getHeaderFieldEntries,
  findOverlappingGroups,
  computeFieldCounts,
  type RegistryGroup,
} from "@/lib/registry-groups";

const SORT_OPTIONS: { value: "order" | "label" | "count"; label: string }[] = [
  { value: "order", label: "Order" },
  { value: "label", label: "Label" },
  { value: "count", label: "Field Count" },
];

export default function GroupManagerPane() {
  const scope = "student";
  const [rawGroups, setRawGroups] = useState<RegistryGroup[]>(() => ensureHeaderFieldGroups(scope));
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"order" | "label" | "count">("order");
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");

  const fieldCounts = useMemo(() => computeFieldCounts(scope), [rawGroups]);
  const overlaps = useMemo(() => findOverlappingGroups(scope, 0.45), [rawGroups]);

  const sortedGroups = useMemo(() => {
    const list = [...rawGroups];
    switch (sort) {
      case "label": list.sort((a, b) => a.label.localeCompare(b.label)); break;
      case "count": list.sort((a, b) => (fieldCounts[b.key] ?? 0) - (fieldCounts[a.key] ?? 0)); break;
      default: list.sort((a, b) => a.order - b.order);
    }
    if (search) {
      const q = search.toLowerCase();
      return list.filter((g) => g.label.toLowerCase().includes(q) || g.key.toLowerCase().includes(q));
    }
    return list;
  }, [rawGroups, sort, search, fieldCounts]);

  const persist = useCallback((next: RegistryGroup[]) => {
    setRawGroups(next);
    saveHeaderGroupList(scope, next);
  }, [scope]);

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    const next = [...rawGroups];
    const a = next[idx];
    const b = next[idx - 1];
    const tmp = a.order;
    a.order = b.order;
    b.order = tmp;
    [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
    persist(next);
    toast.success("Group reordered");
  };

  const moveDown = (idx: number) => {
    if (idx >= rawGroups.length - 1) return;
    const next = [...rawGroups];
    const a = next[idx];
    const b = next[idx + 1];
    const tmp = a.order;
    a.order = b.order;
    b.order = tmp;
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    persist(next);
    toast.success("Group reordered");
  };

  const startEdit = (g: RegistryGroup) => {
    setEditingKey(g.key);
    setEditLabel(g.label);
    setEditDesc(g.description ?? "");
  };

  const saveEdit = () => {
    if (!editingKey) return;
    const next = rawGroups.map((g) =>
      g.key === editingKey ? { ...g, label: editLabel.trim() || g.label, description: editDesc } : g,
    );
    persist(next);
    setEditingKey(null);
    toast.success("Group updated");
  };

  const deleteGroup = (key: string) => {
    if (rawGroups.find((g) => g.key === key)?.isDefault) {
      toast.error("System groups cannot be deleted");
      return;
    }
    const fields = getHeaderFieldEntries(scope);
    const moved = fields.map((f) => (f.groupKey === key ? { ...f, groupKey: "other" as const } : f));
    const next = rawGroups.filter((g) => g.key !== key);
    persist(next);
    toast.success("Group deleted; fields moved to Other");
  };

  const addGroup = () => {
    const name = addName.trim();
    if (!name) { toast.error("Enter a group name"); return; }
    const key = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (rawGroups.some((g) => g.key === key)) { toast.error("Group key already exists"); return; }
    const maxOrder = Math.max(...rawGroups.map((g) => g.order), 0);
    const next: RegistryGroup[] = [
      ...rawGroups,
      { key, label: name, order: maxOrder + 1, isDefault: false, isSystem: false, module: scope, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    persist(next);
    setAddName("");
    setShowAdd(false);
    toast.success(`Group "${name}" added`);
  };

  return (
    <div className="header-registry-group-manager space-y-4">
      <Card className="border-border/40">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Field Groups</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{rawGroups.length} groups</span>
              <span className="text-muted-foreground/50">|</span>
              <span>{Object.values(fieldCounts).reduce((a, b) => a + b, 0)} fields</span>
              {overlaps.length > 0 && (
                <>
                  <span className="text-muted-foreground/50">|</span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3 w-3" /> {overlaps.length} overlap{overlaps.length > 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="header-registry-group-toolbar flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="h-8 rounded-md border border-border/40 bg-background px-2 text-xs"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {showAdd && (
        <div className="flex items-center gap-2 rounded-lg border border-border/40 p-2">
          <Input
            placeholder="New group name..."
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            className="h-8 text-xs"
            onKeyDown={(e) => { if (e.key === "Enter") addGroup(); }}
            autoFocus
          />
          <Button size="sm" className="h-8 text-xs" onClick={addGroup}>Save</Button>
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setShowAdd(false); setAddName(""); }}>Cancel</Button>
        </div>
      )}

      {overlaps.length > 0 && (
        <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/20">
          <CardContent className="p-3 space-y-1">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Similar group labels detected</p>
            {overlaps.map((o) => (
              <p key={`${o.a}-${o.b}`} className="text-[11px] text-amber-600/70 dark:text-amber-400/70">
                "{o.aLabel}" ↔ "{o.bLabel}" ({Math.round(o.similarity * 100)}% overlap)
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="header-registry-group-list space-y-1 max-h-[60vh] overflow-y-auto pr-1">
        {sortedGroups.map((g, idx) => {
          const isEditing = editingKey === g.key;
          const count = fieldCounts[g.key] ?? 0;
          const overlap = overlaps.find((o) => o.a === g.key || o.b === g.key);

          return (
            <div
              key={g.key}
              className="header-registry-group-item flex items-center gap-3 rounded-lg border border-border/40 px-3 py-2.5 transition-colors hover:bg-muted/40"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-foreground disabled:opacity-20"
                  title="Move up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx === sortedGroups.length - 1}
                  className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-foreground disabled:opacity-20"
                  title="Move down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-1.5">
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="h-7 text-xs"
                      autoFocus
                    />
                    <Input
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Description (optional)"
                      className="h-7 text-xs"
                    />
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-6 text-[10px] px-2" onClick={saveEdit}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setEditingKey(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-medium">{g.label}</strong>
                      {g.isSystem && <Badge variant="outline" className="text-[9px] px-1 py-0 leading-tight text-muted-foreground">system</Badge>}
                      {overlap && <Badge variant="outline" className="text-[9px] px-1 py-0 leading-tight border-amber-300 text-amber-600">overlap</Badge>}
                    </div>
                    {g.description && <p className="text-[11px] text-muted-foreground truncate">{g.description}</p>}
                    <span className="text-[11px] text-muted-foreground">{count} field{count !== 1 ? "s" : ""}</span>
                  </>
                )}
              </div>

              {!isEditing && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(g)}
                    className="h-7 w-7 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 flex items-center justify-center"
                    title="Edit"
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteGroup(g.key)}
                    className="h-7 w-7 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"
                    title={g.isSystem ? "System groups cannot be deleted" : "Delete"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {sortedGroups.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">No groups match your search</p>
        )}
      </div>
    </div>
  );
}
