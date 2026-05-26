import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  KeyRound,
  PencilLine,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/PageHeader";
import { StickyActionBar } from "@/components/StickyActionBar";
import {
  buildHeaderRegistryDiagnostics,
  buildInstituteDefaultHeaders,
  buildRegistrySections,
  clearFetchedHeaders,
  deleteCustomImportField,
  deleteFilterPreset,
  deleteImportProfile,
  getHeaderFieldByKey,
  getHeaderFields,
  getRegistryStorageKeys,
  initRegistryStorage,
  instituteRegistryStorageKey,
  invalidateRegistryCache,
  loadCustomImportFields,
  loadFetchedHeaders,
  loadFilterPresets,
  loadHeaderRegistrySettings,
  loadRegistryFromSupabase,
  persistHeaderRegistryCompatibilityProjections,
  registryStorageKey,
  resetHeaderRegistrySettings,
  saveCustomHeaderFromForm,
  saveCustomImportField,
  saveFilterPreset,
  saveHeaderRegistrySettings,
  syncRegistryToSupabase,
  type FetchedHeader,
  type FilterCondition,
  type FilterPreset,
} from "@/lib/header-registry";
import {
  getImportTargetFieldOptions,
  importStorageKeys,
  loadImportProfiles,
  type ImportCustomFieldDefinition,
  type ImportProfile,
  type ImportTargetBinding,
} from "@/lib/student-import";
import { toast } from "sonner";
import { subscribeAppSync } from "@/lib/app-sync";
import {
  loadRegistryAiState,
  saveRegistryAiState,
  rebuildRegistryAiReviewQueue,
  approveRegistryAiMapping,
  rejectRegistryAiMapping,
  type RegistryAiState,
} from "@/lib/registry-ai-queue";
import { getCanonicalRegistryCatalog } from "@/lib/canonical-student-fields";
import RegistryExplorer from "@/components/registry/RegistryExplorer";
import RegistryDiagnosticsView from "@/components/registry/RegistryDiagnosticsView";

const createEmptyCustomFieldDraft = () => ({
  key: "",
  label: "",
  type: "text" as ImportCustomFieldDefinition["type"],
  options: "",
  defaultValue: "",
  notes: "",
  aliases: "",
});



const splitListInput = (value: string) =>
  value
    .split(/[\n,]/g)
    .map((entry) => entry.trim())
    .filter(Boolean);

