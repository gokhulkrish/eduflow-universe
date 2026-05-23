import { Settings2, Bell, Palette, Globe, Lock, Database, CreditCard, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const sections = [
  { title: "GCT Identity", desc: "Name, address, branding", icon: Globe, link: "/settings/institute" },
  { title: "Notifications", desc: "Email, SMS, push preferences", icon: Bell },
  { title: "Appearance", desc: "Theme, colors, logo", icon: Palette },
  { title: "Security", desc: "Password policies, 2FA", icon: Lock },
  { title: "Backups", desc: "Auto backup schedule", icon: Database },
  { title: "Payments", desc: "Fee gateway configuration", icon: CreditCard },
  { title: "Email", desc: "SMTP, templates", icon: Mail },
  { title: "Migration Controls", desc: "Feature flags and rollback gates", icon: Settings2, link: "/migration" },
];

export default function Settings() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="System configuration" icon={<Settings2 className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title} className="border-border/40">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="h-4 w-4 text-primary" /></div>
                  <div><CardTitle className="text-sm">{s.title}</CardTitle><p className="text-[10px] text-muted-foreground">{s.desc}</p></div>
                </div>
              </CardHeader>
              <CardContent>
                {s.link ? (
                  <Button variant="outline" size="sm" className="rounded-lg w-full text-xs" asChild><Link to={s.link}>Configure</Link></Button>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Enable</span>
                    <Switch onCheckedChange={(v) => toast.success(`${s.title}: ${v ? "Enabled" : "Disabled"}`)} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
