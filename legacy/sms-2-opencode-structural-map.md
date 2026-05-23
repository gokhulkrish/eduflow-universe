# SMS-2 OpenCode Machine – Structural Map

> Auto-generated reference from the legacy `SMS-2.html` monolith to help humans and machines understand the architecture before migration.

## File Statistics

- Approximate characters: **3,102,377**
- Approximate lines: **80,257**
- Distinct ERP module keys discovered: **0**
- Distinct function definitions discovered: **1975**

## ERP Module Registry (keys and labels)

These `key` / `label` pairs define the high-level functional modules and workspaces inside the SMS-2 engine. This table is the primary index for inch-by-inch migration and refactor work.

| # | Module Key | Label |
|---|-----------|-------|

## Function Catalog by Responsibility

These named functions encode most of the behavior of the SMS-2 machine – dashboards, ERP module normalization, navigation, and UI render helpers.

### Other Functions

- `seedThemeBeforePaint()`
- `seedShellBeforePaint()`
- `getImportPipelineState()`
- `ensureImportPipelineDualKeyState()`
- `patchImportPipelineState()`
- `resetImportPipelineSection()`
- `setImportStepDirtyState()`
- `markImportStepDirty()`
- `clearImportStepDirty()`
- `appendImportAuditTrace()`
- `hydrateCanonicalFromCurrentState()`
- `getImportPipelineSessionId()`
- `getImportPipelineTrace()`
- `getImportPipelineSnapshots()`
- `isImportStepLocked()`
- `lockImportStep()`
- `unlockImportStep()`
- `computeImportSourceHash()`
- `computeImportMappingHash()`
- `computeImportKeyingHash()`
- `computeImportDuplicateHash()`
- `computeImportValidationHash()`
- `computeImportPreviewHash()`
- `addImportPipelineTrace()`
- `takeImportPipelineSnapshot()`
- `isStepDirty()`
- `markStepClean()`
- `markStepDirty()`
- `isImportStepDirty()`
- `resetImportStepState()`
- `invalidateImportDownstream()`
- `invalidateDownstreamSteps()`
- `invalidateDualKeyWorkflow()`
- `checkStepPrerequisite()`
- `refreshCanonicalPipelineState()`
- `resetImportPipelineState()`
- `escapeHtml()`
- `normalizePlainText()`
- `sanitizeHeaderLabel()`
- `sanitizeUserInput()`
- … (1562 more in this category)

### UI Render & Builders Functions

- `buildHeaderTabsLayout()`
- `renderActivityTracePanel()`
- `buildActivityTraceFieldDetail()`
- `renderStudentDashboard()`
- `buildUmisExactSearchData()`
- `buildGegok12FeatureSearchData()`
- `buildSectionSearchData()`
- `buildImportStepSearchData()`
- `buildErpSearchData()`
- `renderResults()`
- `renderAttendanceRiskBadge()`
- `buildSidebarHomeMarkup()`
- `buildSidebarDashboardMarkup()`
- `buildSidebarStudentGroupMarkup()`
- `buildSidebarSettingsMarkup()`
- `buildErpSidebarModuleMarkup()`
- `buildUmisReferenceWorkspaceHtml()`
- `renderGegok12FeatureCenter()`
- `renderUmisFeatureCenter()`
- `renderDashboardUmisBridge()`
- `buildFieldControl()`
- `buildUiSettingsFieldDescriptor()`
- `buildFieldAliasCatalog()`
- `renderInstituteBrandEditorState()`
- `renderInstituteBrandVisual()`
- `renderTopInstituteProfileCard()`
- `buildBatchTransferSummary()`
- `renderImportPaginationFooter()`
- `buildImportBatchSyncPayload()`
- `renderWorkspaceCanvas()`
- `renderWorkspaceCanvasEnd()`
- `renderWorkspaceCanvasStart()`
- `renderWorkspaceSection()`
- `renderWorkspaceHeader()`
- `renderContextSidebar()`
- `renderRegistryMetricsForActiveScope()`
- `renderRegistryOnce()`
- `buildHeaderLookupIndex()`
- `renderHtmlProgressively()`
- `buildImportFuzzyBigrams()`
- … (261 more in this category)

