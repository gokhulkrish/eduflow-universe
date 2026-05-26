import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface RegistryField {
  key: string;
  label: string;
  source: string;
  type: string;
  sortOrder: number;
  defaultValue?: string;
  options?: string;
  notes?: string;
}

export interface RegistryGroup {
  id: string;
  label: string;
  fields: RegistryField[];
}

export interface RegistryGroupManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ── localStorage helpers ── */
const STORAGE_KEY = "sms.registry-groups.v1";

function loadGroups(): RegistryGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveGroups(groups: RegistryGroup[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch {}
}

const DEFAULT_GROUPS: RegistryGroup[] = [
  { id: "basic", label: "Basic Information", fields: [] },
  { id: "institute", label: "Institute Information", fields: [] },
  { id: "other", label: "Other Information", fields: [] },
];

/* ── Known fields metadata ── */
const KNOWN_FIELDS: RegistryField[] = [
  { key: "studentName", label: "Student Name", source: "Demographic", type: "text", sortOrder: 1 },
  { key: "fatherName", label: "Father Name", source: "Demographic", type: "text", sortOrder: 2 },
  { key: "motherName", label: "Mother Name", source: "Demographic", type: "text", sortOrder: 3 },
  { key: "dateOfBirth", label: "Date of Birth", source: "Demographic", type: "date", sortOrder: 4 },
  { key: "gender", label: "Gender", source: "Demographic", type: "select", sortOrder: 5 },
  { key: "admissionNo", label: "Admission No.", source: "Academic", type: "text", sortOrder: 6 },
  { key: "class", label: "Class", source: "Academic", type: "text", sortOrder: 7 },
  { key: "section", label: "Section", source: "Academic", type: "text", sortOrder: 8 },
  { key: "aadhaar", label: "Aadhaar", source: "Identity", type: "text", sortOrder: 9 },
  { key: "mobile", label: "Mobile Number", source: "Contact", type: "text", sortOrder: 10 },
  { key: "email", label: "Email", source: "Contact", type: "text", sortOrder: 11 },
  { key: "address", label: "Address", source: "Contact", type: "text", sortOrder: 12 },
  { key: "category", label: "Category", source: "Demographic", type: "select", sortOrder: 13 },
  { key: "religion", label: "Religion", source: "Demographic", type: "select", sortOrder: 14 },
  { key: "caste", label: "Caste", source: "Demographic", type: "select", sortOrder: 15 },
  { key: "bloodGroup", label: "Blood Group", source: "Health", type: "select", sortOrder: 16 },
  { key: "emisNo", label: "EMIS No.", source: "Academic", type: "text", sortOrder: 17 },
  { key: "bankAccount", label: "Bank Account", source: "Financial", type: "text", sortOrder: 18 },
  { key: "ifscCode", label: "IFSC Code", source: "Financial", type: "text", sortOrder: 19 },
  { key: "disability", label: "Disability", source: "Health", type: "select", sortOrder: 20 },
  { key: "guardianName", label: "Guardian Name", source: "Demographic", type: "text", sortOrder: 21 },
  { key: "guardianRelation", label: "Guardian Relation", source: "Demographic", type: "select", sortOrder: 22 },
  { key: "motherTongue", label: "Mother Tongue", source: "Demographic", type: "select", sortOrder: 23 },
  { key: "nationality", label: "Nationality", source: "Demographic", type: "select", sortOrder: 24 },
  { key: "lastSchool", label: "Last School", source: "Academic", type: "text", sortOrder: 25 },
  { key: "medium", label: "Medium", source: "Academic", type: "select", sortOrder: 26 },
  { key: "status", label: "Status", source: "Academic", type: "select", sortOrder: 27 },
  { key: "transportRoute", label: "Transport Route", source: "Transport", type: "text", sortOrder: 28 },
  { key: "hostelName", label: "Hostel Name", source: "Hostel", type: "text", sortOrder: 29 },
  { key: "feePlan", label: "Fee Plan", source: "Financial", type: "text", sortOrder: 30 },
];

const UNASSIGNED_GROUP_ID = "__unassigned__";

export function RegistryGroupManager({
  open,
  onOpenChange,
}: RegistryGroupManagerProps) {
  const [groups, setGroupsState] = useState<RegistryGroup[]>([]);
  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [savingRow, setSavingRow] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const raw = loadGroups();
    if (raw.length === 0) {
      setGroupsState(DEFAULT_GROUPS.map((g) => ({ ...g, fields: [] })));
    } else {
      setGroupsState(raw);
    }
    setNewGroupLabel("");
    setSavingRow(null);
  }, [open]);

  const persist = useCallback((next: RegistryGroup[]) => {
    setGroupsState(next);
    saveGroups(next);
  }, []);

  /* ── Derived: all known fields that are NOT yet in any user group ── */
  const assignedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const g of groups) {
      for (const f of g.fields) s.add(f.key);
    }
    return s;
  }, [groups]);

  const unassignedFields = useMemo(
    () => KNOWN_FIELDS.filter((f) => !assignedKeys.has(f.key)),
    [KNOWN_FIELDS, assignedKeys],
  );

  /* ── Get group for a field ── */
  const getFieldGroupId = (fieldKey: string): string | null => {
    for (const g of groups) {
      if (g.fields.some((f) => f.key === fieldKey)) return g.id;
    }
    return null;
  };

  /* ── Move field to a group ── */
  const moveField = (fieldKey: string, targetGroupId: string) => {
    const next = groups.map((g) => ({
      ...g,
      fields: g.fields.filter((f) => f.key !== fieldKey),
    }));
    const known = KNOWN_FIELDS.find((f) => f.key === fieldKey);
    const target = next.find((g) => g.id === targetGroupId);
    if (target && known) {
      target.fields.push({ ...known });
    }
    persist(next);
  };

  /* ── Save single row (update field metadata) ── */
  const saveRow = (fieldKey: string, updates: Partial<RegistryField>) => {
    const next = groups.map((g) => ({
      ...g,
      fields: g.fields.map((f) => (f.key === fieldKey ? { ...f, ...updates } : f)),
    }));
    persist(next);
    setSavingRow(null);
  };

  /* ── Create new group ── */
  const createGroup = () => {
    const label = newGroupLabel.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (groups.some((g) => g.id === id)) return;
    persist([...groups, { id, label, fields: [] }]);
    setNewGroupLabel("");
  };

  /* ── Reset defaults ── */
  const handleReset = () => {
    persist(DEFAULT_GROUPS.map((g) => ({ ...g, fields: [] })));
  };

  const allGroupOptions = useMemo(
    () => [...groups, { id: UNASSIGNED_GROUP_ID, label: "(Unassigned)", fields: [] }],
    [groups],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Registry Group Manager</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Organise and configure registry fields into groups
          </p>
        </DialogHeader>

        {/* Toolbar */}
        <div className="rgm-toolbar">
          <Input
            placeholder="New group name…"
            value={newGroupLabel}
            onChange={(e) => setNewGroupLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createGroup()}
            className="h-8 text-sm"
          />
          <button className="rgm-primary" onClick={createGroup} disabled={!newGroupLabel.trim()}>
            + Add Group
          </button>
          <button onClick={handleReset}>Reset Defaults</button>
        </div>

        {/* Unassigned fields info */}
        {unassignedFields.length > 0 && (
          <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/20 border-b">
            {unassignedFields.length} field{unassignedFields.length > 1 ? "s" : ""} not yet assigned
          </div>
        )}

        {/* Table */}
        <ScrollArea className="flex-1">
          <div className="registry-group-manager">
            {/* Header */}
            <div className="rgm-header">
              <span>Field</span>
              <span>Group</span>
              <span>Source</span>
              <span>Type</span>
              <span>Default</span>
              <span>Options</span>
              <span>Save</span>
            </div>

            {/* Unassigned rows */}
            {unassignedFields.map((field) => {
              const key = `unassigned-${field.key}`;
              return (
                <div key={key} className="rgm-row bg-muted/10">
                  <span className="truncate text-xs">{field.label}</span>
                  <select
                    value={UNASSIGNED_GROUP_ID}
                    onChange={(e) => moveField(field.key, e.target.value)}
                  >
                    <option value={UNASSIGNED_GROUP_ID}>(Unassigned)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.label}</option>
                    ))}
                  </select>
                  <input type="text" value={field.source} readOnly />
                  <input type="text" value={field.type} readOnly />
                  <input type="text" placeholder="Default value" />
                  <input type="text" placeholder="Comma-separated" />
                  <button className="rgm-save-btn" onClick={() => saveRow(field.key, {})}>
                    Save
                  </button>
                </div>
              );
            })}

            {/* Grouped fields */}
            {groups.map((group) =>
              group.fields.map((field) => {
                const rowKey = `${group.id}-${field.key}`;
                const saving = savingRow === rowKey;
                return (
                  <div key={rowKey} className="rgm-row">
                    <span className="truncate text-xs">{field.label}</span>
                    <select
                      value={group.id}
                      onChange={(e) => moveField(field.key, e.target.value)}
                    >
                      {allGroupOptions.map((g) => (
                        <option key={g.id} value={g.id}>{g.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={field.source}
                      onChange={(e) => {
                        const next = groups.map((g) => ({
                          ...g,
                          fields: g.fields.map((f) =>
                            f.key === field.key ? { ...f, source: e.target.value } : f,
                          ),
                        }));
                        setGroupsState(next);
                      }}
                    />
                    <select
                      value={field.type}
                      onChange={(e) => {
                        const next = groups.map((g) => ({
                          ...g,
                          fields: g.fields.map((f) =>
                            f.key === field.key ? { ...f, type: e.target.value } : f,
                          ),
                        }));
                        setGroupsState(next);
                      }}
                    >
                      <option value="text">text</option>
                      <option value="select">select</option>
                      <option value="date">date</option>
                      <option value="number">number</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Default"
                      value={field.defaultValue ?? ""}
                      onChange={(e) => {
                        const next = groups.map((g) => ({
                          ...g,
                          fields: g.fields.map((f) =>
                            f.key === field.key ? { ...f, defaultValue: e.target.value } : f,
                          ),
                        }));
                        setGroupsState(next);
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Option1,Option2"
                      value={field.options ?? ""}
                      onChange={(e) => {
                        const next = groups.map((g) => ({
                          ...g,
                          fields: g.fields.map((f) =>
                            f.key === field.key ? { ...f, options: e.target.value } : f,
                          ),
                        }));
                        setGroupsState(next);
                      }}
                    />
                    <button className="rgm-save-btn" onClick={() => {
                      const grp = groups.find((g) => g.fields.some((f) => f.key === field.key));
                      const f = grp?.fields.find((ff) => ff.key === field.key);
                      if (f) saveRow(field.key, f);
                    }}>
                      {saving ? "..." : "Save"}
                    </button>
                  </div>
                );
              }),
            )}

            {groups.length === 0 && unassignedFields.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground italic">
                No fields or groups configured
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}