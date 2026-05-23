import { useEffect, useState } from "react";
import { Building2, MapPin, Save, RotateCcw, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import {
  getHeaderFields,
  instituteRegistryStorageKey,
  invalidateRegistryCache,
  loadRegistryFromSupabase,
  normalizeHeaderKey,
  registryStorageKey,
  syncRegistryToSupabase,
} from "@/lib/header-registry";
import { importStorageKeys, loadCustomImportFields } from "@/lib/student-import";
import { subscribeAppSync } from "@/lib/app-sync";

const CONFIG_KEY = `${instituteRegistryStorageKey}.config`;

const defaults = {
  identity: {
    name: "Government College of Technology",
    nickname: "GCT",
    code: "GCT-CBE-001",
    type: "Autonomous / State-Funded Engineering College",
    estd: "1945",
    affiliation: "Affiliated to Anna University",
    motto: "To achieve academic excellence through innovative teaching and learning practices",
  },
  contact: {
    email: "principal@gct.ac.in",
    phone: "(0422) - 2432221",
    address: "Thadagam Road, Coimbatore, Tamil Nadu - 641 013",
    website: "https://gct.ac.in/",
  },
  head: { name: "Dr. K. Manonmani", role: "Principal", email: "principal@gct.ac.in", phone: "9842247959" },
  nodal: { name: "ERP Nodal Officer", role: "ERP Nodal Officer", email: "principal@gct.ac.in", phone: "(0422) - 2432221" },
};

const keyMap = {
  identity: { name: "institute_name", nickname: "institute_nickname", code: "institute_code", type: "institute_type", estd: "established_year", affiliation: "affiliation", motto: "motto" },
  contact: { email: "institute_email", phone: "institute_phone", address: "institute_address", website: "website" },
  head: { name: "principal_name", role: "principal_role", email: "principal_email", phone: "principal_phone" },
  nodal: { name: "nodal_officer_name", role: "nodal_officer_role", email: "nodal_officer_email", phone: "nodal_officer_phone" },
};

function readConfig(): Record<string, string> {
  try { return JSON.parse(window.localStorage.getItem(CONFIG_KEY) || "{}"); } catch { return {}; }
}

function writeConfig(config: Record<string, string>) {
  window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export default function InstituteSettings() {
  const [identity, setIdentity] = useState(defaults.identity);
  const [contact, setContact] = useState(defaults.contact);
  const [head, setHead] = useState(defaults.head);
  const [nodal, setNodal] = useState(defaults.nodal);
  const [registryHeaders, setRegistryHeaders] = useState(() => getHeaderFields("institute").length);
  const [customCount, setCustomCount] = useState(() => loadCustomImportFields().length);

  useEffect(() => {
    const config = readConfig();
    const v = (key: string, fallback: string) => (config[normalizeHeaderKey(key)] ?? fallback);
    setIdentity({ name: v("institute_name", defaults.identity.name), nickname: v("institute_nickname", defaults.identity.nickname), code: v("institute_code", defaults.identity.code), type: v("institute_type", defaults.identity.type), estd: v("established_year", defaults.identity.estd), affiliation: v("affiliation", defaults.identity.affiliation), motto: v("motto", defaults.identity.motto) });
    setContact({ email: v("institute_email", defaults.contact.email), phone: v("institute_phone", defaults.contact.phone), address: v("institute_address", defaults.contact.address), website: v("website", defaults.contact.website) });
    setHead({ name: v("principal_name", defaults.head.name), role: v("principal_role", defaults.head.role), email: v("principal_email", defaults.head.email), phone: v("principal_phone", defaults.head.phone) });
    setNodal({ name: v("nodal_officer_name", defaults.nodal.name), role: v("nodal_officer_role", defaults.nodal.role), email: v("nodal_officer_email", defaults.nodal.email), phone: v("nodal_officer_phone", defaults.nodal.phone) });
  }, []);

  useEffect(() => subscribeAppSync([CONFIG_KEY, instituteRegistryStorageKey, registryStorageKey, importStorageKeys.customFields], () => {
    const config = readConfig();
    const v = (key: string, fallback: string) => (config[normalizeHeaderKey(key)] ?? fallback);
    setIdentity({ name: v("institute_name", identity.name), nickname: v("institute_nickname", identity.nickname), code: v("institute_code", identity.code), type: v("institute_type", identity.type), estd: v("established_year", identity.estd), affiliation: v("affiliation", identity.affiliation), motto: v("motto", identity.motto) });
    setContact({ email: v("institute_email", contact.email), phone: v("institute_phone", contact.phone), address: v("institute_address", contact.address), website: v("website", contact.website) });
    setHead({ name: v("principal_name", head.name), role: v("principal_role", head.role), email: v("principal_email", head.email), phone: v("principal_phone", head.phone) });
    setNodal({ name: v("nodal_officer_name", nodal.name), role: v("nodal_officer_role", nodal.role), email: v("nodal_officer_email", nodal.email), phone: v("nodal_officer_phone", nodal.phone) });
    setRegistryHeaders(getHeaderFields("institute").length);
    setCustomCount(loadCustomImportFields().length);
  }), []);

  const persist = () => {
    const config: Record<string, string> = {};
    for (const [group, map] of Object.entries(keyMap)) {
      for (const [prop, key] of Object.entries(map)) {
        const value = ({ identity, contact, head, nodal } as any)[group][prop];
        if (value) config[normalizeHeaderKey(key)] = value;
      }
    }
    config._updatedAt = new Date().toISOString();
    writeConfig(config);
    invalidateRegistryCache();
  };

  const save = () => { persist(); toast.success("Institute information saved"); };
  const reset = () => {
    const config = readConfig();
    const v = (key: string, fallback: string) => (config[normalizeHeaderKey(key)] ?? fallback);
    setIdentity({ name: v("institute_name", defaults.identity.name), nickname: v("institute_nickname", defaults.identity.nickname), code: v("institute_code", defaults.identity.code), type: v("institute_type", defaults.identity.type), estd: v("established_year", defaults.identity.estd), affiliation: v("affiliation", defaults.identity.affiliation), motto: v("motto", defaults.identity.motto) });
    setContact({ email: v("institute_email", defaults.contact.email), phone: v("institute_phone", defaults.contact.phone), address: v("institute_address", defaults.contact.address), website: v("website", defaults.contact.website) });
    setHead({ name: v("principal_name", defaults.head.name), role: v("principal_role", defaults.head.role), email: v("principal_email", defaults.head.email), phone: v("principal_phone", defaults.head.phone) });
    setNodal({ name: v("nodal_officer_name", defaults.nodal.name), role: v("nodal_officer_role", defaults.nodal.role), email: v("nodal_officer_email", defaults.nodal.email), phone: v("nodal_officer_phone", defaults.nodal.phone) });
    toast.info("Form reset to last saved");
  };
  const capture = () => toast.success("Location captured · 18.5204°N, 73.8567°E");
  const [syncing, setSyncing] = useState(false);
  const handleSyncToCloud = async () => {
    setSyncing(true);
    try {
      persist();
      await syncRegistryToSupabase();
      toast.success("Registry synced to cloud");
    } catch (err) {
      toast.error(`Sync failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSyncing(false);
    }
  };
  const handleLoadFromCloud = async () => {
    setSyncing(true);
    try {
      await loadRegistryFromSupabase();
      setRegistryHeaders(getHeaderFields("institute").length);
      setCustomCount(loadCustomImportFields().length);
      toast.success("Registry loaded from cloud");
    } catch (err) {
      toast.error(`Load failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSyncing(false);
    }
  };
  const updatedAt = readConfig()._updatedAt;

  const section = (title: string, sub: string, body: React.ReactNode) => (
    <Card className="glass p-5">
      <div className="mb-4">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      {body}
    </Card>
  );

  const field = (label: string, value: string, onChange: (v: string) => void, type = "text") => (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} type={type} />
    </div>
  );

  return (
    <div>
      <PageHeader
        title="GCT Identity"
        subtitle="Master profile · contact · principal · nodal officer"
        icon={<Building2 className="h-6 w-6" />}
      />

      {/* Summary chips */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          { l: "Configured Headers", v: String(registryHeaders) },
          { l: "Custom Headers", v: String(customCount) },
          { l: "Last Updated", v: updatedAt ? new Date(updatedAt).toLocaleString() : "Never" },
        ].map((c) => (
          <Card key={c.l} className="glass flex items-center justify-between p-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.l}</p>
              <p className="font-display text-lg font-bold">{c.v}</p>
            </div>
            <Badge variant="secondary" className="bg-primary/15 text-primary">live</Badge>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {section("Institute Master", "Core identifiers and affiliation",
            <div className="grid gap-4 sm:grid-cols-2">
              {field("Institute Name", identity.name, (v) => setIdentity({ ...identity, name: v }))}
              {field("Nickname / Short Code", identity.nickname, (v) => setIdentity({ ...identity, nickname: v }))}
              {field("Institute Code", identity.code, (v) => setIdentity({ ...identity, code: v }))}
              {field("Type", identity.type, (v) => setIdentity({ ...identity, type: v }))}
              {field("Established", identity.estd, (v) => setIdentity({ ...identity, estd: v }))}
              {field("Affiliation", identity.affiliation, (v) => setIdentity({ ...identity, affiliation: v }))}
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <Label className="text-xs">Motto</Label>
                <Input value={identity.motto} onChange={(e) => setIdentity({ ...identity, motto: e.target.value })} />
              </div>
            </div>
          )}

          {section("Contact Profile", "Primary office contact info",
            <div className="grid gap-4 sm:grid-cols-2">
              {field("Email", contact.email, (v) => setContact({ ...contact, email: v }), "email")}
              {field("Phone", contact.phone, (v) => setContact({ ...contact, phone: v }), "tel")}
              {field("Website", contact.website, (v) => setContact({ ...contact, website: v }), "url")}
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <Label className="text-xs">Address</Label>
                <Textarea rows={2} value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
              </div>
            </div>
          )}

          {section("Head of Institute", "Principal details",
            <div className="grid gap-4 sm:grid-cols-2">
              {field("Name", head.name, (v) => setHead({ ...head, name: v }))}
              {field("Role", head.role, (v) => setHead({ ...head, role: v }))}
              {field("Email", head.email, (v) => setHead({ ...head, email: v }), "email")}
              {field("Phone", head.phone, (v) => setHead({ ...head, phone: v }), "tel")}
            </div>
          )}

          {section("Nodal Officer", "UMIS / EMIS liaison",
            <div className="grid gap-4 sm:grid-cols-2">
              {field("Name", nodal.name, (v) => setNodal({ ...nodal, name: v }))}
              {field("Role", nodal.role, (v) => setNodal({ ...nodal, role: v }))}
              {field("Email", nodal.email, (v) => setNodal({ ...nodal, email: v }), "email")}
              {field("Phone", nodal.phone, (v) => setNodal({ ...nodal, phone: v }), "tel")}
            </div>
          )}
        </div>

        {/* Live preview */}
        <Card className="glass sticky top-20 h-fit p-5">
          <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">Live Preview</p>
          <div className="rounded-2xl border border-border/60 bg-gradient-aurora p-5 text-primary-foreground">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <ImageIcon className="h-6 w-6" />
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-widest text-primary-foreground/80">{identity.code}</p>
            <p className="font-display text-lg font-bold leading-tight">{identity.name}</p>
            <p className="mt-1 text-xs text-primary-foreground/85">{identity.motto}</p>
            <div className="mt-4 space-y-1 text-[11px] text-primary-foreground/90">
              <p>{contact.email}</p>
              <p>{contact.phone}</p>
              <p>{contact.address}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
            <Button variant="outline" onClick={capture} className="w-full rounded-xl"><MapPin className="mr-2 h-4 w-4" />Capture Location</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="flex-1 rounded-xl"><RotateCcw className="mr-2 h-4 w-4" />Reset</Button>
              <Button onClick={save} className="flex-1 rounded-xl bg-gradient-primary shadow-glow hover:opacity-90"><Save className="mr-2 h-4 w-4" />Save</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleLoadFromCloud} disabled={syncing} className="flex-1 rounded-xl text-xs">
                {syncing ? "Loading..." : "Load Cloud"}
              </Button>
              <Button variant="outline" onClick={handleSyncToCloud} disabled={syncing} className="flex-1 rounded-xl text-xs">
                {syncing ? "Syncing..." : "Sync Cloud"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
