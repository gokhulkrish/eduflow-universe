import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { tableExists } from "@/lib/supabase-health";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

const ROLES: AppRole[] = [
  "super_admin","admin","principal","hod","faculty","staff",
  "finance","scholarship","certificate","librarian","hostel_warden","transport","student","parent",
];
const ROLE_LABEL: Record<AppRole,string> = {
  super_admin:"Super",admin:"Admin",principal:"Princ.",hod:"HOD",faculty:"Fac.",staff:"Staff",
  finance:"Fin.",scholarship:"Schol.",certificate:"Cert.",librarian:"Lib.",
  hostel_warden:"Hostel",transport:"Trans.",student:"Stud.",parent:"Parent",
};
const LEVELS = ["none","view","create","edit","approve","delete","export","manage"] as const;
type Level = typeof LEVELS[number];
const LEVEL_CHAR: Record<Level,string> = { none:"–", view:"V", create:"C", edit:"E", approve:"A", delete:"D", export:"X", manage:"M" };
const LEVEL_COLOR: Record<Level,string> = {
  none:"bg-muted text-muted-foreground",
  view:"bg-primary/15 text-primary",
  create:"bg-success/15 text-success",
  edit:"bg-warning/15 text-warning",
  approve:"bg-accent/20 text-accent-foreground",
  delete:"bg-destructive/15 text-destructive",
  export:"bg-secondary text-secondary-foreground",
  manage:"bg-gradient-primary text-primary-foreground",
};

interface Perm { id: string; module_key: string; action: string; label: string; }
interface RP { role: AppRole; permission_id: string; level: Level; }

export default function Permissions() {
  const { roles } = useAuth();
  const isSuper = roles.includes("super_admin");
  const [perms, setPerms] = useState<Perm[]>([]);
  const [matrix, setMatrix] = useState<Map<string, Level>>(new Map()); // key `${role}:${pid}`
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (!(await tableExists("permissions")) || !(await tableExists("role_permissions"))) {
        setPerms([]);
        setMatrix(new Map());
        setLoading(false);
        return;
      }

      const [{ data: p }, { data: rp }] = await Promise.all([
        supabase.from("permissions").select("*").order("module_key").order("action"),
        supabase.from("role_permissions").select("role,permission_id,level"),
      ]);
      setPerms((p ?? []) as Perm[]);
      const m = new Map<string, Level>();
      (rp ?? []).forEach((r: any) => m.set(`${r.role}:${r.permission_id}`, r.level));
      setMatrix(m);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(
    () => perms.filter((p) => `${p.module_key} ${p.action} ${p.label}`.toLowerCase().includes(q.toLowerCase())),
    [perms, q]
  );

  const pag = usePagination({ data: filtered, pageSize: 10 });

  const setCell = (role: AppRole, pid: string, level: Level) => {
    if (!isSuper) return;
    const key = `${role}:${pid}`;
    setMatrix((prev) => new Map(prev).set(key, level));
    setDirty((prev) => new Set(prev).add(key));
  };

  const cycle = (role: AppRole, pid: string) => {
    const cur = matrix.get(`${role}:${pid}`) ?? "none";
    const next = LEVELS[(LEVELS.indexOf(cur) + 1) % LEVELS.length];
    setCell(role, pid, next);
  };

  const save = async () => {
    if (!dirty.size) return;
    if (!(await tableExists("role_permissions"))) {
      toast.error("Role permissions table is not available yet.");
      return;
    }
    setSaving(true);
    const rows = Array.from(dirty).map((k) => {
      const [role, permission_id] = k.split(":") as [AppRole, string];
      return { role, permission_id, level: matrix.get(k) ?? "none" };
    });
    const { error } = await supabase.from("role_permissions").upsert(rows, { onConflict: "role,permission_id" });
    if (error) toast.error(error.message);
    else { toast.success(`Saved ${rows.length} permission cells`); setDirty(new Set()); }
    setSaving(false);
  };

  return (
    <div>
      <PageHeader
        title="Permission Matrix"
        subtitle="Visual RBAC console · roles × modules × access levels"
        icon={<Shield className="h-6 w-6" />}
        actions={
          <Button onClick={save} disabled={!dirty.size || saving || !isSuper}
            className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save {dirty.size > 0 && <Badge variant="secondary" className="ml-2">{dirty.size}</Badge>}
          </Button>
        }
      />

      <Card className="glass mb-4 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter modules / actions" className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LEVELS.map((l) => (
              <Badge key={l} variant="secondary" className={cn("font-mono", LEVEL_COLOR[l])}>
                {LEVEL_CHAR[l]} {l}
              </Badge>
            ))}
          </div>
          {!isSuper && (
            <Badge variant="secondary" className="bg-warning/15 text-warning">Read-only — super admin required to edit</Badge>
          )}
        </div>
      </Card>

      <Card className="glass overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-auto">
            <TablePagination {...pag} />
            <table className="min-w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                <tr>
                  <th className="sticky left-0 z-20 min-w-[220px] border-b border-r border-border bg-card/95 p-2 text-left">Module · Action</th>
                  {ROLES.map((r) => (
                    <th key={r} className="border-b border-border p-2 text-center font-medium text-muted-foreground">{ROLE_LABEL[r]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pag.pageData.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="sticky left-0 z-10 border-b border-r border-border bg-card/95 p-2">
                      <div className="font-medium">{p.label}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{p.module_key}.{p.action}</div>
                    </td>
                    {ROLES.map((r) => {
                      const lvl = matrix.get(`${r}:${p.id}`) ?? "none";
                      const key = `${r}:${p.id}`;
                      return (
                        <td key={r} className="border-b border-border p-1 text-center">
                          <button
                            onClick={() => cycle(r, p.id)}
                            disabled={!isSuper}
                            title={`${r} → ${lvl}`}
                            className={cn(
                              "h-7 w-9 rounded-md font-mono text-[11px] font-semibold transition-all",
                              LEVEL_COLOR[lvl],
                              isSuper && "hover:scale-110",
                              dirty.has(key) && "ring-2 ring-primary",
                            )}
                          >{LEVEL_CHAR[lvl]}</button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
