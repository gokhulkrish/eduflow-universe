import { useCallback, useRef } from "react";
import { useRegisteredRibbon, type RibbonTab } from "@/stores/registeredRibbonStore";
import {
  Copy, ClipboardPaste, UserPlus, Pencil, Eye, FileText, Trash2, Save,
  Search, ArrowUpDown, FilterX, ArrowUpAZ, ArrowDownZA, CheckCheck,
  Users, UserCheck, UserX, GraduationCap, Award, ShieldCheck,
  UserRoundPlus, Heart, UsersRound, MapPin, Landmark, Stethoscope,
  File, AlertTriangle, Workflow, GitCompare, Replace, Undo2, ScanSearch,
  MousePointerClick, ToggleLeft, ToggleRight, Layers,
  LayoutGrid, LayoutList, Columns3, Maximize2, Minimize2,
  Lock, PanelRightOpen, PanelRightClose,
  BarChart3, PieChart, SplitSquareVertical, Save as SaveIcon,
  Printer, Download, FileJson, FileSpreadsheet, FileUp,
  FileText as FileTextReport, Bell, BookOpen, Building,
  Shield, EyeOff, History, Archive, Database,
  Table, List, PanelRight, PanelBottom, Pin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import "./registered-students.css";

export interface RibbonActionContext {
  hasRows: boolean;
  hasActiveRecord: boolean;
  hasSelection: boolean;
  selCount: number;
}

export interface RegisteredStudentsRibbonProps {
  context: RibbonActionContext;
  sortField: string;
  visibleHeaders: { key: string; label: string }[];
  deleteActionLabel?: string;
  onAction: (action: string) => void;
  onOpenColumnSettings: () => void;
  onOpenFilterSettings: () => void;
}

interface RibbonActionDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  enabled?: (ctx: RibbonActionContext) => boolean;
}

interface RibbonGroupDef {
  id: string;
  title: string;
  actions: RibbonActionDef[];
}

interface RibbonTabDef {
  id: RibbonTab;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  groups: RibbonGroupDef[];
}

const ACTION_ENABLED = {
  always: () => true,
  hasRows: (ctx: RibbonActionContext) => ctx.hasRows,
  hasSelection: (ctx: RibbonActionContext) => ctx.hasSelection || ctx.hasActiveRecord,
  hasActive: (ctx: RibbonActionContext) => ctx.hasActiveRecord,
  multiSelect: (ctx: RibbonActionContext) => ctx.selCount > 0 || ctx.hasRows,
};