export default function SettingsHeaders() {
  const [registryTab, setRegistryTab] = useState('overview');
  const [registrySettings, setRegistrySettings] = useState(() => loadHeaderRegistrySettings());
  const [customFields, setCustomFields] = useState(() => loadCustomImportFields());
  const [profiles, setProfiles] = useState(() => loadImportProfiles());
  const [fetchedHeaders, setFetchedHeaders] = useState(() => loadFetchedHeaders());
  const [filterPresets, setFilterPresets] = useState(() => loadFilterPresets());
  const [customFieldDraft, setCustomFieldDraft] = useState(createEmptyCustomFieldDraft);
  const [editingCustomFieldId, setEditingCustomFieldId] = useState<string | null>(null);
  const [explorerQuery, setExplorerQuery] = useState("");
  const [explorerModuleScope, setExplorerModuleScope] = useState<"all" | "core" | "custom" | "fetched">("all");
  const [explorerStatusScope, setExplorerStatusScope] = useState<"all" | "visible" | "hidden">("all");
  const [filterDraftName, setFilterDraftName] = useState("");
  const [filterDraftField, setFilterDraftField] = useState("");
  const [filterDraftOperator, setFilterDraftOperator] = useState<FilterCondition["operator"]>("eq");
  const [filterDraftValue, setFilterDraftValue] = useState("");
  const [aiState, setAiState] = useState<RegistryAiState>(() => loadRegistryAiState());

  const registrySections = useMemo(() => buildRegistrySections(customFields, registrySettings), [customFields, registrySettings]);
  const fieldOptions = useMemo(() => getImportTargetFieldOptions(customFields), [customFields]);
  const activeProfile = profiles.find((profile) => profile.id === registrySettings.activeProfileId) ?? null;
  const diagnostics = useMemo(
    () => buildHeaderRegistryDiagnostics(customFields, profiles, registrySettings),
    [customFields, profiles, registrySettings]
  );

  useEffect(() => {
    initRegistryStorage();
    return subscribeAppSync([...getRegistryStorageKeys(), importStorageKeys.customFields, importStorageKeys.profiles], () => {
      setRegistrySettings(loadHeaderRegistrySettings());
      setCustomFields(loadCustomImportFields());
      setProfiles(loadImportProfiles());
      setFetchedHeaders(loadFetchedHeaders());
      setFilterPresets(loadFilterPresets());
    });
  }, []);

  const rebuildAiQueue = useCallback(() => {
    const canonicalCatalog = getCanonicalRegistryCatalog();
    const detectedHeaderNames = fetchedHeaders.map(h => h.name);
    if (detectedHeaderNames.length === 0) return;
    const current = loadRegistryAiState();
    const nextState = rebuildRegistryAiReviewQueue(detectedHeaderNames, canonicalCatalog, current);
    saveRegistryAiState(nextState);
    setAiState(nextState);
  }, [fetchedHeaders]);

  useEffect(() => {
    rebuildAiQueue();
  }, [rebuildAiQueue]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tab) setRegistryTab(detail.tab);
    };
    window.addEventListener('sms:navigate-registry-tab', handler);
    return () => window.removeEventListener('sms:navigate-registry-tab', handler);
  }, []);

  const explorerCustomFields = useMemo(() => {
    const q = explorerQuery.trim().toLowerCase();
    if (!q) return customFields;
    return customFields.filter((field) =>
      [field.label, field.key, field.notes, ...(field.aliases ?? [])].join(" ").toLowerCase().includes(q)
    );
  }, [customFields, explorerQuery]);

  const explorerSections = useMemo(() => {
    const q = explorerQuery.trim().toLowerCase();
    return registrySections.filter((section) => {
      const queryMatch =
        !q ||
        [section.key, section.title, section.description ?? "", section.source, ...section.fields.map((field) => field.label ?? field.name)]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const moduleMatch = explorerModuleScope === "all" || section.source === explorerModuleScope;
      const statusMatch =
        explorerStatusScope === "all" ||
        (explorerStatusScope === "visible" ? section.enabled : !section.enabled);
      return queryMatch && moduleMatch && statusMatch;
    });
  }, [explorerModuleScope, explorerQuery, explorerStatusScope, registrySections]);

  const activeCoreSections = useMemo(
    () => registrySections.filter((section) => section.source === "core"),
    [registrySections]
  );

  const refreshSnapshot = () => {
    invalidateRegistryCache();
    setRegistrySettings(loadHeaderRegistrySettings());
    setCustomFields(loadCustomImportFields());
    setProfiles(loadImportProfiles());
    setFetchedHeaders(loadFetchedHeaders());
    setFilterPresets(loadFilterPresets());
    toast.success("Header registry refreshed");
  };

  const moveSection = (sectionKey: string, direction: -1 | 1) => {
    const order = [...registrySettings.sectionOrder];
    const index = order.indexOf(sectionKey);
    if (index < 0) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= order.length) return;
    [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
    setRegistrySettings((current) => ({ ...current, sectionOrder: order }));
  };

  const updateSection = (sectionKey: string, patch: { title?: string; description?: string; enabled?: boolean }) => {
    setRegistrySettings((current) => {
      const nextLabels = { ...current.sectionLabels };
      const nextDescriptions = { ...current.sectionDescriptions };
      const nextHidden = new Set(current.hiddenSectionKeys);

      if (patch.title !== undefined) nextLabels[sectionKey] = patch.title;
      if (patch.description !== undefined) nextDescriptions[sectionKey] = patch.description;
      if (patch.enabled !== undefined) {
        if (patch.enabled) nextHidden.delete(sectionKey);
        else nextHidden.add(sectionKey);
      }

      return {
        ...current,
        sectionLabels: nextLabels,
        sectionDescriptions: nextDescriptions,
        hiddenSectionKeys: [...nextHidden],
      };
    });
  };

  const handleSaveRegistry = () => {
    const saved = saveHeaderRegistrySettings(registrySettings);
    setRegistrySettings(saved);
    persistHeaderRegistryCompatibilityProjections();
    invalidateRegistryCache();
    toast.success("Header registry saved");
  };

  const handleResetRegistry = () => {
    const saved = resetHeaderRegistrySettings();
    setRegistrySettings(saved);
    invalidateRegistryCache();
    toast.success("Header registry reset to defaults");
  };

  const handleSaveCustomField = () => {
    const key = customFieldDraft.key.trim();
    const label = customFieldDraft.label.trim();
    if (!key || !label) {
      toast.error("Custom fields need both a key and a label.");
      return;
    }

    const saved = saveCustomHeaderFromForm({
      key,
      label,
      type: customFieldDraft.type as "text" | "number" | "date" | "textarea" | "select",
      options: splitListInput(customFieldDraft.options),
      defaultValue: customFieldDraft.defaultValue,
      aliases: splitListInput(customFieldDraft.aliases),
    });

    invalidateRegistryCache();
    setCustomFields(loadCustomImportFields());
    setCustomFieldDraft(createEmptyCustomFieldDraft());
    setEditingCustomFieldId(null);
    toast.success(`Saved custom field "${saved.label}"`);
  };

  const handleEditCustomField = (field: ImportCustomFieldDefinition) => {
    setCustomFieldDraft({
      key: field.key,
      label: field.label,
      type: field.type,
      options: field.options.join(", "),
      defaultValue: field.defaultValue,
      notes: field.notes,
      aliases: field.aliases.join(", "),
    });
    setEditingCustomFieldId(field.id);
  };

  const handleDeleteCustomField = (fieldId: string) => {
    deleteCustomImportField(fieldId);
    invalidateRegistryCache();
    setCustomFields(loadCustomImportFields());
    if (editingCustomFieldId === fieldId) {
      setEditingCustomFieldId(null);
      setCustomFieldDraft(createEmptyCustomFieldDraft());
    }
    toast.success("Custom field removed.");
  };

  const handleActivateProfile = (profile: ImportProfile) => {
    const next = saveHeaderRegistrySettings({ ...registrySettings, activeProfileId: profile.id });
    setRegistrySettings(next);
    toast.success(`Activated "${profile.name}".`);
  };

  const handleDeactivateProfile = () => {
    const next = saveHeaderRegistrySettings({ ...registrySettings, activeProfileId: null });
    setRegistrySettings(next);
    toast.info("Active preset cleared.");
  };

  const handleDeleteProfile = (profileId: string) => {
    deleteImportProfile(profileId);
    setProfiles(loadImportProfiles());
    if (registrySettings.activeProfileId === profileId) {
      const next = saveHeaderRegistrySettings({ ...registrySettings, activeProfileId: null });
      setRegistrySettings(next);
    }
    toast.success("Import preset removed.");
  };

  const handleClearFetchedHeaders = () => {
    clearFetchedHeaders();
    setFetchedHeaders(loadFetchedHeaders());
    invalidateRegistryCache();
    toast.success("Fetched headers cleared.");
  };

  const handleConvertToCustomField = (header: FetchedHeader) => {
    const key = header.name.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
    const saved = saveCustomImportField({
      key,
      label: header.label,
      type: "text",
      options: [],
      defaultValue: "",
      notes: header.name,
      aliases: [header.name],
    });
    invalidateRegistryCache();
    setCustomFields(loadCustomImportFields());
    toast.success(`Converted to custom field "${saved.label}"`);
  };

  const handleSaveFilterPreset = () => {
    const name = filterDraftName.trim();
    const field = filterDraftField.trim();
    const value = filterDraftValue.trim();
    if (!name || !field || !value) {
      toast.error("Filter preset needs a name, field, and value.");
      return;
    }
    const saved = saveFilterPreset({
      name,
      conditions: [{ field, operator: filterDraftOperator, value }],
    });
    setFilterPresets(loadFilterPresets());
    setFilterDraftName("");
    setFilterDraftField("");
    setFilterDraftOperator("eq");
    setFilterDraftValue("");
    toast.success(`Saved filter preset "${saved.name}"`);
  };

  const handleDeleteFilterPreset = (id: string) => {
    deleteFilterPreset(id);
    setFilterPresets(loadFilterPresets());
    toast.success("Filter preset deleted.");
  };

  return (
    <div>
      <PageHeader
        title="Headers & Field Registry"
        subtitle="The canonical registry for core sections, custom headers, import presets, and default keying."
        icon={<Settings2 className="h-6 w-6" />}
        actions={
          <>
            <Button variant="outline" className="rounded-xl" onClick={async () => { try { await loadRegistryFromSupabase(); refreshSnapshot(); toast.success("Registry loaded from cloud"); } catch (err) { toast.error(`Load failed: ${err instanceof Error ? err.message : "Unknown"}`); } }}>
              Load Cloud
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={async () => { const saved = saveHeaderRegistrySettings(registrySettings); setRegistrySettings(saved); persistHeaderRegistryCompatibilityProjections(); invalidateRegistryCache(); try { await syncRegistryToSupabase(); toast.success("Registry saved and synced to cloud"); } catch (err) { toast.success("Registry saved locally (cloud sync failed)"); } }}>
              Sync Cloud
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={refreshSnapshot}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={handleResetRegistry}>
              Reset
            </Button>
          </>
        }
      />

      <Tabs value={registryTab} onValueChange={setRegistryTab}>
        <TabsList className="mb-4 w-full flex-nowrap overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="explorer">Explorer</TabsTrigger>
          <TabsTrigger value="canonical-fields">Canonical Fields</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="mapping">Mapping</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="fetched">Fetched</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <Card className="glass p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Core sections</p>
              <p className="mt-2 font-display text-3xl font-bold">{activeCoreSections.length}</p>
            </Card>
            <Card className="glass p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Custom headers</p>
              <p className="mt-2 font-display text-3xl font-bold">{customFields.length}</p>
            </Card>
            <Card className="glass p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Fetched columns</p>
              <p className="mt-2 font-display text-3xl font-bold">{fetchedHeaders.length}</p>
            </Card>
            <Card className="glass p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Filter presets</p>
              <p className="mt-2 font-display text-3xl font-bold">{filterPresets.length}</p>
            </Card>
            <Card className="glass p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active preset</p>
              <p className="mt-2 truncate font-display text-lg font-semibold">{activeProfile?.name || "None selected"}</p>
            </Card>
            <Card className="glass p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Default key</p>
              <p className="mt-2 truncate font-mono text-sm">{registrySettings.defaultBinding}</p>
            </Card>
          </div>
          <Card className="glass p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Registry Snapshot</p>
              </div>
              <Badge variant="secondary">{registrySections.filter((section) => section.enabled).length} enabled</Badge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {registrySections.slice(0, 6).map((section) => (
                <div key={section.key} className="rounded-xl border border-border/60 bg-card/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{section.title}</p>
                    <Badge variant="secondary" className="text-[10px]">{section.source}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{section.fields.length} fields</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="explorer" className="space-y-4">
          <Card className="glass p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold">Explorer</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">{explorerCustomFields.length} custom fields</Badge>
                <Badge variant="secondary">{explorerSections.length} matching sections</Badge>
              </div>
            </div>
            <div className="mt-4 grid gap-3 xl:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs" htmlFor="explorerSearch">Search</Label>
                <Input id="explorerSearch" name="explorerSearch" value={explorerQuery} onChange={(event) => setExplorerQuery(event.target.value)} placeholder="Search headers, notes, aliases..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs" htmlFor="explorerModuleScope">Module Scope</Label>
                <Select name="explorerModuleScope" value={explorerModuleScope} onValueChange={(value) => setExplorerModuleScope(value as typeof explorerModuleScope)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All modules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All modules</SelectItem>
                    <SelectItem value="core">Core modules</SelectItem>
                    <SelectItem value="custom">Custom headers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs" htmlFor="explorerStatusScope">Status</Label>
                <Select name="explorerStatusScope" value={explorerStatusScope} onValueChange={(value) => setExplorerStatusScope(value as typeof explorerStatusScope)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="visible">Visible</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {explorerCustomFields.length ? (
                explorerCustomFields.map((field) => (
                  <div key={field.id} className="rounded-xl border border-border/60 bg-card/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{field.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{field.key} · v{field.version}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{field.type}</Badge>
                    </div>
                    {field.notes ? <p className="mt-2 text-xs text-muted-foreground">{field.notes}</p> : null}
                  </div>
                ))
              ) : (
                <Card className="border-dashed border-border/60 bg-card/40 p-5 text-sm text-muted-foreground">
                  No matches.
                </Card>
              )}
            </div>
            <div className="mt-4 rounded-xl border border-border/60 bg-card/30 p-4">
              <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Module Snapshot</p>
                  </div>
                <Badge variant="secondary">{explorerSections.length} visible</Badge>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {explorerSections.length ? (
                  explorerSections.slice(0, 8).map((section) => (
                    <div key={section.key} className="rounded-xl border border-border/60 bg-card/60 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{section.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{section.key}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                          {section.source}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {section.enabled ? "Visible in the active registry surface." : "Hidden from the active registry surface."}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
                    No sections match the filters.
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="glass p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold">Custom Header Registry</h3>
              </div>
              <Badge variant="secondary">{customFields.length} saved</Badge>
            </div>
            <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-3 rounded-2xl border border-border/60 bg-card/60 p-4">
                <div className="grid gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs" htmlFor="cfKey">Key</Label>
                    <Input id="cfKey" name="cfKey" value={customFieldDraft.key} onChange={(event) => setCustomFieldDraft((current) => ({ ...current, key: event.target.value }))} placeholder="house_code" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs" htmlFor="cfLabel">Label</Label>
                    <Input id="cfLabel" name="cfLabel" value={customFieldDraft.label} onChange={(event) => setCustomFieldDraft((current) => ({ ...current, label: event.target.value }))} placeholder="House Code" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs" htmlFor="cfType">Type</Label>
                    <Select name="cfType"
                      value={customFieldDraft.type}
                      onValueChange={(value) => setCustomFieldDraft((current) => ({ ...current, type: value as ImportCustomFieldDefinition["type"] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="textarea">Textarea</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs" htmlFor="cfOptions">Options</Label>
                    <Textarea
                      id="cfOptions"
                      name="cfOptions"
                      rows={3}
                      value={customFieldDraft.options}
                      onChange={(event) => setCustomFieldDraft((current) => ({ ...current, options: event.target.value }))}
                      placeholder="Comma or newline separated options"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs" htmlFor="cfDefault">Default Value</Label>
                    <Input
                      id="cfDefault"
                      name="cfDefault"
                      value={customFieldDraft.defaultValue}
                      onChange={(event) => setCustomFieldDraft((current) => ({ ...current, defaultValue: event.target.value }))}
                      placeholder="Optional default"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs" htmlFor="cfAliases">Aliases</Label>
                    <Textarea
                      id="cfAliases"
                      name="cfAliases"
                      rows={2}
                      value={customFieldDraft.aliases}
                      onChange={(event) => setCustomFieldDraft((current) => ({ ...current, aliases: event.target.value }))}
                      placeholder="Comma or newline separated aliases"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs" htmlFor="cfNotes">Notes</Label>
                    <Textarea
                      id="cfNotes"
                      name="cfNotes"
                      rows={3}
                      value={customFieldDraft.notes}
                      onChange={(event) => setCustomFieldDraft((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Usage notes"
                    />
                  </div>
                </div>
              </div>

              <StickyActionBar className="justify-end">
                <Button className="rounded-xl" onClick={handleSaveCustomField}>
                  <Plus className="mr-2 h-4 w-4" />
                  {editingCustomFieldId ? "Update Custom Field" : "Add Custom Field"}
                </Button>
                
              </StickyActionBar>

              <div className="space-y-2">
                {customFields.length ? (
                  customFields.map((field) => (
                    <div key={field.id} className="rounded-2xl border border-border/60 bg-card/60 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{field.label}</p>
                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{field.type}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{field.key} · v{field.version}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            onClick={() => handleEditCustomField(field)}
                            aria-label={`Edit custom field ${field.label}`}
                            title={`Edit ${field.label}`}
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-warning hover:text-warning"
                            onClick={() => handleDeleteCustomField(field.id)}
                            aria-label={`Delete custom field ${field.label}`}
                            title={`Delete ${field.label}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {field.notes ? <p className="mt-2 text-xs text-muted-foreground">{field.notes}</p> : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
                    No custom headers yet.
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="canonical-fields" className="space-y-4">
          <RegistryExplorer />
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <Card className="glass p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold">Modules</h3>
              </div>
              <Badge variant="secondary">{activeCoreSections.length} modules</Badge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {activeCoreSections.map((section) => (
                <Card key={section.key} className="border-border/60 bg-card/60 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{section.title}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{section.fields.length} fields</Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Switch id={`module-${section.key}`} checked={section.enabled} onCheckedChange={(checked) => updateSection(section.key, { enabled: checked })} />
                    <span className="text-xs text-muted-foreground">{section.enabled ? "Visible" : "Hidden"}</span>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          {registrySections.map((section) => (
            <Card key={section.key} className="glass p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-semibold">{section.title}</h3>
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                      {section.source === "core" ? "Core" : "Custom"}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">{section.fields.length} fields</Badge>
                  </div>
                  
                </div>
                <div className="flex items-center gap-2">
                  <Switch id={`group-${section.key}`} checked={section.enabled} onCheckedChange={(checked) => updateSection(section.key, { enabled: checked })} />
                  {section.source === "core" ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => moveSection(section.key, -1)}
                        disabled={section.order === 0}
                        aria-label={`Move ${section.title} up`}
                        title={`Move ${section.title} up`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => moveSection(section.key, 1)}
                        disabled={section.order >= activeCoreSections.length - 1}
                        aria-label={`Move ${section.title} down`}
                        title={`Move ${section.title} down`}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs" htmlFor={`label-${section.key}`}>Section Label</Label>
                  <Input id={`label-${section.key}`} name={section.key} value={registrySettings.sectionLabels[section.key] ?? section.title} onChange={(event) => updateSection(section.key, { title: event.target.value })} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs" htmlFor={`desc-${section.key}`}>Description</Label>
                  <Textarea id={`desc-${section.key}`} name={`desc-${section.key}`} value={registrySettings.sectionDescriptions[section.key] ?? section.description ?? ""} onChange={(event) => updateSection(section.key, { description: event.target.value })} rows={3} />
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <Card className="glass p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-base font-semibold">Mapping</h3>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs" htmlFor="primaryKey">Primary Key</Label>
                <Select name="primaryKey"
                  value={registrySettings.defaultBinding}
                  onValueChange={(value) => setRegistrySettings((current) => ({ ...current, defaultBinding: value as ImportTargetBinding }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldOptions.map((field) => (
                      <SelectItem key={field.key} value={field.key}>
                        {field.label} ({field.key})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-xl border border-info/30 bg-info/10 p-4 text-xs">
                <p className="font-semibold text-info"><span className="font-mono">{registrySettings.defaultBinding}</span></p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-4">
          <Card className="glass p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold">Profiles</h3>
              </div>
              <Button variant="outline" className="rounded-xl" onClick={() => void refreshSnapshot()}>
                Refresh
              </Button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {profiles.length ? (
                profiles.map((profile) => (
                  <Card key={profile.id} className="border-border/60 bg-card/60 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{profile.name}</p>
                          {registrySettings.activeProfileId === profile.id ? (
                            <Badge variant="secondary" className="bg-success/15 text-success">Active</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">v{profile.version} · {profile.rule} · {profile.design}</p>
                      </div>
                      {profile.updatedAt ? <Badge variant="secondary">{profile.updatedAt.slice(0, 10)}</Badge> : null}
                    </div>
                    {profile.description ? <p className="mt-2 text-xs text-muted-foreground">{profile.description}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => handleActivateProfile(profile)}>Activate</Button>
                      <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => handleDeleteProfile(profile.id)}>Delete</Button>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="border-dashed border-border/60 bg-card/40 p-5 text-sm text-muted-foreground">
                  No saved presets yet.
                </Card>
              )}
            </div>
            <StickyActionBar className="justify-end">
              <Button variant="outline" className="rounded-xl" onClick={handleDeactivateProfile}>Clear Active Preset</Button>
            </StickyActionBar>
          </Card>
        </TabsContent>

        <TabsContent value="fetched" className="space-y-4">
          <Card className="glass p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold">Fetched Headers</h3>
                <p className="text-xs text-muted-foreground">Columns auto-discovered from imports</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{fetchedHeaders.length} headers</Badge>
                <Button variant="outline" size="sm" className="rounded-lg text-warning" onClick={handleClearFetchedHeaders} disabled={!fetchedHeaders.length}>
                  <Trash2 className="mr-1 h-3 w-3" /> Clear All
                </Button>
              </div>
            </div>
            {fetchedHeaders.length ? (
              <div className="mt-4 space-y-2">
                {fetchedHeaders.map((header) => (
                  <div key={header.name} className="flex items-start justify-between rounded-xl border border-border/60 bg-card/60 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{header.label || header.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <span className="font-mono">{header.name}</span>
                        {" · "}seen {header.matchCount}x
                        {" · "}{header.firstSeen.slice(0, 10)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px]">{header.lastSeen.slice(0, 10)}</Badge>
                      <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs" onClick={() => handleConvertToCustomField(header)}>
                        + Convert
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No fetched headers yet. Import a file to auto-discover columns.</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-4">
          <Card className="glass p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold">Filter Presets</h3>
                <p className="text-xs text-muted-foreground">Saved filter configurations</p>
              </div>
              <Badge variant="secondary">{filterPresets.length} presets</Badge>
            </div>
            {filterPresets.length ? (
              <div className="mt-4 space-y-2">
                {filterPresets.map((preset) => (
                  <div key={preset.id} className="flex items-start justify-between rounded-xl border border-border/60 bg-card/60 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{preset.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {preset.conditions.length} condition{preset.conditions.length !== 1 ? "s" : ""}
                        {" · "}{preset.updatedAt.slice(0, 10)}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {preset.conditions.map((condition, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] font-mono">
                            {condition.field} {condition.operator} {Array.isArray(condition.value) ? condition.value.join(",") : condition.value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 w-7 rounded-lg text-warning" onClick={() => handleDeleteFilterPreset(preset.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No filter presets saved yet.</p>
            )}
            <div className="mt-6 rounded-xl border border-border/60 bg-card/40 p-4">
              <p className="text-sm font-semibold mb-3">New Filter Preset</p>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs" htmlFor="filterName">Name</Label>
                  <Input id="filterName" name="filterName" value={filterDraftName} onChange={(e) => setFilterDraftName(e.target.value)} placeholder="e.g. Active Students" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs" htmlFor="filterField">Field</Label>
                  <Input id="filterField" name="filterField" value={filterDraftField} onChange={(e) => setFilterDraftField(e.target.value)} placeholder="e.g. status" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs" htmlFor="filterOperator">Operator</Label>
                  <Select name="filterOperator" value={filterDraftOperator} onValueChange={(v) => setFilterDraftOperator(v as FilterCondition["operator"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eq">= equals</SelectItem>
                      <SelectItem value="neq">≠ not equals</SelectItem>
                      <SelectItem value="contains">contains</SelectItem>
                      <SelectItem value="gt">&gt; greater than</SelectItem>
                      <SelectItem value="gte">≥ greater/equal</SelectItem>
                      <SelectItem value="lt">&lt; less than</SelectItem>
                      <SelectItem value="lte">≤ less/equal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs" htmlFor="filterValue">Value</Label>
                  <div className="flex gap-1 items-end">
                    <Input id="filterValue" name="filterValue" value={filterDraftValue} onChange={(e) => setFilterDraftValue(e.target.value)} placeholder="e.g. active" />
                    <Button size="sm" className="rounded-lg" onClick={handleSaveFilterPreset} disabled={!filterDraftName || !filterDraftField || !filterDraftValue}>
                      <Plus className="mr-1 h-3 w-3" /> Add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <RegistryDiagnosticsView
            aiState={aiState}
            structuralIssues={diagnostics.issues}
            onApprove={(detectedHeader, fieldKey) => {
              const next = approveRegistryAiMapping(detectedHeader, fieldKey, aiState);
              saveRegistryAiState(next);
              setAiState(next);
              window.dispatchEvent(new CustomEvent('sms:ai-state-changed'));
            }}
            onReject={(detectedHeader, fieldKey) => {
              const next = rejectRegistryAiMapping(detectedHeader, fieldKey, aiState);
              saveRegistryAiState(next);
              setAiState(next);
              window.dispatchEvent(new CustomEvent('sms:ai-state-changed'));
            }}
            onRebuild={() => { rebuildAiQueue(); toast.success('AI queue rebuilt'); }}
            onRefresh={() => rebuildAiQueue()}
          />
        </TabsContent>
      </Tabs>

      <StickyActionBar className="justify-end">
        <Button className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90" onClick={handleSaveRegistry}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </StickyActionBar>
    </div>
  );
}
