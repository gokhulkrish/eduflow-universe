import { useState } from "react";
import { Building2, MapPin, Save, RotateCcw, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

export default function InstituteSettings() {
  const [identity, setIdentity] = useState({
    name: "Greenfield International School",
    nickname: "GIS",
    code: "GIS-PUN-001",
    type: "K-12 / CBSE",
    estd: "1998",
    affiliation: "CBSE / 130024",
    motto: "Knowledge · Integrity · Service",
  });
  const [contact, setContact] = useState({
    email: "office@greenfield.edu",
    phone: "+91 20 4123 4567",
    address: "127, MG Road, Pune, Maharashtra 411001",
    website: "https://greenfield.edu",
  });
  const [head, setHead] = useState({ name: "Dr. Anita Verma", role: "Principal", email: "principal@greenfield.edu", phone: "+91 98765 43210" });
  const [nodal, setNodal] = useState({ name: "Rajesh Mehta", role: "UMIS Nodal Officer", email: "nodal@greenfield.edu", phone: "+91 91234 56789" });

  const save = () => toast.success("Institute information saved");
  const reset = () => toast.info("Form reset to last saved");
  const capture = () => toast.success("Location captured · 18.5204°N, 73.8567°E");

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
        title="Institute Identity"
        subtitle="Master profile · contact · head of institute · nodal officer"
        icon={<Building2 className="h-6 w-6" />}
        actions={
          <>
            <Button variant="outline" onClick={capture} className="rounded-xl"><MapPin className="mr-2 h-4 w-4" />Capture Location</Button>
            <Button variant="outline" onClick={reset} className="rounded-xl"><RotateCcw className="mr-2 h-4 w-4" />Reset</Button>
            <Button onClick={save} className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90"><Save className="mr-2 h-4 w-4" />Save</Button>
          </>
        }
      />

      {/* Summary chips */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[
          { l: "Configured Headers", v: "47" },
          { l: "Custom Headers", v: "12" },
          { l: "Last Updated", v: "Today · 14:32" },
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

          {section("Head of Institute", "Principal / Director details",
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
        </Card>
      </div>
    </div>
  );
}