const createTabs = (deleteActionLabel: string): RibbonTabDef[] => [
  {
    id: "home", label: "Home",
    groups: [
      {
        id: "clipboard", title: "Clipboard",
        actions: [
          { id: "copy-view", label: "Copy", icon: Copy, shortcut: "Ctrl+C", enabled: ACTION_ENABLED.hasSelection },
          { id: "duplicate-profile", label: "Duplicate", icon: Copy, enabled: ACTION_ENABLED.hasActive },
          { id: "paste", label: "Paste", icon: ClipboardPaste, shortcut: "Ctrl+V", enabled: ACTION_ENABLED.hasActive },
          { id: "paste-special", label: "Paste Special", icon: ClipboardPaste, enabled: ACTION_ENABLED.hasActive },
        ],
      },
      {
        id: "records", title: "Records",
        actions: [
          { id: "open-add-student", label: "New", icon: UserPlus, shortcut: "Alt+N", enabled: ACTION_ENABLED.always },
          { id: "edit-record", label: "Edit", icon: Pencil, shortcut: "Alt+E", enabled: ACTION_ENABLED.hasActive },
          { id: "view-record", label: "View", icon: Eye, shortcut: "Alt+V", enabled: ACTION_ENABLED.hasActive },
          { id: "pdf-record", label: "PDF", icon: FileText, enabled: ACTION_ENABLED.hasActive },
          { id: "delete-record", label: deleteActionLabel, icon: Trash2, shortcut: "Del", enabled: ACTION_ENABLED.hasActive },
          { id: "quick-save", label: "Quick Save", icon: Save, shortcut: "Ctrl+S", enabled: ACTION_ENABLED.hasActive },
          { id: "save-all", label: "Save All", icon: Save, enabled: ACTION_ENABLED.hasRows },
        ],
      },
      {
        id: "find", title: "Find",
        actions: [
          { id: "focus-search", label: "Name", icon: Search, shortcut: "Alt+F", enabled: ACTION_ENABLED.always },
          { id: "find-by-admission", label: "Admission", icon: Search, enabled: ACTION_ENABLED.always },
          { id: "find-by-emis", label: "EMIS", icon: Search, enabled: ACTION_ENABLED.always },
          { id: "find-by-aadhaar", label: "Aadhaar", icon: Search, enabled: ACTION_ENABLED.always },
          { id: "find-by-mobile", label: "Mobile", icon: Search, enabled: ACTION_ENABLED.always },
        ],
      },
      {
        id: "status", title: "Status",
        actions: [
          { id: "set-status-active", label: "Active", icon: UserCheck, enabled: ACTION_ENABLED.multiSelect },
          { id: "set-status-transfer", label: "Transfer", icon: UserX, enabled: ACTION_ENABLED.multiSelect },
          { id: "set-status-alumni", label: "Alumni", icon: GraduationCap, enabled: ACTION_ENABLED.multiSelect },
          { id: "set-status-dropout", label: "Dropout", icon: UserX, enabled: ACTION_ENABLED.multiSelect },
          { id: "scholarship-flag", label: "Scholar", icon: Award, enabled: ACTION_ENABLED.multiSelect },
          { id: "verification-pending", label: "Verification", icon: ShieldCheck, enabled: ACTION_ENABLED.multiSelect },
        ],
      },
    ],
  },
  {
    id: "data", label: "Data",
    groups: [
      {
        id: "settings", title: "Settings",
        actions: [
          { id: "column-settings", label: "Column Settings", icon: Table, enabled: ACTION_ENABLED.always },
          { id: "filter-settings", label: "Advanced Filters", icon: FilterX, enabled: ACTION_ENABLED.always },
          { id: "reset-filters", label: "Clear Filters", icon: FilterX, shortcut: "Alt+C", enabled: ACTION_ENABLED.always },
          { id: "sort-asc", label: "Sort A\u2192Z", icon: ArrowUpAZ, enabled: ACTION_ENABLED.hasRows },
          { id: "sort-desc", label: "Sort Z\u2192A", icon: ArrowDownZA, enabled: ACTION_ENABLED.hasRows },
        ],
      },
      {
        id: "tools", title: "Tools",
        actions: [
          { id: "validate-row", label: "Validate Row", icon: CheckCheck, enabled: ACTION_ENABLED.hasActive },
          { id: "validate-selection", label: "Validate Sel.", icon: CheckCheck, enabled: ACTION_ENABLED.hasSelection },
          { id: "highlight-missing", label: "Highlight Missing", icon: AlertTriangle, enabled: ACTION_ENABLED.hasRows },
          { id: "duplicate-detect", label: "Duplicates", icon: GitCompare, enabled: ACTION_ENABLED.hasRows },
        ],
      },
      {
        id: "maintenance", title: "Maintenance",
        actions: [
          { id: "fill-down", label: "Fill Down", icon: Layers, enabled: ACTION_ENABLED.hasSelection },
          { id: "bulk-replace", label: "Bulk Replace", icon: Replace, enabled: ACTION_ENABLED.hasSelection },
          { id: "mass-update", label: "Mass Update", icon: Workflow, enabled: ACTION_ENABLED.multiSelect },
          { id: "undo-update", label: "Undo", icon: Undo2, shortcut: "Ctrl+Z", enabled: ACTION_ENABLED.hasRows },
          { id: "format-scan", label: "Format Scan", icon: ScanSearch, enabled: ACTION_ENABLED.hasRows },
        ],
      },
      {
        id: "selection", title: "Selection",
        actions: [
          { id: "select-multiple", label: "Multi Select", icon: MousePointerClick, enabled: ACTION_ENABLED.always },
          { id: "select-all", label: "Select All", icon: ToggleRight, shortcut: "Ctrl+A", enabled: ACTION_ENABLED.hasRows },
          { id: "select-none", label: "Select None", icon: ToggleLeft, enabled: ACTION_ENABLED.always },
          { id: "invert-select", label: "Invert", icon: Layers, enabled: ACTION_ENABLED.hasRows },
          { id: "select-by-filter", label: "Select by Filter", icon: FilterX, enabled: ACTION_ENABLED.hasRows },
        ],
      },
    ],
  },
  {
    id: "insert", label: "Insert",
    groups: [
      {
        id: "related-data", title: "Related Data",
        actions: [
          { id: "add-parent", label: "Add parent", icon: UserRoundPlus, enabled: ACTION_ENABLED.hasActive },
          { id: "add-guardian", label: "Add guardian", icon: Users, enabled: ACTION_ENABLED.hasActive },
          { id: "add-sibling", label: "Add sibling", icon: UsersRound, enabled: ACTION_ENABLED.hasActive },
          { id: "add-address", label: "Add address", icon: MapPin, enabled: ACTION_ENABLED.hasActive },
          { id: "add-bank", label: "Add bank", icon: Landmark, enabled: ACTION_ENABLED.hasActive },
          { id: "add-health", label: "Add health", icon: Stethoscope, enabled: ACTION_ENABLED.hasActive },
          { id: "add-document", label: "Add document", icon: File, enabled: ACTION_ENABLED.hasActive },
          { id: "add-incident", label: "Add incident", icon: AlertTriangle, enabled: ACTION_ENABLED.hasActive },
        ],
      },
      {
        id: "academic-links", title: "Academic Links",
        actions: [
          { id: "assign-class", label: "Assign class", icon: BookOpen, enabled: ACTION_ENABLED.multiSelect },
          { id: "assign-section", label: "Assign section", icon: BookOpen, enabled: ACTION_ENABLED.multiSelect },
          { id: "assign-mentor", label: "Assign mentor", icon: Users, enabled: ACTION_ENABLED.multiSelect },
          { id: "assign-subject-group", label: "Assign subjects", icon: Layers, enabled: ACTION_ENABLED.multiSelect },
          { id: "assign-route", label: "Assign route", icon: MapPin, enabled: ACTION_ENABLED.multiSelect },
          { id: "assign-hostel", label: "Assign hostel", icon: Building, enabled: ACTION_ENABLED.multiSelect },
          { id: "assign-fee-plan", label: "Assign fee plan", icon: Landmark, enabled: ACTION_ENABLED.multiSelect },
        ],
      },
    ],
  },
  {
    id: "review", label: "Review",
    groups: [
      {
        id: "approval", title: "Approval",
        actions: [
          { id: "approve", label: "Approve", icon: CheckCheck, enabled: ACTION_ENABLED.multiSelect },
          { id: "reject", label: "Reject", icon: UserX, enabled: ACTION_ENABLED.multiSelect },
          { id: "compare-versions", label: "Compare", icon: GitCompare, enabled: ACTION_ENABLED.hasActive },
          { id: "lock-fields", label: "Lock fields", icon: Lock, enabled: ACTION_ENABLED.multiSelect },
          { id: "send-correction", label: "Correction req.", icon: Replace, enabled: ACTION_ENABLED.hasActive },
        ],
      },
      {
        id: "notes", title: "Notes",
        actions: [
          { id: "internal-note", label: "Internal note", icon: FileText, enabled: ACTION_ENABLED.hasActive },
          { id: "counselor-note", label: "Counselor note", icon: Heart, enabled: ACTION_ENABLED.hasActive },
          { id: "principal-note", label: "Principal note", icon: Shield, enabled: ACTION_ENABLED.hasActive },
          { id: "parent-request", label: "Parent request", icon: Users, enabled: ACTION_ENABLED.hasActive },
        ],
      },
    ],
  },
  {
    id: "importExport", label: "Import/Export",
    groups: [
      {
        id: "import", title: "Import",
        actions: [
          { id: "open-import", label: "Import", icon: FileUp, shortcut: "Alt+I", enabled: ACTION_ENABLED.always },
          { id: "download-template", label: "Template", icon: FileTextReport, enabled: ACTION_ENABLED.always },
        ],
      },
      {
        id: "export", title: "Export",
        actions: [
          { id: "export-csv", label: "Export CSV", icon: FileSpreadsheet, enabled: ACTION_ENABLED.hasRows },
          { id: "export-xlsx", label: "Export XLSX", icon: FileSpreadsheet, enabled: ACTION_ENABLED.hasRows },
          { id: "export-json", label: "Export JSON", icon: FileJson, enabled: ACTION_ENABLED.hasRows },
          { id: "export-gov-format", label: "Gov Format", icon: FileTextReport, enabled: ACTION_ENABLED.hasRows },
          { id: "download-report", label: "Download", icon: Download, enabled: ACTION_ENABLED.hasRows },
          { id: "print-grid", label: "Print", icon: Printer, shortcut: "Ctrl+P", enabled: ACTION_ENABLED.hasRows },
        ],
      },
      {
        id: "reports", title: "Reports",
        actions: [
          { id: "save-report", label: "Save Report", icon: SaveIcon, enabled: ACTION_ENABLED.hasRows },
          { id: "open-report-center", label: "Report Center", icon: BarChart3, enabled: ACTION_ENABLED.always },
          { id: "subscription", label: "Subscribe", icon: Bell, enabled: ACTION_ENABLED.always },
        ],
      },
    ],
  },
  {
    id: "advanced", label: "\u2699\uFE0F Advanced",
    groups: [
      {
        id: "format", title: "Format",
        actions: [
          { id: "view-grid", label: "Grid", icon: LayoutGrid, enabled: ACTION_ENABLED.always },
          { id: "view-card", label: "Card", icon: LayoutList, enabled: ACTION_ENABLED.always },
          { id: "view-split", label: "Split", icon: Columns3, enabled: ACTION_ENABLED.always },
          { id: "toggle-compact", label: "Compact", icon: Minimize2, enabled: ACTION_ENABLED.always },
          { id: "toggle-wrap", label: "Wrap", icon: Maximize2, enabled: ACTION_ENABLED.always },
          { id: "toggle-freeze-first", label: "Freeze identity", icon: Pin, enabled: ACTION_ENABLED.always },
          { id: "toggle-freeze-actions", label: "Freeze actions", icon: PanelRightClose, enabled: ACTION_ENABLED.always },
          { id: "toggle-banded", label: "Banded", icon: Layers, enabled: ACTION_ENABLED.always },
          { id: "toggle-focus", label: "Focus", icon: Eye, enabled: ACTION_ENABLED.always },
        ],
      },
      {
        id: "chart-pivot", title: "Chart & Pivot",
        actions: [
          { id: "compute-summary", label: "Summary", icon: BarChart3, enabled: ACTION_ENABLED.hasRows },
          { id: "chart-report", label: "Chart", icon: PieChart, enabled: ACTION_ENABLED.hasRows },
          { id: "pivot-report", label: "Pivot", icon: SplitSquareVertical, enabled: ACTION_ENABLED.hasRows },
          { id: "group-by", label: "Group By", icon: Layers, enabled: ACTION_ENABLED.hasRows },
          { id: "control-break", label: "Break", icon: PanelBottom, enabled: ACTION_ENABLED.hasRows },
        ],
      },
    ],
  },
  {
    id: "admin", label: "Admin",
    groups: [
      {
        id: "governance", title: "Governance",
        actions: [
          { id: "permissions", label: "Permissions", icon: Shield, enabled: ACTION_ENABLED.always },
          { id: "field-visibility", label: "Field visibility", icon: EyeOff, enabled: ACTION_ENABLED.always },
          { id: "audit-log", label: "Audit log", icon: History, enabled: ACTION_ENABLED.always },
          { id: "restore-version", label: "Restore", icon: Undo2, enabled: ACTION_ENABLED.always },
          { id: "retention-policies", label: "Retention", icon: Database, enabled: ACTION_ENABLED.always },
        ],
      },
    ],
  },
];

