import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StickyActionBar({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn(
      "sticky bottom-4 mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-background/80 p-3 shadow-elegant backdrop-blur",
      className
    )}>
      {children}
    </div>
  );
}
