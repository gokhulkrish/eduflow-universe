import { useEffect, useState } from "react";
import { Users, Plus, Trash2, Pencil, UserPlus, UserX, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { generateId } from "@/lib/utils";
import {
  loadGroups,
  saveGroup,
  deleteGroup,
  type UserGroup,
} from "@/lib/user-management-service";
import { validateUserGroup } from "@/lib/user-management-state";
import type { UserManagementState } from "@/lib/user-management-state";

interface Props {
  users: UserManagementState[];
  onRefresh: () => Promise<void>;
}

export default function UserGroupManager({ users, onRefresh }: Props) {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [groupOpen, setGroupOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");

  const [membersOpen, setMembersOpen] = useState(false);
  const [membersGroup, setMembersGroup] = useState<UserGroup | null>(null);
  const [members, setMembers] = useState<string[]>([]);

  const refreshGroups = async () => {
    try {
      const g = await loadGroups();
      setGroups(g);
    } catch {
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshGroups(); }, []);

  const openAddGroup = () => {
    setEditingGroupId(null);
    setGroupName("");
    setGroupDesc("");
    setGroupOpen(true);
  };

  const openEditGroup = (g: UserGroup) => {
    setEditingGroupId(g.id);
    setGroupName(g.name);
    setGroupDesc(g.description);
    setGroupOpen(true);
  };

  const saveGroupAction = async () => {
    const now = new Date().toISOString();
    let target: UserGroup;
    if (editingGroupId) {
      const existing = groups.find((g) => g.id === editingGroupId);
      if (!existing) return;
      target = { ...existing, name: groupName, description: groupDesc, updatedAt: now };
    } else {
      target = {
        id: generateId(),
        name: groupName,
        description: groupDesc,
        memberIds: [],
        createdAt: now,
        updatedAt: now,
      };
    }
    const val = validateUserGroup(target);
    if (!val.valid) {
      val.errors.forEach((e) => toast.error(e));
      return;
    }
    const result = await saveGroup(target);
    if (!result.success) {
      toast.error(result.error ?? "Failed to save");
      return;
    }
    await refreshGroups();
    await onRefresh();
    setGroupOpen(false);
    toast.success(editingGroupId ? "Group updated" : "Group created");
  };

  const deleteGroupAction = async (id: string) => {
    const group = groups.find((g) => g.id === id);
    if (!group) return;
    if (group.memberIds.length > 0) {
      toast.error(`Cannot delete "${group.name}" — ${group.memberIds.length} member(s) assigned`);
      return;
    }
    const result = await deleteGroup(id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete");
      return;
    }
    await refreshGroups();
    await onRefresh();
    toast.success("Group deleted");
  };

  const openMembers = (g: UserGroup) => {
    setMembersGroup(g);
    setMembers([...g.memberIds]);
    setMembersOpen(true);
  };

  const saveMembers = async () => {
    if (!membersGroup) return;
    const updated = { ...membersGroup, memberIds: members, updatedAt: new Date().toISOString() };
    const result = await saveGroup(updated);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update members");
      return;
    }
    await refreshGroups();
    setMembersOpen(false);
    setMembersGroup(null);
    toast.success("Group members updated");
  };

  const toggleMember = (userId: string) => {
    setMembers((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <p className="text-sm text-muted-foreground">{groups.length} group{groups.length !== 1 ? "s" : ""}</p>
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openAddGroup}>
          <Plus className="h-4 w-4 mr-1" /> New Group
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <Card key={g.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                {g.name}
                <div className="ml-auto flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEditGroup(g)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteGroupAction(g.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {g.description && <p className="text-[10px] text-muted-foreground mb-2">{g.description}</p>}
              <p className="text-xs text-muted-foreground mb-2">{g.memberIds.length} member{g.memberIds.length !== 1 ? "s" : ""}</p>
              <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => openMembers(g)}>
                <UserPlus className="h-3 w-3 mr-1" /> Manage Members
              </Button>
            </CardContent>
          </Card>
        ))}
        {groups.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">No groups defined</CardContent>
          </Card>
        )}
      </div>

      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editingGroupId ? "Edit Group" : "New Group"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs" htmlFor="groupName">Group Name</Label>
              <Input id="groupName" name="groupName" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs" htmlFor="groupDesc">Description</Label>
              <Input id="groupDesc" name="groupDesc" value={groupDesc} onChange={(e) => setGroupDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupOpen(false)}>Cancel</Button>
            <Button onClick={saveGroupAction} disabled={!groupName.trim()}>
              {editingGroupId ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{membersGroup?.name} — Members</DialogTitle></DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {users.map((u) => (
              <label key={u.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={members.includes(u.id)}
                  onChange={() => toggleMember(u.id)}
                  className="rounded"
                />
                <span className="font-medium">{u.name}</span>
                <span className="text-xs text-muted-foreground">{u.email}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{u.role}</span>
              </label>
            ))}
            {users.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No users available</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMembersOpen(false)}>Cancel</Button>
            <Button onClick={saveMembers}>Save ({members.length} selected)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
