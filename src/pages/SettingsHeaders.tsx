import { useState } from "react";
import { Settings2, Plus, Trash2, Star, KeyRound, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

type Header = { id: string; label: string; key: string; required: boolean; isCustom: boolean; group: string };

const initialHeaders: Header[] = [
  { id: "h1", label: "First Name", key: "firstName", required: true, isCustom: false, group: "Personal" },
  { id: "h2", label: "Last Name", key: "lastName", required: true, isCustom: false, group: "Personal" },
  { id: "h3", label: "Date of Birth", key: "dob", required: true, isCustom: false, group: "Personal" },
  { id: "h4", label: "UMIS ID", key: "umisId", required: false, isCustom: false, group: "UMIS" },
  { id: "h5", label: "EMIS ID", key: "emisId", required: false, isCustom: false, group: "UMIS" },
  { id: "h6", label: "Mobile", key: "phone", required: true, isCustom: false, group: "Contact" },
  { id: "h7", label: "Email", key: "email", required: false, isCustom: false, group: "Contact" },
  { id: "h8", label: "Scholarship Status", key: "scholarshipStatus", required: false, isCustom: true, group: "Custom" },
];

const presets = [
  { id: "p1", name: "UMIS Scholarship Intake", headers: 24, default: true },
  { id: "p2", name: "Annual Promotion Roster", headers: 18, default: false },
  { id: "p3", name: "New Admission Batch", headers: 31, default: false },
];

export default function SettingsHeaders() {
  const [headers, setHeaders] = useState(initialHeaders);
  const [defaultKey, setDefaultKey] = useState("umisId");
  const [newLabel, setNewLabel] = useState("");

  const addCustom = () => {
    if (!newLabel.trim()) return;
    const key = newLabel.toLowerCase().replace(/[^a-z0-9]+/g, "");
    setHeaders([...headers, { id: crypto.randomUUID(), label: newLabel, key, required: false, isCustom: true, group: "Custom" }]);
    setNewLabel("");
    toast.success(`Header "${newLabel}" added`);
  };

  const removeHeader = (id: string) => setHeaders(headers.filter((h) => h.id !== id));
  const toggleRequired = (id: string) =>
    setHeaders(headers.map((h) => (h.id === id ? { ...h, required: !h.required } : h)));

  return (
    <div>
      <PageHeader
        title="Headers & Field Settings"
        subtitle="Header registry · saved presets · default key · merged from legacy settings panels"
        icon={<Settings2 className="h-6 w-6" />}
        actions={
          <Button className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90" onClick={() => toast.success("Settings saved")}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        }
      />

      <Tabs defaultValue="registry">
        <TabsList>
          <TabsTrigger value="registry">Header Registry</TabsTrigger>
          <TabsTrigger value="presets">Saved Presets</TabsTrigger>
          <TabsTrigger value="default">Default Key</TabsTrigger>
        </TabsList>

        <TabsContent value="registry">
          <Card className="glass p-5">
            <div className="mb-4 flex gap-2">
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="New custom header label (e.g. Scholarship Notes)" />
              <Button onClick={addCustom} className="shrink-0 rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
                <Plus className="mr-2 h-4 w-4" /> Add Header
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 pl-2">Label</th>
                    <th className="py-3">Key</th>
                    <th className="py-3">Group</th>
                    <th className="py-3">Required</th>
                    <th className="py-3">Type</th>
                    <th className="py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((h) => (
                    <tr key={h.id} className="border-b border-border/40">
                      <td className="py-3 pl-2 font-medium">{h.label}</td>
                      <td className="py-3 font-mono text-xs text-muted-foreground">{h.key}</td>
                      <td className="py-3"><Badge variant="secondary">{h.group}</Badge></td>
                      <td className="py-3"><Switch checked={h.required} onCheckedChange={() => toggleRequired(h.id)} /></td>
                      <td className="py-3">
                        {h.isCustom
                          ? <Badge variant="secondary" className="bg-accent/15 text-accent-foreground">Custom</Badge>
                          : <Badge variant="secondary" className="bg-muted text-muted-foreground">Built-in</Badge>}
                      </td>
                      <td className="py-3 pr-2 text-right">
                        {h.isCustom && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeHeader(h.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="presets">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {presets.map((p) => (
              <Card key={p.id} className="glass hover-lift p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display font-semibold">{p.name}</h3>
                  {p.default && <Star className="h-4 w-4 fill-warning text-warning" />}
                </div>
                <p className="text-xs text-muted-foreground">{p.headers} headers configured</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={() => toast.success(`Loaded "${p.name}"`)}>Load</Button>
                  <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => toast.success(`"${p.name}" set as default`)}>Make Default</Button>
                </div>
              </Card>
            ))}
            <Card className="flex items-center justify-center border-2 border-dashed border-border bg-card/40 p-5 text-center">
              <Button variant="ghost" className="rounded-xl" onClick={() => toast.info("New preset created from current registry")}>
                <Plus className="mr-2 h-4 w-4" /> New Preset
              </Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="default">
          <Card className="glass p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-base font-semibold">Default Matching Key</h3>
                <p className="text-xs text-muted-foreground">This key is used by Import → Keying when no other rule is set.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Primary Key</Label>
                <Select value={defaultKey} onValueChange={setDefaultKey}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => <SelectItem key={h.key} value={h.key}>{h.label} ({h.key})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-xl border border-info/30 bg-info/10 p-4 text-xs">
                <p className="font-semibold text-info">Active default: <span className="font-mono">{defaultKey}</span></p>
                <p className="mt-1 text-muted-foreground">Changing this propagates to every new import batch automatically.</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