const TAB_ORDER: RibbonTab[] = ["home", "data", "insert", "review", "importExport", "advanced", "admin"];

export function RegisteredStudentsRibbon({
  context,
  sortField,
  visibleHeaders,
  deleteActionLabel = "Delete",
  onAction,
  onOpenColumnSettings,
  onOpenFilterSettings,
}: RegisteredStudentsRibbonProps) {
  const { activeTab, setActiveTab, sortDirection, setSortField, setSortDirection } = useRegisteredRibbon();
  const tabBarRef = useRef<HTMLDivElement>(null);

  const tabs = createTabs(deleteActionLabel);
  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        const idx = TAB_ORDER.indexOf(activeTab);
        if (idx > 0) setActiveTab(TAB_ORDER[idx - 1]);
      } else if (e.key === "ArrowRight") {
        const idx = TAB_ORDER.indexOf(activeTab);
        if (idx < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[idx + 1]);
      } else if (e.key === "Home") {
        setActiveTab(TAB_ORDER[0]);
      } else if (e.key === "End") {
        setActiveTab(TAB_ORDER[TAB_ORDER.length - 1]);
      }
    },
    [activeTab, setActiveTab],
  );

  const isActionEnabled = (action: RibbonActionDef) => {
    if (!action.enabled) return true;
    return action.enabled(context);
  };

  const handleActionClick = (actionId: string) => {
    if (actionId === "sort-asc") setSortDirection("asc");
    else if (actionId === "sort-desc") setSortDirection("desc");
    else if (actionId === "column-settings") onOpenColumnSettings();
    else if (actionId === "filter-settings") onOpenFilterSettings();
    onAction(actionId);
  };

  return (
    <section
      className="registered-ribbon registered-ribbon--excel rounded-lg border border-border/60 bg-card/90 backdrop-blur-sm"
      id="registeredRibbon"
      onKeyDown={handleKeyDown}
    >
      {/* Tab Bar */}
      <div className="ribbon-tab-bar" ref={tabBarRef} role="tablist" aria-label="Ribbon tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={cn("ribbon-tab", activeTab === tab.id && "active")}
            onClick={() => setActiveTab(tab.id)}
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`ribbonPanel${tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}`}
          className={cn("ribbon-panel", activeTab === tab.id && "active")}
        >
          {tab.groups.map((group) => (
            <div key={group.id} className="ribbon-group">
              <div className="flex flex-wrap gap-0.5">
                {group.actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    data-ribbon-action={action.id}
                    id={
                      action.id === "edit-record" ? "registeredRibbonEditBtn" :
                      action.id === "view-record" ? "registeredRibbonViewBtn" :
                      action.id === "pdf-record" ? "registeredRibbonPdfBtn" :
                      action.id === "delete-record" ? "registeredRibbonDeleteBtn" :
                      action.id === "copy-view" ? "registeredRibbonCopyBtn" :
                      action.id === "toggle-compact" ? "registeredRibbonCompactBtn" :
                      action.id === "toggle-wrap" ? "registeredRibbonWrapBtn" :
                      action.id === "toggle-freeze-first" ? "registeredRibbonFreezeFirstBtn" :
                      action.id === "toggle-freeze-actions" ? "registeredRibbonFreezeActionsBtn" :
                      action.id === "toggle-banded" ? "registeredRibbonBandedBtn" :
                      action.id === "toggle-focus" ? "registeredRibbonFocusBtn" :
                      action.id === "select-multiple" ? "registeredRibbonSelectMultipleBtn" :
                      action.id === "sort-asc" ? "registeredRibbonSortAscBtn" :
                      action.id === "sort-desc" ? "registeredRibbonSortDescBtn" :
                      undefined
                    }
                    disabled={!isActionEnabled(action)}
                    className="ribbon-action"
                    onClick={() => handleActionClick(action.id)}
                    title={action.shortcut ? `${action.label} (${action.shortcut})` : action.label}
                  >
                    <action.icon className="h-4 w-4" />
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
              <span className="ribbon-group-title">{group.title}</span>
            </div>
          ))}

          {/* Sort field select on Data tab */}
          {tab.id === "data" && (
            <div className="flex items-center gap-1.5 ml-2 self-center">
              <label htmlFor="registeredRibbonSortField" className="text-[10px] text-muted-foreground">
                Sort by:
              </label>
              <select
                id="registeredRibbonSortField"
                className="ribbon-sort-field"
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
              >
                {visibleHeaders
                  .filter((h) => h.key !== "studentKey")
                  .map((h) => (
                    <option key={h.key} value={h.key}>
                      {h.label}
                    </option>
                  ))}
              </select>
              <span className="text-[10px] text-muted-foreground">
                {sortDirection === "asc" ? "\u2191 asc" : "\u2193 desc"}
              </span>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
