import { moduleConfigs } from "@/pages/module-configs";

export interface SearchResult {
  title: string;
  section: string;
  query: string;
  url?: string;
  type?: string;
  score: number;
  category?: string;
}

export interface SearchProvider {
  id: string;
  entries: () => SearchEntry[] | Promise<SearchEntry[]>;
}

export interface SearchEntry {
  title: string;
  section: string;
  query: string;
  url?: string;
  type?: string;
  category?: string;
}

// ── Static page entries ─────────────────────────────────────────

const PAGE_ENTRIES: SearchEntry[] = [
  { title: "Home", section: "Home", query: "home dashboard command center overview", url: "/", category: "Home" },
  { title: "Dashboard", section: "Home", query: "dashboard kpi metrics analytics command center", url: "/", category: "Home" },
  { title: "Import Wizard", section: "Import", query: "import batch wizard upload excel data transfer csv", url: "/import", category: "Import" },
  { title: "Create Import Batch", section: "Import", query: "create batch name type file upload source", url: "/import", category: "Import" },
  { title: "Map Fields", section: "Import", query: "mapping field map source target column association", url: "/import", category: "Import" },
  { title: "Keying Setup", section: "Import", query: "keying matching primary key match student", url: "/import", category: "Import" },
  { title: "Detect Duplicates", section: "Import", query: "duplicates conflict resolution merge consolidate", url: "/import", category: "Import" },
  { title: "Validate", section: "Import", query: "validate check readiness quality preview error", url: "/import", category: "Import" },
  { title: "Preview Changes", section: "Import", query: "preview changes review before transfer final", url: "/import", category: "Import" },
  { title: "Transfer Batch", section: "Import", query: "transfer batch execute finalize commit", url: "/import", category: "Import" },
  { title: "Import History", section: "Import", query: "import history batch past records logs", url: "/import/history", category: "Import" },
  { title: "Activity Log", section: "Tools", query: "activity log audit trail events monitoring", url: "/activity-log", category: "Tools" },
  { title: "Automation", section: "Tools", query: "automation rules workflows business processes engine", url: "/automation", category: "Tools" },
  { title: "Migration Center", section: "Tools", query: "migration patches registry gap analysis database", url: "/migration", category: "Tools" },
  { title: "Data Quality Dashboard", section: "Tools", query: "data quality integrity checks validation monitoring", url: "/data-quality", category: "Tools" },
  { title: "Monitoring Dashboard", section: "Tools", query: "monitoring overview snapshots health system", url: "/monitor", category: "Tools" },
  { title: "Scoring Workspace", section: "Tools", query: "scoring assessment grading subjective marks", url: "/scoring", category: "Tools" },
  { title: "Permission Matrix", section: "Settings", query: "permissions roles access control rbac", url: "/permissions", category: "Settings" },
  { title: "Capability Profiles", section: "Settings", query: "capability profiles role permissions access", url: "/permissions/profiles", category: "Settings" },
  { title: "Institute Settings", section: "Settings", query: "institute organization profile branding", url: "/settings/institute", category: "Settings" },
  { title: "Header Group Manager", section: "Settings", query: "headers groups custom fields registry", url: "/settings/headers", category: "Settings" },
  { title: "Messaging Control Center", section: "Settings", query: "messaging comms sms email control center", url: "/settings/messaging", category: "Settings" },
  { title: "Workspace Registry", section: "Settings", query: "workspace registry configuration settings", url: "/registry", category: "Settings" },
  { title: "User Management", section: "Settings", query: "users accounts login authentication management", url: "/user-management", category: "Settings" },
  { title: "Student Search", section: "Students", query: "student search lookup find admission", url: "/student-search", category: "Students" },
  { title: "Student Information", section: "Students", query: "student information profile details academic", url: "/student-information", category: "Students" },
  { title: "Reports & Analytics", section: "Reports", query: "reports analytics charts export pdf excel csv", url: "/reports", category: "Reports" },
  { title: "Student Duplicates", section: "Students", query: "duplicates merge consolidate duplicate students", url: "/students/duplicates", category: "Students" },
  { title: "Missing Critical Fields", section: "Students", query: "missing fields critical incomplete student data", url: "/students/missing-fields", category: "Students" },
  { title: "Bulk Assign", section: "Students", query: "bulk assign students batch update cohort section", url: "/students/assign/bulk", category: "Students" },
  { title: "Course Information", section: "Academic", query: "course information program syllabus subjects", url: "/course-information", category: "Academic" },
  { title: "Subject Management", section: "Academic", query: "subjects management create edit code credits", url: "/subjects", category: "Academic" },
  { title: "Class Management", section: "Academic", query: "class sections cohorts management setup", url: "/class-mgmt", category: "Academic" },
  { title: "Timetable Scheduler", section: "Academic", query: "timetable schedule classes periods slots", url: "/timetable", category: "Academic" },
  { title: "Lesson Management", section: "Academic", query: "lessons plans curriculum teaching materials", url: "/lessons", category: "Academic" },
  { title: "Curriculum & Outcomes", section: "Academic", query: "curriculum outcomes co po mapping attainment", url: "/curriculum", category: "Academic" },
  { title: "Accreditation & IQAC", section: "Academic", query: "accreditation naac nba nirf iqac quality", url: "/accreditation", category: "Academic" },
  { title: "Departments & Programs", section: "Academic", query: "departments programs hod registry", url: "/departments", category: "Academic" },
  { title: "Faculty HR", section: "Staff", query: "faculty hr performance training records", url: "/faculty-hr", category: "Staff" },
  { title: "Holiday Calendar", section: "Academic", query: "holidays calendar events list dates", url: "/holidays", category: "Academic" },
  { title: "Leave Master", section: "Staff", query: "leave master types allocation policy", url: "/leave-master", category: "Staff" },
  { title: "Notice Board", section: "Comms", query: "notices board announcements circulars", url: "/notice-board", category: "Comms" },
  { title: "Class Wall", section: "Comms", query: "class wall posts announcements timeline", url: "/class-wall", category: "Comms" },
  { title: "Telephone Directory", section: "Comms", query: "telephone directory contacts phone email", url: "/telephone", category: "Comms" },
  { title: "Discipline Record", section: "Students", query: "discipline misconduct violations records", url: "/discipline", category: "Students" },
  { title: "Task Management", section: "Tools", query: "tasks todo work items assignments progress", url: "/tasks", category: "Tools" },
  { title: "Reception Management", section: "Tools", query: "reception front desk visitor check in", url: "/reception", category: "Tools" },
  { title: "Alumni Module", section: "Community", query: "alumni graduates network engagement", url: "/alumni", category: "Community" },
  { title: "Quiz Module", section: "Academic", query: "quiz tests assessments online questions", url: "/quiz", category: "Academic" },
  { title: "Inventory Management", section: "Tools", query: "inventory stock items assets supplies", url: "/inventory", category: "Tools" },
  { title: "Accounts Management", section: "Finance", query: "accounts ledger finance accounting management", url: "/accounts", category: "Finance" },
  { title: "Scholarship Management", section: "Finance", query: "scholarship financial aid awards grants", url: "/scholarship", category: "Finance" },
  { title: "Grievance Redressal", section: "Community", query: "grievance complaints redressal feedback", url: "/grievance", category: "Community" },
  { title: "Homework Management", section: "Academic", query: "homework assignments tasks submissions", url: "/homework", category: "Academic" },
  { title: "Video Rooms", section: "Comms", query: "video rooms conferencing live sessions", url: "/video-rooms", category: "Comms" },
  { title: "Administration", section: "Settings", query: "administration admin management control panel", url: "/administration", category: "Settings" },
  { title: "System Page", section: "Settings", query: "system status health diagnostics info", url: "/system", category: "Settings" },
  { title: "IT Assets", section: "IT", query: "it assets inventory allocation maintenance", url: "/it-assets", category: "IT" },
  { title: "IT Helpdesk", section: "IT", query: "it helpdesk tickets support issues requests", url: "/it-helpdesk", category: "IT" },
  { title: "IT Labs", section: "IT", query: "it labs computer lab scheduling inventory", url: "/it-labs", category: "IT" },
  { title: "IT Network", section: "IT", query: "it network infrastructure topology monitoring", url: "/it-network", category: "IT" },
  { title: "IoT Devices", section: "IT", query: "iot devices sensors gateways telemetry", url: "/iot-devices", category: "IT" },
  { title: "Student Chat Rooms", section: "Comms", query: "chat messaging realtime conversation rooms", url: "/chat", category: "Comms" },
  { title: "Live Sessions", section: "Comms", query: "live video conferencing streaming sessions", url: "/live", category: "Comms" },
  { title: "Media File Management", section: "Tools", query: "media files images documents upload manage", url: "/media", category: "Tools" },
];

