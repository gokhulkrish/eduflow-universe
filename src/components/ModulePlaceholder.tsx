import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { ReactNode } from "react";

interface ModulePlaceholderProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
  features: string[];
}

export function ModulePlaceholder({ title, subtitle, icon, features }: ModulePlaceholderProps) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} icon={icon} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Card
            key={f}
            className="glass hover-lift group relative overflow-hidden p-5 animate-scale-in"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-primary opacity-10 blur-2xl transition-opacity group-hover:opacity-25" />
            <div className="relative">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Construction className="h-4 w-4" />
              </div>
              <h3 className="font-display text-base font-semibold">{f}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                GCT module ready · campus data wired · production schema simulated.
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