### Navigation & Launchers Functions

- `openActivityTracePanel()`
- `openStudentPortal()`
- `launchGegok12MappedFeature()`
- `openSearchDropdown()`
- `launchUmisLocalResource()`
- `launchUmisMappedFeature()`
- `openDatabase()`
- `openStudentFormRecord()`
- `openEditModal()`
- `openDestroyModal()`
- `openAddStudentSettingsGroup()`
- `openAddStudentSettingsTab()`
- `openInstituteBrandLogoPicker()`
- `openImportBatchFromHistory()`
- `openErpModuleWorkspace()`
- `showSection()`
- `openSidebar()`
- `openInstituteBrandModal()`
- `openRegisteredSaveReportDialog()`
- `openRegisteredDownloadDialog()`
- `openRegisteredControlBreakDialog()`
- `openRegisteredGroupByDialog()`
- `openRegisteredReportCenter()`
- `openRegisteredSubscriptionDialog()`
- `openRegisteredChartReport()`
- `openRegisteredPivotReport()`
- `openHomeWorkspaceEditor()`
- `openDrawer()`
- `openAdvancedSettings()`
- `openFilterAdvancedSettings()`
- `openUmisStudentForm()`
- `openAdmissionDecisionModal()`
- `openTaskDrawer()`
- `openProfileDrawer()`
- `openImportGuidance()`

### ERP Modules & Settings Functions

- `getDefaultErpModules()`
- `getDefaultErpSettings()`
- `getDefaultErpAutomations()`
- `normalizeErpModules()`
- `normalizeErpSettings()`
- `normalizeErpAutomations()`
- `normalizeErpRecord()`
- `normalizeErpActivity()`
- `normalizeErpAcademicYear()`
- `getDefaultErpAcademicYears()`
- `normalizeErpAcademicYears()`
- `normalizeErpWorkflow()`

### Compatibility & Cloning Functions

- `cloneErpModuleField()`
- `isLegacyDefaultErpModuleState()`
- `cloneHeaderRegistryFields()`
- `cloneImportPaginationState()`
- `isLegacyOverwriteImportMode()`
- `cloneImportMappingLine()`
- `cloneImportMatchConfig()`
- `cloneFeeStructureGroup()`

### Dashboard Functions

- `getDashboardUmisRoutesForTab()`
- `getDashboardTimestamp()`
- `getDashboardLeaders()`
- `getDashboardRecordDay()`
- `getDashboardWorkspaceState()`
- `getDashboardInstitutionContext()`
- `getDashboardStreamLabel()`
- `getDashboardResidenceLabel()`
- `getDashboardIncomeBand()`
- `getDashboardScholarshipScheme()`
- `getDashboardScholarshipStatus()`
- `getDashboardApbStatus()`
- `getDashboardAppealStatus()`
- `getDashboardFieldGroupRatios()`
- `getDashboardValidationBucket()`
- `getDashboardViewModels()`
- `getDashboardFilterOptions()`

## Design System & Shell Classes

These CSS class names describe the visual shell, dashboards, ERP cards, import wizards, and activity feeds of the SMS-2 UI. They are useful when recreating the look-and-feel in a component library (e.g., Tailwind or CSS Modules).