// ── Module feature entries (auto-generated from moduleConfigs) ──

const MODULE_FEATURE_ENTRIES: SearchEntry[] = Object.entries(moduleConfigs).flatMap(([key, cfg]) => {
  const moduleUrl = `/${key}`;
  const featureEntries: SearchEntry[] = cfg.features.map((feature) => ({
    title: feature,
    section: cfg.title,
    query: `${feature} ${cfg.title} ${cfg.subtitle} ${key}`,
    url: moduleUrl,
    type: "feature",
    category: cfg.title,
  }));
  return [
    { title: cfg.title, section: cfg.subtitle, query: `${cfg.title} ${cfg.subtitle} ${cfg.features.join(" ")} ${key}`, url: moduleUrl, type: "module", category: "Modules" },
    ...featureEntries,
  ];
});

// ── All static entries ──────────────────────────────────────────

const allStaticEntries = [...PAGE_ENTRIES, ...MODULE_FEATURE_ENTRIES].map((e) => ({
  ...e,
  _titleLower: e.title.toLowerCase(),
  _sectionLower: e.section.toLowerCase(),
  _queryLower: e.query.toLowerCase(),
  _categoryLower: (e.category ?? "").toLowerCase(),
}));

// ── Dynamic providers ───────────────────────────────────────────

