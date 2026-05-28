import { useState } from "react";
import { Layers, ListTree, Search, LayoutGrid } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import HeaderGroupManager from "./HeaderGroupManager";
import GroupManagerPane from "@/components/registry/GroupManagerPane";
import RegistryExplorer from "@/components/registry/RegistryExplorer";

interface TabDef { id: string; label: string; icon: typeof Layers; description: string; }

const TABS: TabDef[] = [
  { id: "groups", label: "Groups", icon: ListTree, description: "Organise registry fields into logical groups" },
  { id: "explorer", label: "Explorer", icon: Search, description: "Browse and inspect all registry fields" },
];

export default function WorkspaceRegistry() {
  const [tab, setTab] = useState("groups");
  const [groupView, setGroupView] = useState<"cards" | "table">("cards");
  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div>
      <PageHeader
        title="Workspace Registry"
        subtitle="Field groups, explorer, and diagnostics for the header registry"
        icon={<Layers className="h-6 w-6" />}
      />

      <div className="flex gap-6">
        <div className="w-52 shrink-0 space-y-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  tab === t.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <div className="truncate">{t.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{t.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{activeTab.label}</h2>
              <p className="text-xs text-muted-foreground">{activeTab.description}</p>
            </div>
            {tab === "groups" && (
              <div className="flex items-center gap-1 rounded-lg border border-border/40 p-0.5">
                <button
                  onClick={() => setGroupView("cards")}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                    groupView === "cards" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" /> Cards
                </button>
                <button
                  onClick={() => setGroupView("table")}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                    groupView === "table" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ListTree className="h-3.5 w-3.5" /> Table
                </button>
              </div>
            )}
          </div>
          {tab === "groups" ? (
            groupView === "cards" ? <GroupManagerPane /> : <HeaderGroupManager />
          ) : <RegistryExplorer />}
        </div>
      </div>
    </div>
  );
}