| # | Class | Notes |
|---|-------|-------|
| 1 | `.erp-sidebar-module-group` | ERP sidebar or module list |
| 2 | `.erp-sidebar-nav-item` | ERP sidebar or module list |
| 3 | `.erp-stat-icon` | ERP sidebar or module list |
| 4 | `.erp-focused-hero` | ERP sidebar or module list |
| 5 | `.erp-panel-workspace-head` | ERP sidebar or module list |
| 6 | `.erp-control-summary` | ERP sidebar or module list |
| 7 | `.erp-card-head` | ERP sidebar or module list |
| 8 | `.erp-statline` | ERP sidebar or module list |
| 9 | `.erp-list` | ERP sidebar or module list |
| 10 | `.erp-form-grid` | ERP sidebar or module list |
| 11 | `.erp-filter-bar` | ERP sidebar or module list |
| 12 | `.erp-metric` | ERP sidebar or module list |
| 13 | `.import-success-box` | Import wizard or batch tooling |
| 14 | `.import-warning-box` | Import wizard or batch tooling |
| 15 | `.import-info-box` | Import wizard or batch tooling |
| 16 | `.import-sticky-footer` | Import wizard or batch tooling |
| 17 | `.import-workspace-actions` | Import wizard or batch tooling |
| 18 | `.import-footer-actions` | Import wizard or batch tooling |
| 19 | `.import-create-grid` | Import wizard or batch tooling |
| 20 | `.import-schema-preview` | Import wizard or batch tooling |
| 21 | `.erp-module-link` | ERP sidebar or module list |
| 22 | `.erp-compact-layout` | ERP sidebar or module list |
| 23 | `.erp-secondary-collapsed` | ERP sidebar or module list |
| 24 | `.erp-reference-card` | ERP sidebar or module list |
| 25 | `.erp-reference-list` | ERP sidebar or module list |
| 26 | `.erp-control-mode` | ERP sidebar or module list |
| 27 | `.dashboard-kpi-grid` | Dashboard KPI or layout |
| 28 | `.import-guidance-card` | Import wizard or batch tooling |
| 29 | `.import-focus-mode` | Import wizard or batch tooling |
| 30 | `.import-step-heading` | Import wizard or batch tooling |
| 31 | `.import-stepper-panel` | Import wizard or batch tooling |
| 32 | `.import-step-pill` | Import wizard or batch tooling |
| 33 | `.import-batch-pagination` | Import wizard or batch tooling |
| 34 | `.import-rail-metric` | Import wizard or batch tooling |
| 35 | `.import-rail-list` | Import wizard or batch tooling |
| 36 | `.import-rail-list-item` | Import wizard or batch tooling |
| 37 | `.import-smart-panel` | Import wizard or batch tooling |
| 38 | `.import-smart-head` | Import wizard or batch tooling |
| 39 | `.import-section-chip` | Import wizard or batch tooling |
| 40 | `.import-step-progress-stat--success` | Import wizard or batch tooling |
| 41 | `.import-step-progress-stat--warning` | Import wizard or batch tooling |
| 42 | `.import-step-progress-stat--danger` | Import wizard or batch tooling |
| 43 | `.import-step-progress-stat--primary` | Import wizard or batch tooling |
| 44 | `.import-config-header-field` | Import wizard or batch tooling |
| 45 | `.import-header-search-wrap` | Import wizard or batch tooling |
| 46 | `.import-header-dropdown-item` | Import wizard or batch tooling |
| 47 | `.import-header-selected` | Import wizard or batch tooling |
| 48 | `.import-action-row` | Import wizard or batch tooling |
| 49 | `.import-action-row--footer` | Import wizard or batch tooling |
| 50 | `.import-config-mappings` | Import wizard or batch tooling |
| 51 | `.import-suggestion-strip` | Import wizard or batch tooling |
| 52 | `.dashboard-workspace` | Dashboard KPI or layout |
| 53 | `.dashboard-hero-heading` | Dashboard KPI or layout |
| 54 | `.dashboard-status-chip` | Dashboard KPI or layout |
| 55 | `.dashboard-hero-stat-card` | Dashboard KPI or layout |
| 56 | `.dashboard-submodule-head` | Dashboard KPI or layout |
| 57 | `.dashboard-filter-field` | Dashboard KPI or layout |
| 58 | `.dashboard-module-head` | Dashboard KPI or layout |
| 59 | `.dashboard-module-kpi` | Dashboard KPI or layout |
| 60 | `.dashboard-donut-center` | Dashboard KPI or layout |
| 61 | `.dashboard-comparison-top` | Dashboard KPI or layout |
| 62 | `.dashboard-progress-label` | Dashboard KPI or layout |
| 63 | `.dashboard-audit-card` | Dashboard KPI or layout |
| 64 | `.dashboard-bar-top` | Dashboard KPI or layout |
| 65 | `.dashboard-scholarship-block` | Dashboard KPI or layout |
| 66 | `.dashboard-summary-chip` | Dashboard KPI or layout |
| 67 | `.dashboard-insight-row-top` | Dashboard KPI or layout |
| 68 | `.import-stepper-bar` | Import wizard or batch tooling |
| 69 | `.dashboard-hero-actions` | Dashboard KPI or layout |
| 70 | `.import-workspace` | Import wizard or batch tooling |
| 71 | `.import-rail` | Import wizard or batch tooling |
| 72 | `.erp-sidebar-category` | ERP sidebar or module list |
| 73 | `.erp-sidebar-category-title` | ERP sidebar or module list |
| 74 | `.import-results` | Import wizard or batch tooling |
| 75 | `.sms52-shell` | SMS 52-module architecture / shell layout |
| 76 | `.sms52-shell__header` | SMS 52-module architecture / shell layout |
| 77 | `.sms52-shell__title` | SMS 52-module architecture / shell layout |
| 78 | `.sms52-shell__breadcrumbs` | SMS 52-module architecture / shell layout |
| 79 | `.sms52-domain-jumpbar` | SMS 52-module architecture / shell layout |
| 80 | `.sms52-domain-jumpchip` | SMS 52-module architecture / shell layout |
| 81 | `.sms52-domain-section` | SMS 52-module architecture / shell layout |
| 82 | `.sms52-domain-section__header` | SMS 52-module architecture / shell layout |
| 83 | `.sms52-domain-section__title` | SMS 52-module architecture / shell layout |
| 84 | `.sms52-domain-section__meta` | SMS 52-module architecture / shell layout |
| 85 | `.sms52-grid--modules` | SMS 52-module architecture / shell layout |
| 86 | `.sms52-card` | SMS 52-module architecture / shell layout |
| 87 | `.sms52-card__head` | SMS 52-module architecture / shell layout |
| 88 | `.sms52-card__title` | SMS 52-module architecture / shell layout |
| 89 | `.sms52-card__status` | SMS 52-module architecture / shell layout |
| 90 | `.sms52-badge--live` | SMS 52-module architecture / shell layout |
| 91 | `.sms52-badge--wire` | SMS 52-module architecture / shell layout |
| 92 | `.sms52-badge--soon` | SMS 52-module architecture / shell layout |
| 93 | `.sms52-card__body` | SMS 52-module architecture / shell layout |
| 94 | `.sms52-card__summary` | SMS 52-module architecture / shell layout |
| 95 | `.sms52-card__submodules` | SMS 52-module architecture / shell layout |
| 96 | `.sms52-chip` | SMS 52-module architecture / shell layout |
| 97 | `.sms52-card__actions` | SMS 52-module architecture / shell layout |
| 98 | `.sms52-card__meta` | SMS 52-module architecture / shell layout |
| 99 | `.sms52-card__audit` | SMS 52-module architecture / shell layout |
| 100 | `.sms52-empty` | SMS 52-module architecture / shell layout |
| 101 | `.sms52-empty__title` | SMS 52-module architecture / shell layout |
| 102 | `.sms52-empty__copy` | SMS 52-module architecture / shell layout |
| 103 | `.sms52-stack` | SMS 52-module architecture / shell layout |
| 104 | `.sms52-stack--horizontal` | SMS 52-module architecture / shell layout |
| 105 | `.sms52-stack--vertical` | SMS 52-module architecture / shell layout |
| 106 | `.sms52-sr-only` | SMS 52-module architecture / shell layout |
| 107 | `.erp-realtime-command-head` | ERP sidebar or module list |
| 108 | `.erp-realtime-card` | ERP sidebar or module list |
| 109 | `.import-stepper` | Import wizard or batch tooling |
| 110 | `.import-wizard-stepper` | Import wizard or batch tooling |
| 111 | `.importKeyConfig` | Import wizard or batch tooling |
| 112 | `.importHeaders` | Import wizard or batch tooling |
| 113 | `.importKeyFields` | Import wizard or batch tooling |
| 114 | `.importTargetCatalogKey` | Import wizard or batch tooling |
| 115 | `.erpWorkspaceKey` | ERP sidebar or module list |
| 116 | `.importMode` | Import wizard or batch tooling |
| 117 | `.importBatches` | Import wizard or batch tooling |
| 118 | `.importBatchesLoaded` | Import wizard or batch tooling |
| 119 | `.importKeyType` | Import wizard or batch tooling |
| 120 | `.importKeyValue` | Import wizard or batch tooling |
| … | … | … (17 more CSS classes in SMS-2.html) |