const dynamicProviders = new Map<string, SearchProvider>();

export function registerSearchProvider(provider: SearchProvider) {
  dynamicProviders.set(provider.id, provider);
}

export function unregisterSearchProvider(id: string) {
  dynamicProviders.delete(id);
}

// ── Scoring ─────────────────────────────────────────────────────

function calculateScore(item: typeof allStaticEntries[number], queryWords: string[]): number {
  let score = 0;
  for (const word of queryWords) {
    if (item._titleLower.startsWith(word)) score += 10;
    else if (item._titleLower.includes(word)) score += 5;
    if (item._sectionLower.startsWith(word)) score += 4;
    else if (item._sectionLower.includes(word)) score += 2;
    if (item._queryLower.includes(word)) score += 1;
    if (item._categoryLower.includes(word)) score += 2;
  }
  return score;
}

// ── Main search function ────────────────────────────────────────

export async function performGlobalSearch(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const queryWords = query.toLowerCase().split(/\s+/).filter(Boolean);

  // Static entries
  const staticResults: SearchResult[] = allStaticEntries
    .map((item) => ({ title: item.title, section: item.section, query: item.query, url: item.url, type: item.type, score: calculateScore(item, queryWords), category: item.category }))
    .filter((item) => item.score > 0);

  // Dynamic provider entries
  const dynamicResults: SearchResult[] = [];
  for (const provider of dynamicProviders.values()) {
    try {
      const entries = await provider.entries();
      for (const entry of entries) {
        const _titleLower = entry.title.toLowerCase();
        const _sectionLower = entry.section.toLowerCase();
        const _queryLower = entry.query.toLowerCase();
        const _categoryLower = (entry.category ?? "").toLowerCase();
        let score = 0;
        for (const word of queryWords) {
          if (_titleLower.startsWith(word)) score += 10;
          else if (_titleLower.includes(word)) score += 5;
          if (_sectionLower.includes(word)) score += 2;
          if (_queryLower.includes(word)) score += 1;
          if (_categoryLower.includes(word)) score += 2;
        }
        if (score > 0) {
          dynamicResults.push({ title: entry.title, section: entry.section, query: entry.query, url: entry.url, type: entry.type ?? "dynamic", score, category: entry.category });
        }
      }
    } catch {
      // skip provider on error
    }
  }

  return [...staticResults, ...dynamicResults]
    .sort((a, b) => b.score - a.score)
    .slice(0, 16);
}
