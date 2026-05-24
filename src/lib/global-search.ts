import { moduleConfigs } from "@/pages/module-configs";

export interface SearchResult {
  title: string;
  section: string;
  query: string;
  url?: string;
  type?: string;
  score: number;
}

const sections: { title: string; section: string; query: string; url: string }[] = [
  { title: "Home", section: "Home", query: "home dashboard command center overview", url: "/" },
  { title: "Dashboard", section: "Home", query: "dashboard kpi metrics analytics reports", url: "/" },
  { title: "Import Wizard", section: "Import", query: "import batch wizard upload excel data transfer", url: "/import" },
  { title: "Create Import Batch", section: "Import", query: "create batch name type file upload source", url: "/import" },
  { title: "Map Fields", section: "Import", query: "mapping field map source target column association", url: "/import" },
  { title: "Keying Setup", section: "Import", query: "keying matching primary key match student", url: "/import" },
  { title: "Detect Duplicates", section: "Import", query: "duplicates conflict resolution merge consolidate", url: "/import" },
  { title: "Validate", section: "Import", query: "validate check readiness quality preview error", url: "/import" },
  { title: "Preview Changes", section: "Import", query: "preview changes review before transfer final", url: "/import" },
  { title: "Transfer Batch", section: "Import", query: "transfer batch execute finalize commit", url: "/import" },
  { title: "Activity Log", section: "Tools", query: "activity log audit trail events monitoring", url: "/activity-log" },
  { title: "Automation", section: "Tools", query: "automation rules workflows business processes", url: "/automation" },
  { title: "Migration Center", section: "Tools", query: "migration patches registry gap analysis", url: "/migration" },
  { title: "Reports", section: "Reports", query: "reports analytics charts export pdf excel", url: "/reports" },
];

const erpModuleEntries = Object.entries(moduleConfigs).map(([key, cfg]) => ({
  title: cfg.title,
  section: cfg.subtitle,
  query: `${cfg.title} ${cfg.subtitle} ${cfg.features.join(" ")} ${key}`,
  url: `/${key}`,
}));

const allEntries = [...sections, ...erpModuleEntries].map((e) => ({
  ...e,
  _titleLower: e.title.toLowerCase(),
  _sectionLower: e.section.toLowerCase(),
  _queryLower: e.query.toLowerCase(),
}));

function calculateScore(item: typeof allEntries[number], queryWords: string[]): number {
  let score = 0;
  for (const word of queryWords) {
    if (item._titleLower.startsWith(word)) score += 10;
    else if (item._titleLower.includes(word)) score += 5;
    if (item._sectionLower.includes(word)) score += 3;
    if (item._queryLower.includes(word)) score += 1;
  }
  return score;
}

export function performGlobalSearch(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  return allEntries
    .map((item) => ({ ...item, score: calculateScore(item, queryWords) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}