## Legacy Inline Section Headers

These comments act like section headers inside the legacy file and can be used to break the monolith into smaller source files or documentation chunks.

- GLOBAL STORE NAMES - USE THIS EVERYWHERE
- ============ CANONICAL IMPORT PIPELINE STATE HELPERS ============
- =============================================================================
- CORE ENGINE ARCHITECTURE
- EVENT BUS - Central event communication system
- Specific handlers
- Wildcard handlers (*)
- Central EventBus instance
- STATE STORE - Centralized state management
- Central Store
- MODULE REGISTRY - Module management
- WORKFLOW ENGINE - State machine for workflows
- PIPELINE MANAGER - Sequential processing pipeline
- CACHE MANAGER - Centralized caching
- DEBOUNCE & THROTTLE UTILITIES
- UI BRIDGE - Shared UI utilities
- ACTIVITY TRACKER
- ENGINE BOOTSTRAP
- Fall back to JSON cloning for older or non-cloneable payloads.
- Also get entries from engine activity tracker while the panel is visible.
- Merge and deduplicate
- Sort by timestamp
- Categorize activity actions from engine
- Subscribe to engine events and log to activity trace
- Log important events
- Auto-initialize when app is ready
- Prevent duplicate toasts for the same message/type combination
- Trigger animation
- Auto-remove
- ============ GLOBAL LIVE SEARCH ============
- Main Sections
- Import Steps & Workflow
- Dashboard Features
- Student Management Functions
- Import Batch Functions
- Keying Functions
- Settings & Configuration
- ERP/Enterprise Functions
- Common Actions & Tools
- Add click handlers
- Search on input
- Clear search
- Keyboard navigation
- Close on outside click
- Focus on Ctrl+K
- Compatibility boundary: legacy stores remain DB projections generated from registry state.
- PIPELINE PROGRESS UI
- Get latest import results from the workflow engine
- Emit event for dashboard refresh
- Wire up pipeline events to update UI
- Update sticky footer state
- Strict deterministic fields from legacy keys where possible
- Preserving old structures for backward compatibility
- fall through to defaults
- Organize fields by category for better UX
- Filter chips within groups
- Hide entire group if no fields match
- Show "no matches" message if no fields found
- Clear all selected keying fields
- ============ KEYING PRESET CUSTOMIZER ============
- Expanded preset options with multiple field support
- Categorize fields
- Load saved custom mappings or defaults
- Remove empty categories
- Collect selected fields for each preset
- Fallback to default logic if no custom mapping
- Smart preset field selector - uses custom mappings or defaults
- First try custom mappings
- Fallback to pattern matching
- Fallback to first available
- ============ DEFAULT KEYING PRESET MANAGEMENT ============
- Initialize DB table for default keying configs if needed
- Check if table exists, if needed add it to DB schema
- Table will be created on next DB upgrade if using versioning
- For now, we can use sessionStorage as fallback
- Generate smart name from field array
- Update preset button states and show/hide saved presets section
- Update both bottom and top save buttons
- Update quick access save button text based on edit state
- Update edit indicator
- … (77 more headers omitted for brevity)

## How to Use This Map

- Treat the **ERP Module Registry** table as the master checklist for migrating and documenting functionality.
- Use the **Function Catalog** to locate where dashboards, normalizers, and navigational flows live in the legacy file before extracting them into separate modules.
- Use the **Design System & Shell Classes** to recreate the UI shell and dashboards in a modern stack while preserving the original information architecture.
- Use the **Inline Section Headers** list as a guide for splitting SMS-2 into multiple files (domain-driven packages, feature folders, or Next.js route groups).
