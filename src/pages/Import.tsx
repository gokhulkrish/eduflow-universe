import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Cog,
  Database,
  DollarSign,
  Eye,
  FileSpreadsheet,
  Hand,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  FolderOpen,
  Trash2,
  Undo2,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { PageHeader } from "@/components/PageHeader";
import { StickyActionBar } from "@/components/StickyActionBar";
import ImportBatchDetailDialog from "@/components/ImportBatchDetailDialog";
import ImportDetectedHeaders from "@/components/import/ImportDetectedHeaders";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import {
  buildAutoMappingReport,
  buildImportPreview,
  deleteCustomImportField,
  deleteImportProfile,
  getImportTargetFieldGroups,
  importTransferRules,
  loadCustomImportFields,
  loadImportBatchHistory,
  loadImportProfiles,
  loadExistingStudentsForImport,
  saveCustomImportField,
  saveImportProfile,
  importStorageKeys,
  type ExistingStudentRecord,
  type ImportCustomFieldDefinition,
  type ImportCommitResult,
  type ImportDuplicateGroupDecision,
  type ImportBatchHistoryEntry,
  type ImportProfile,
  type ImportResolvedAction,
  type ImportTargetBinding,
  type ImportTransferRule,
  type ParsedImportFile,
  type ImportPreviewState,
  buildImportAiReviewQueue,
  type AiReviewQueueResult,
  CRITICAL_IMPORT_FIELDS,
  scanCriticalFieldIssues,
  type DuplicateIssue,
  scanDuplicateIssues,
  scanImportDuplicateAliases,
  type DuplicateAliasIssue,
  scanImportOrphanGroups,
  type OrphanGroup,
  scanImportProfileWarnings,
  type ProfileWarning,
  computeFieldDiffs,
  duplicateIssueStage,
  importFieldGroups,
  type ImportTargetField,
  type CriticalFieldDef,
} from "@/lib/student-import";
import { resolveDuplicateFeedbackLoop, resolveMissingFieldsFeedbackLoop, emitImportAlert } from "@/lib/student-workspace-messaging";
import { cacheDuplicateGroups, loadCachedDuplicateGroups, saveDuplicateIssues, loadDuplicateIssues } from "@/lib/duplicate-issues-store";
import { CANONICAL_FIELDS } from "@/engine/registry/canonical";
import {
  approveRegistryAiMapping,
  ignoreRegistryAiHeader,
  loadRegistryAiState,
  saveRegistryAiState,
  type RegistryAiState,
} from "@/lib/registry-ai-queue";
import { validateRow } from "@/lib/import-engine/validation";
import {
  invalidateRegistryCache,
  loadHeaderRegistrySettings,
  registryStorageKey,
  saveHeaderRegistrySettings,
} from "@/lib/header-registry";
import {
  createImportBatch,
  importBatchSyncKey,
  saveImportBatches,
  loadImportBatchesFromDB,
  deleteImportBatch as deleteBatchFromDB,
  rollbackImport,
  storeRollbackSnapshot,
  createImportPipelineState,
  invalidateImportDownstream,
  invalidateDualKeyWorkflow,
  markStepDirty,
  clearStepDirty,
  refreshCanonicalPipelineState,
  checkStepPrerequisite,
  getAllModuleDescriptors,
  getModule,
  bootstrapImportEngine,
  getImportEngineRuntimeSnapshot,
  getImportFileSignature,
  findImportMappingTemplate,
  deleteImportMappingTemplatesByProfile,
  recordImportMappingTemplateUsage,
  saveImportMappingTemplate,
  getImportValidationRuntimeSnapshot,
  runImportValidationCycle,
  subscribeImportValidationRuntime,
  parseImportFileCached,
  resetImportEngineSession,
  setImportRuntimeActiveBatch,
  buildImportValidationReport,
  type ImportBatch,
  type ImportPipelineStep,
  type ImportPipelineState,
  type ImportModule,
  type ImportModuleFieldGroup,
  type ImportMatchStrategy,
  type ImportMode,
  type ImportMappingTemplate,
  IMPORT_MODE_CONFIGS,
  ensureImportHeaders,
  getImportSchemaDriftReport,
  buildGenericPreview,
  type ImportPreviewSummary,
  type ImportSchemaDriftReport,
  type ImportValidationReport,
  type ImportValidationRuntimeSnapshot,
} from "@/lib/import-engine";

const STEPS = [
  { id: "analyze", title: "Analyze", icon: FileSpreadsheet, caption: "Parse + profile columns" },
  { id: "create", title: "Create Batch", icon: Save, caption: "Name + config" },
  { id: "headers", title: "Headers", icon: ClipboardCheck, caption: "Review detected columns" },
  { id: "map", title: "Schema Mapping", icon: Cog, caption: "Map source -> target" },
  { id: "keying", title: "Keying", icon: KeyRound, caption: "Match design" },
  { id: "dupe", title: "Duplicates", icon: Database, caption: "Resolve conflicts" },
  { id: "validate", title: "Validation", icon: ShieldCheck, caption: "Review issues" },
  { id: "preview", title: "Preview", icon: Eye, caption: "Diff before commit" },
  { id: "transfer", title: "Transfer", icon: Send, caption: "Commit to register" },
  { id: "finalize", title: "Finalize", icon: CheckCircle2, caption: "Archive + refresh" },
] as const;

const getDefaultBatchName = (fileName: string) => fileName.replace(/\.[^.]+$/, "") || fileName;

const getReadableFileType = (file: ParsedImportFile | null) =>
  file ? `${file.sourceType.toUpperCase()} file` : "No file selected";

const formatRowCount = (count: number) => new Intl.NumberFormat("en-IN").format(count);

const createEmptyCustomFieldDraft = () => ({
  key: "",
  label: "",
  type: "text" as ImportCustomFieldDefinition["type"],
  options: "",
  defaultValue: "",
  notes: "",
  aliases: "",
});

const createEmptyProfileDraft = () => ({
  name: "",
  description: "",
});

const ENUM_ISSUE_RE = /(.+) must be one of: (.+)/;

const parseEnumIssue = (detail: string): { fieldKey: string; fieldLabel: string; validValues: string[] } | null => {
  const match = detail.match(ENUM_ISSUE_RE);
  if (!match) return null;
  const fieldLabel = match[1];
  const validValues = match[2].split(", ").map((v) => v.trim()).filter(Boolean);
  const field = CANONICAL_FIELDS.find((f) => f.label === fieldLabel && f.enumValues);
  if (!field) return null;
  return { fieldKey: field.key, fieldLabel, validValues };
};

const splitListInput = (value: string) =>
  value
    .split(/[\n,]/g)
    .map((entry) => entry.trim())
    .filter(Boolean);

const summarizeExisting = (row: ExistingStudentRecord | null) => {
  if (!row) return "No existing match";
  return [row.admission_no, row.display_name].filter(Boolean).join(" · ");
};

const applyRegistryPresetMapping = (
  headers: string[],
  customFields: ImportCustomFieldDefinition[],
  profile: ImportProfile | null,
  recoveredTemplate: ImportMappingTemplate | null = null,
) => {
  const preferredBindings = (profile?.mapping ?? recoveredTemplate?.mapping ?? {}) as Record<string, ImportTargetBinding>;
  return buildAutoMappingReport(headers, customFields, { preferredBindings }).mapping;
};

export default function Import() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [moduleId, setModuleId] = useState("students");
  const [mode, setMode] = useState<ImportMode>("hybrid");
  const [modules, setModules] = useState<{ id: string; name: string; description: string; icon: string }[]>([]);
  const [batchName, setBatchName] = useState("");
  const [batchDescription, setBatchDescription] = useState("");
  const [rule, setRule] = useState<ImportTransferRule>("Update If Blank");
  const [design, setDesign] = useState<ImportMatchStrategy>("reg_umis_emis");
  const [threshold, setThreshold] = useState(88);
  const [file, setFile] = useState<File | null>(null);
  const [parsedFile, setParsedFile] = useState<ParsedImportFile | null>(null);
  const [mapping, setMapping] = useState<Record<string, ImportTargetBinding>>({});
  const [groupOverrides, setGroupOverrides] = useState<Record<string, ImportDuplicateGroupDecision>>({});
  const [actionOverrides, setActionOverrides] = useState<Record<string, ImportResolvedAction>>({});
  const [existingRows, setExistingRows] = useState<ExistingStudentRecord[]>([]);
  const [registrySettings, setRegistrySettings] = useState(() => loadHeaderRegistrySettings());
  const [customFields, setCustomFields] = useState<ImportCustomFieldDefinition[]>([]);
  const [profiles, setProfiles] = useState<ImportProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [existingError, setExistingError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [committing, setCommitting] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [commitResult, setCommitResult] = useState<ImportCommitResult | null>(null);
  const [historyEntries, setHistoryEntries] = useState<ImportBatchHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [customFieldDraft, setCustomFieldDraft] = useState(createEmptyCustomFieldDraft);
  const [profileDraft, setProfileDraft] = useState(createEmptyProfileDraft);

  const [savedBatches, setSavedBatches] = useState<ImportBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [detailBatch, setDetailBatch] = useState<ImportBatch | null>(null);
  const [autoCommitPending, setAutoCommitPending] = useState(false);
  const [recoveredMappingTemplate, setRecoveredMappingTemplate] = useState<ImportMappingTemplate | null>(null);
  const [validationRuntimeSnapshot, setValidationRuntimeSnapshot] = useState<ImportValidationRuntimeSnapshot>(() =>
    getImportValidationRuntimeSnapshot(),
  );
  const [valueOverrides, setValueOverrides] = useState<Record<string, Record<string, string>>>({});
  const [editTarget, setEditTarget] = useState<{
    rowKey: string;
    fieldKey: string;
    fieldLabel: string;
    currentValue: string;
    validValues: string[];
  } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [reviewQueueOpen, setReviewQueueOpen] = useState(false);
  const [mapNowTarget, setMapNowTarget] = useState<string | null>(null);
  const [registryAiState, setRegistryAiState] = useState<RegistryAiState>(() => loadRegistryAiState());

  const updateRegistryAiState = (next: RegistryAiState) => {
    saveRegistryAiState(next);
    setRegistryAiState(next);
  };

  const pipelineRef = useRef<ImportPipelineState>(createImportPipelineState());
  const importInitRef = useRef(false);
  const savedBatchesRef = useRef(savedBatches);
  const processedFileSignatureRef = useRef<string | null>(null);
  const profilesRef = useRef(profiles);
  profilesRef.current = profiles;
  const registrySettingsRef = useRef(registrySettings);
  registrySettingsRef.current = registrySettings;
  const validationAuditSignatureRef = useRef<string>("");
  savedBatchesRef.current = savedBatches;
  const importFormStateRef = useRef({
    batchName,
    batchDescription,
    moduleId,
    mode,
    rule,
    design,
  });
  importFormStateRef.current = {
    batchName,
    batchDescription,
    moduleId,
    mode,
    rule,
    design,
  };

  const getCurrentBatch = (): ImportBatch | null => {
    const runtime = getImportEngineRuntimeSnapshot();
    if (runtime.activeBatchId) {
      const active = savedBatches.find((batch) => batch.batchId === runtime.activeBatchId);
      if (active) return active;
    }
    return savedBatches[0] ?? null;
  };

  const tryNavigateTo = (targetStep: number) => {
    const batch = getCurrentBatch();
    if (!batch) { setStep(targetStep); return; }
    const stepName = ["analyze", "create", "headers", "map", "keying", "duplicates", "validate", "preview", "transfer", "finalize"][targetStep] as ImportPipelineStep;
    const p = pipelineRef.current;
    p.currentStep = stepName as ImportPipelineStep;
    const check = checkStepPrerequisite(p, stepName as ImportPipelineStep, batch);
    if (!check.pass) { toast.error(check.reason); return; }
    clearStepDirty(p, stepName);
    setStep(targetStep);
  };

  const toImportTransferRule = (mode: string): ImportTransferRule => {
    if (importTransferRules.includes(mode as ImportTransferRule)) return mode as ImportTransferRule;
    const modeToRule: Record<string, ImportTransferRule> = {
      newentry: "New Entry Only",
      update: "Update Existing Only",
      upsert: "Upsert",
      skip: "Insert New, Ignore Existing",
    };
    return modeToRule[mode] ?? "Update If Blank";
  };

  const toImportMatchDesign = (strategy: string): ImportMatchStrategy => {
    const mod = getModule(moduleId);
    const valid = mod?.matchStrategies?.some((s) => s.id === strategy);
    return (valid ? strategy : (mod?.matchStrategies?.[0]?.id ?? "reg_umis_emis")) as ImportMatchStrategy;
  };

  useEffect(() => {
    if (importInitRef.current) return;
    importInitRef.current = true;

    let alive = true;
    const init = async () => {
      try {
        await bootstrapImportEngine();
        const descriptors = getAllModuleDescriptors();
        if (alive) setModules(descriptors);
        const batches = await loadImportBatchesFromDB();
        if (alive) setSavedBatches(batches);
      } catch {
        importInitRef.current = false;
        if (alive) setModules(getAllModuleDescriptors());
      } finally {
        if (alive) setLoadingBatches(false);
      }
    };
    void init();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoadingExisting(true);
      setExistingError(null);
      try {
        await bootstrapImportEngine();
        const mod = getModule(moduleId);
        if (!mod) throw new Error(`Module "${moduleId}" not found`);
        const records = await mod.adapter.loadExistingRecords();
        if (!alive) return;
        setExistingRows(records as ExistingStudentRecord[]);
      } catch (error) {
        if (!alive) return;
        setExistingError(error instanceof Error ? error.message : "Failed to load existing records");
      } finally {
        if (alive) setLoadingExisting(false);
      }
    };

    void load();

    return () => {
      alive = false;
    };
  }, [moduleId]);

  useEffect(() => {
    setCustomFields(loadCustomImportFields());
    setProfiles(loadImportProfiles());
    setRegistrySettings(loadHeaderRegistrySettings());
  }, []);

  useEffect(() => {
    return subscribeAppSync([registryStorageKey, importStorageKeys.customFields, importStorageKeys.profiles], () => {
      setCustomFields(loadCustomImportFields());
      setProfiles(loadImportProfiles());
      setRegistrySettings(loadHeaderRegistrySettings());
    });
  }, []);

  useEffect(() => {
    const mod = getModule(moduleId);
    if (mod?.matchStrategies?.length && !mod.matchStrategies.some((s) => s.id === design)) {
      setDesign(mod.matchStrategies[0].id as ImportMatchStrategy);
    }
    if (Object.keys(groupOverrides).length > 0) setGroupOverrides({});
    if (Object.keys(actionOverrides).length > 0) setActionOverrides({});
  }, [design, moduleId, groupOverrides, actionOverrides]);

  useEffect(() => {
    let alive = true;

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const entries = await loadImportBatchHistory(8);
        if (!alive) return;
        setHistoryEntries(entries);
      } catch {
        if (!alive) return;
        setHistoryEntries([]);
      } finally {
        if (alive) setLoadingHistory(false);
      }
    };

    void loadHistory();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!file) {
        processedFileSignatureRef.current = null;
        resetImportEngineSession("file-cleared");
        setParsedFile(null);
        setParseError(null);
        setCommitResult(null);
        setGroupOverrides({});
        setActionOverrides({});
        setRecoveredMappingTemplate(null);
        return;
      }

      setParsing(true);
      setParseError(null);
      setCommitResult(null);

      try {
        const signature = getImportFileSignature(file);
        if (processedFileSignatureRef.current === signature) return;
        processedFileSignatureRef.current = signature;

        const previousRuntime = getImportEngineRuntimeSnapshot();
        if (previousRuntime.activeFileSignature !== signature) {
          setImportRuntimeActiveBatch(null);
        }

        const parsed = await parseImportFileCached(file);
        if (!alive) return;
        const form = importFormStateRef.current;
        try {
          await ensureImportHeaders(form.moduleId, parsed.headers, file.name);
        } catch {
          // header creation is best-effort
        }
        setParsedFile(parsed);
        const updatedCustomFields = loadCustomImportFields();
        setCustomFields(updatedCustomFields);
        const { activeProfileId } = registrySettingsRef.current;
        const activeProfile = profilesRef.current.find((profile) => profile.id === activeProfileId) ?? null;
        setSelectedProfileId(activeProfile?.id ?? "");
        const mappingTemplateMatch = findImportMappingTemplate(parsed.headers, form.moduleId, {
          customFieldIds: updatedCustomFields.map((field) => field.id),
        });
        setRecoveredMappingTemplate(mappingTemplateMatch?.template ?? null);

        const isManual = form.mode === "manual";
        const preferredBindings = isManual
          ? Object.fromEntries(parsed.headers.map((h) => [h, "ignore" as ImportTargetBinding]))
          : (activeProfile?.mapping as Record<string, ImportTargetBinding> | undefined) ??
            mappingTemplateMatch?.template.mapping;
        const autoMappingReport = buildAutoMappingReport(parsed.headers, updatedCustomFields, {
          preferredBindings,
        });
        setMapping(autoMappingReport.mapping);
        setGroupOverrides({});
        setActionOverrides({});
        if (!activeProfile && mappingTemplateMatch?.template?.id) {
          recordImportMappingTemplateUsage(mappingTemplateMatch.template.id);
        }

        const reusedBatch =
          previousRuntime.activeFileSignature === signature && previousRuntime.activeBatchId
            ? savedBatchesRef.current.find((batch) => batch.batchId === previousRuntime.activeBatchId) ?? null
            : null;

        const engineBatch =
          reusedBatch ??
          createImportBatch({
            batchName: form.batchName.trim() || getDefaultBatchName(file.name),
            batchDescription: form.batchDescription.trim(),
            moduleId: form.moduleId,
            mode: form.mode,
            sourceRows: parsed.rows,
            importHeaders: parsed.headers,
            defaultImportType:
              form.rule === "Update Existing Only" ? "update" : form.rule === "New Entry Only" ? "newentry" : form.rule === "Upsert" ? "upsert" : "newentry",
            transferRule: form.rule,
            matchStrategy: form.design,
          });

        engineBatch.batchName = form.batchName.trim() || getDefaultBatchName(parsed.fileName);
        engineBatch.batchDescription = form.batchDescription.trim();
        engineBatch.moduleId = form.moduleId;
        engineBatch.mode = form.mode;
        engineBatch.sourceRows = parsed.rows.map((row) => ({ ...row }));
        engineBatch.importHeaders = [...parsed.headers];
        engineBatch.rowCount = parsed.rows.length;
        engineBatch.defaultImportType =
          form.rule === "Update Existing Only" ? "update" : form.rule === "New Entry Only" ? "newentry" : form.rule === "Upsert" ? "upsert" : "newentry";
        engineBatch.transferRule = form.rule;
        engineBatch.matchStrategy = form.design;
        engineBatch.mappingLines = parsed.headers.map((h) => {
          const target = autoMappingReport.mapping[h];
          return {
            importField: h,
            targetField: target && target !== "ignore" ? target : null,
            transferMode: "newentry" as const,
            isRequired: false,
          };
        });

        if (reusedBatch) {
          setSavedBatches((prev) => prev.map((batch) => (batch.batchId === engineBatch.batchId ? engineBatch : batch)));
        } else {
          setSavedBatches((prev) => [engineBatch, ...prev.filter((batch) => batch.batchId !== engineBatch.batchId)]);
        }

        await saveImportBatches([engineBatch]);
        setImportRuntimeActiveBatch(engineBatch.batchId);
        refreshCanonicalPipelineState(pipelineRef.current, engineBatch);
        setStep(form.mode === "auto" ? 8 : 2);

        if (form.mode === "auto" && !alive) return;
        if (form.mode === "auto") {
          setAutoCommitPending(true);
        }
      } catch (error) {
        if (!alive) return;
        const message = error instanceof Error ? error.message : "Failed to parse file";
        setParseError(message);
        setParsedFile(null);
        setRecoveredMappingTemplate(null);
        toast.error(message);
      } finally {
        if (alive) setParsing(false);
      }
    };

    void run();

    return () => {
      alive = false;
    };
  }, [file]);

  const resolvedMapping = useMemo(() => {
    if (!parsedFile) return mapping;
    const preferredBindings = Object.fromEntries(
      Object.entries(mapping).filter(([, target]) => target && target !== "ignore"),
    ) as Record<string, ImportTargetBinding>;
    return buildAutoMappingReport(parsedFile.headers, customFields, {
      preferredBindings,
    }).mapping;
  }, [customFields, mapping, parsedFile]);

  useEffect(() => {
    const runtime = getImportEngineRuntimeSnapshot();
    const batch = runtime.activeBatchId
      ? savedBatches.find((candidate) => candidate.batchId === runtime.activeBatchId) ?? savedBatches[0] ?? null
      : savedBatches[0] ?? null;
    if (!batch || !parsedFile) return;
    batch.batchName = batchName.trim() || getDefaultBatchName(parsedFile.fileName);
    batch.batchDescription = batchDescription.trim();
    batch.matchStrategy = design;
    const updatedMapping = parsedFile.headers.map((h) => ({
      importField: h,
      targetField: resolvedMapping[h] && resolvedMapping[h] !== "ignore" ? resolvedMapping[h] : null,
      transferMode: "newentry" as const,
      isRequired: false,
    }));
    batch.mappingLines = updatedMapping;
    void saveImportBatches([batch]);
    invalidateImportDownstream(pipelineRef.current, "map", batch, "batch-updated");
  }, [batchDescription, batchName, design, parsedFile, resolvedMapping, savedBatches]);

  const handleResumeBatch = async (batch: ImportBatch) => {
    setBatchName(batch.batchName);
    setBatchDescription(batch.batchDescription);
    setModuleId(batch.moduleId || "students");
    setMode(batch.mode || "hybrid");
    setRule(batch.transferRule as ImportTransferRule ?? toImportTransferRule(batch.defaultImportType));
    setDesign(batch.matchStrategy);
    setThreshold(88);
    setMapping(
      Object.fromEntries(
        batch.mappingLines.map((m) => [m.importField, (m.targetField as ImportTargetBinding) || "ignore"]),
      ),
    );
    setSavedBatches((prev) => [batch, ...prev.filter((b) => b.batchId !== batch.batchId)]);
    setImportRuntimeActiveBatch(batch.batchId);
    setStep(Math.min(step, 3));
    invalidateImportDownstream(pipelineRef.current, "map", batch, "batch-resumed");
    refreshCanonicalPipelineState(pipelineRef.current, batch);
    toast.success(`Resumed batch "${batch.batchName}".`);
  };

  const handleDeleteSavedBatch = async (batchId: string) => {
    try {
      await deleteBatchFromDB(batchId);
      const runtime = getImportEngineRuntimeSnapshot();
      if (runtime.activeBatchId === batchId) {
        setImportRuntimeActiveBatch(null);
      }
      setSavedBatches((prev) => prev.filter((b) => b.batchId !== batchId));
      toast.success("Batch deleted.");
    } catch {
      toast.error("Failed to delete batch.");
    }
  };

  const [preview, setPreview] = useState<ImportPreviewState | null>(null);

  useEffect(() => {
    if (!parsedFile || step < 4) {
      if (preview !== null) setPreview(null);
      return;
    }
    const mod = getModule(moduleId);
    if (mod?.fieldGroups && moduleId !== "students") {
      setPreview(buildGenericPreview(parsedFile, resolvedMapping, mod.fieldGroups, customFields) as unknown as ImportPreviewState);
    } else {
      setPreview(buildImportPreview(parsedFile, resolvedMapping, existingRows, {
        design: design as any,
        threshold,
        rule,
        customFields,
        groupOverrides,
        actionOverrides,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionOverrides, customFields, design, existingRows, groupOverrides, moduleId, parsedFile, resolvedMapping, rule, threshold, step]);

  const activeRegistryProfile = useMemo(
    () =>
      profiles.find((profile) => profile.id === selectedProfileId) ??
      profiles.find((profile) => profile.id === registrySettings.activeProfileId) ??
      null,
    [profiles, registrySettings.activeProfileId, selectedProfileId]
  );

  const duplicateGroups = useMemo(() => {
    if (!preview) return [];
    const grouped = new Map<string, typeof preview.rows>();
    for (const row of preview.rows) {
      const bucket = grouped.get(row.identityKey) ?? [];
      bucket.push(row);
      grouped.set(row.identityKey, bucket);
    }

    return [...grouped.entries()]
      .filter(([, rows]) => rows.length > 1 || rows.some((row) => row.existing))
      .map(([identityKey, rows]) => ({
        identityKey,
        rows,
      }))
      .sort((left, right) => right.rows.length - left.rows.length);
  }, [preview]);

  const runtimeSnapshot = getImportEngineRuntimeSnapshot();
  const currentBatch = useMemo<ImportBatch | null>(() => {
    if (runtimeSnapshot.activeBatchId) {
      return savedBatches.find((batch) => batch.batchId === runtimeSnapshot.activeBatchId) ?? savedBatches[0] ?? null;
    }
    return savedBatches[0] ?? null;
  }, [runtimeSnapshot.activeBatchId, savedBatches]);

  const validationBatch = useMemo<ImportBatch | null>(() => (currentBatch ? { ...currentBatch } : null), [currentBatch]);

  const effectivePreview = useMemo<ImportPreviewState | null>(() => {
    if (!preview || Object.keys(valueOverrides).length === 0) return preview;
    const overriddenRows = preview.rows.map((row) => {
      const overrides = valueOverrides[row.rowKey];
      if (!overrides) return row;
      const newMapped = { ...row.mapped };
      for (const [fieldKey, value] of Object.entries(overrides)) {
        newMapped[fieldKey] = value;
      }
      const newIssues = validateRow(newMapped);
      const newDiffs = computeFieldDiffs(row.existing, newMapped);
      return { ...row, mapped: newMapped, validationIssues: newIssues, fieldDiffs: newDiffs };
    });
    const summary = overriddenRows.reduce<ImportPreviewSummary>(
      (acc, row) => {
        acc.total += 1;
        acc.valid += row.validationIssues.length ? 0 : 1;
        acc.invalid += row.validationIssues.length ? 1 : 0;
        acc.inserts += row.action === "insert" ? 1 : 0;
        acc.updates += row.action === "update" ? 1 : 0;
        acc.skips += row.action === "skip" ? 1 : 0;
        acc.reviews += row.action === "review" ? 1 : 0;
        acc.exactMatches += row.duplicateStatus === "exact" ? 1 : 0;
        acc.fuzzyMatches += row.duplicateStatus === "fuzzy" ? 1 : 0;
        acc.internalDuplicates += row.duplicateStatus === "internal-duplicate" ? 1 : 0;
        return acc;
      },
      { total: 0, valid: 0, invalid: 0, inserts: 0, updates: 0, skips: 0, reviews: 0, exactMatches: 0, fuzzyMatches: 0, internalDuplicates: 0 },
    );
    return { rows: overriddenRows, summary };
  }, [preview, valueOverrides]);

  const validationReport = useMemo<ImportValidationReport>(
    () => buildImportValidationReport(validationBatch, effectivePreview),
    [effectivePreview, validationBatch],
  );

  const stepPct = Math.round(((step + 1) / STEPS.length) * 100);
  const Active = STEPS[step].icon;

  const mappingStats = useMemo(() => {
    const mapped = Object.values(mapping).filter((value) => value !== "ignore").length;
    return {
      mapped,
      ignored: Math.max(0, (parsedFile?.headers.length ?? 0) - mapped),
    };
  }, [mapping, parsedFile?.headers.length]);

  const registryMappingStats = useMemo(() => {
    const presetBindings = activeRegistryProfile ? Object.values(activeRegistryProfile.mapping ?? {}).filter((value) => value !== "ignore").length : 0;
    return {
      defaultBinding: registrySettings.defaultBinding,
      activeProfileName: activeRegistryProfile?.name ?? "None selected",
      presetBindings,
    };
  }, [activeRegistryProfile, registrySettings.defaultBinding]);

  const driftReport = useMemo<ImportSchemaDriftReport | null>(() => {
    if (!parsedFile) return null;
    return getImportSchemaDriftReport(moduleId, parsedFile.headers);
  }, [parsedFile, moduleId]);

  const moduleFieldGroups = useMemo(() => {
    const mod = getModule(moduleId);
    if (mod?.fieldGroups) {
      const customGroup: ImportModuleFieldGroup | null = customFields.length > 0 ? {
        title: "Custom",
        fields: customFields.map(f => ({
          key: `custom:${f.id}`,
          label: f.label || f.key,
          aliases: [f.key, f.label, ...(f.aliases ?? [])].filter(Boolean),
        })),
      } : null;
      const groups = [...mod.fieldGroups];
      if (customGroup) groups.push(customGroup);
      return groups;
    }
    return getImportTargetFieldGroups(customFields);
  }, [moduleId, customFields]);

  const aiReviewQueue = useMemo<AiReviewQueueResult | null>(() => {
    if (!parsedFile) return null;
    try {
      return buildImportAiReviewQueue(parsedFile.headers);
    } catch { return null; }
  }, [parsedFile]);

  const criticalFieldIssues = useMemo(() => {
    if (!preview?.rows.length) return { issues: [], hardBlocking: 0, softWarnings: 0, byField: {} } as ReturnType<typeof scanCriticalFieldIssues>;
    return scanCriticalFieldIssues(preview.rows);
  }, [preview]);

  const duplicateIssues = useMemo<DuplicateIssue[]>(() => {
    if (duplicateGroups.length === 0) return [];
    const active = currentBatch?.batchId;
    return scanDuplicateIssues(duplicateGroups, active ?? "unknown", currentBatch?.batchName);
  }, [duplicateGroups, currentBatch]);

  const duplicateAliasIssues = useMemo<DuplicateAliasIssue[]>(() => {
    return scanImportDuplicateAliases(customFields);
  }, [customFields]);

  const orphanGroups = useMemo<OrphanGroup[]>(() => {
    return scanImportOrphanGroups(mapping, customFields);
  }, [mapping, customFields]);

  const profileWarnings = useMemo<ProfileWarning[]>(() => {
    return scanImportProfileWarnings(profiles, profileDraft.name, customFields);
  }, [profiles, profileDraft.name, customFields]);

  const handleRefreshExisting = async () => {
    setLoadingExisting(true);
    setExistingError(null);
    try {
      const mod = getModule(moduleId);
      const rows = mod ? await mod.adapter.loadExistingRecords() : await loadExistingStudentsForImport();
      setExistingRows(rows as ExistingStudentRecord[]);
      toast.success(`Register refreshed with ${rows.length} rows.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to refresh register";
      setExistingError(message);
      toast.error(message);
    } finally {
      setLoadingExisting(false);
    }
  };

  const handleRefreshHistory = async () => {
    setLoadingHistory(true);
    try {
      const entries = await loadImportBatchHistory(8);
      setHistoryEntries(entries);
    } catch {
      setHistoryEntries([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleMappingChange = (header: string, value: string) => {
    setMapping((current) => ({
      ...current,
      [header]: value as ImportTargetBinding,
    }));
  };

  const handleReloadRegistry = () => {
    setRegistrySettings(loadHeaderRegistrySettings());
    setCustomFields(loadCustomImportFields());
    setProfiles(loadImportProfiles());
  };

  const handleSaveCustomField = () => {
    const key = customFieldDraft.key.trim();
    const label = customFieldDraft.label.trim();
    if (!key || !label) {
      toast.error("Custom fields need both a key and a label.");
      return;
    }

    const saved = saveCustomImportField({
      key,
      label,
      type: customFieldDraft.type,
      options: splitListInput(customFieldDraft.options),
      defaultValue: customFieldDraft.defaultValue,
      notes: customFieldDraft.notes,
      aliases: splitListInput(customFieldDraft.aliases),
    });

    const nextFields = loadCustomImportFields();
    setCustomFields(nextFields);
    invalidateRegistryCache();
    if (parsedFile) {
      setMapping(applyRegistryPresetMapping(parsedFile.headers, nextFields, activeRegistryProfile, recoveredMappingTemplate));
    }
    setCustomFieldDraft(createEmptyCustomFieldDraft());
    toast.success(`Saved custom field "${saved.label}" v${saved.version}.`);
  };

  const handleDeleteCustomField = (fieldId: string) => {
    deleteCustomImportField(fieldId);
    const nextFields = loadCustomImportFields();
    setCustomFields(nextFields);
    invalidateRegistryCache();
    if (parsedFile) {
      setMapping(applyRegistryPresetMapping(parsedFile.headers, nextFields, activeRegistryProfile, recoveredMappingTemplate));
    }
    toast.success("Custom field removed.");
  };

  const handleSaveProfile = () => {
    if (!parsedFile) {
      toast.error("Parse a file first so the profile can store the current mapping.");
      return;
    }

    const preferredBindings = Object.fromEntries(
      Object.entries(mapping).filter(([, target]) => target && target !== "ignore"),
    ) as Record<string, ImportTargetBinding>;
    const mappingReport = buildAutoMappingReport(parsedFile.headers, customFields, {
      preferredBindings,
    });
    const resolvedMapping = mappingReport.mapping;

    const saved = saveImportProfile({
      id: selectedProfileId || undefined,
      name: profileDraft.name.trim() || batchName.trim() || "Unnamed profile",
      description: profileDraft.description.trim() || null,
      rule,
      design: design as any,
      threshold,
      mapping: resolvedMapping,
      groupOverrides,
      actionOverrides,
      customFieldIds: customFields.map((field) => field.id),
    });

    const savedTemplate = saveImportMappingTemplate({
      name: saved.name,
      moduleId,
      headers: parsedFile.headers,
      mapping: resolvedMapping,
      conflicts: mappingReport.conflicts,
      sourceProfileId: saved.id,
      customFieldIds: customFields.map((field) => field.id),
    });

    const nextProfiles = loadImportProfiles();
    setProfiles(nextProfiles);
    invalidateRegistryCache();
    setSelectedProfileId(saved.id);
    setRegistrySettings((current) => saveHeaderRegistrySettings({ ...current, activeProfileId: saved.id }));
    setRecoveredMappingTemplate(savedTemplate);
    setProfileDraft(createEmptyProfileDraft());
    toast.success(`Saved profile "${saved.name}" v${saved.version}.`);
  };

  const handleApplyProfile = (profile: ImportProfile) => {
    setSelectedProfileId(profile.id);
    invalidateRegistryCache();
    setRegistrySettings((current) => saveHeaderRegistrySettings({ ...current, activeProfileId: profile.id }));
    setBatchName((current) => current || profile.name);
    setRule(profile.rule);
    setDesign(profile.design);
    setThreshold(profile.threshold);
    setMapping(
      parsedFile
        ? applyRegistryPresetMapping(parsedFile.headers, customFields, profile, recoveredMappingTemplate)
        : (profile.mapping as Record<string, ImportTargetBinding>),
    );
    setGroupOverrides(profile.groupOverrides);
    setActionOverrides(profile.actionOverrides);
    toast.success(`Applied profile "${profile.name}".`);
  };

  const handleDeleteProfile = (profileId: string) => {
    deleteImportProfile(profileId);
    deleteImportMappingTemplatesByProfile(profileId);
    const nextProfiles = loadImportProfiles();
    setProfiles(nextProfiles);
    invalidateRegistryCache();
    if (selectedProfileId === profileId) {
      setSelectedProfileId("");
      setProfileDraft(createEmptyProfileDraft());
      setRecoveredMappingTemplate(null);
    }
    setRegistrySettings((current) =>
      current.activeProfileId === profileId
        ? saveHeaderRegistrySettings({ ...current, activeProfileId: null })
        : current
    );
    toast.success("Import profile removed.");
  };

  const handleCommit = async () => {
    const commitPreview = effectivePreview ?? preview;
    if (!commitPreview || !parsedFile) {
      toast.error("Load a file and build a preview first.");
      return;
    }

    const mod = getModule(moduleId);
    if (!mod) {
      toast.error(`Module "${moduleId}" not found.`);
      return;
    }

    const preferredBindings = Object.fromEntries(
      Object.entries(mapping).filter(([, target]) => target && target !== "ignore"),
    ) as Record<string, ImportTargetBinding>;

    setCommitting(true);
    try {
      let current = getCurrentBatch();
      if (!current) {
        current = createImportBatch({
          batchName: batchName.trim() || getDefaultBatchName(parsedFile.fileName),
          batchDescription: batchDescription.trim() || undefined,
          moduleId,
          sourceRows: parsedFile.rows,
          importHeaders: parsedFile.headers,
          matchStrategy: design,
        });
        current.status = "draft";
        setImportRuntimeActiveBatch(current.batchId);
      }
      current.previewRows = commitPreview.rows.map((r) => ({
        sourceRowIndex: r.sourceRowIndex,
        rowKey: r.rowKey,
        sourceRow: r.sourceRow,
        mapped: r.mapped,
        customValues: r.customValues,
        displayName: r.displayName,
        admissionNo: r.admissionNo,
        identityKey: r.identityKey,
        duplicateGroupSize: r.duplicateGroupSize,
        duplicateStatus: r.duplicateStatus,
        validationIssues: r.validationIssues,
        existing: r.existing as Record<string, unknown> | null,
        matchScore: r.matchScore,
        matchReason: r.matchReason,
        defaultAction: r.defaultAction,
        action: r.action,
        diffSummary: r.diffSummary,
      }));

      for (const row of commitPreview.rows) {
        if (row.action === "update" && row.existing) {
          storeRollbackSnapshot(current, row.rowKey, row.existing as Record<string, unknown>, "updated");
        } else if (row.action === "insert") {
          storeRollbackSnapshot(current, row.rowKey, {}, "inserted");
        }
      }

      const result = await mod.adapter.commitRows(commitPreview.rows, current);
      setCommitResult(result);

      if (result.rowResults?.length) {
        for (const entry of current.rollbackData ?? []) {
          const matched = result.rowResults.find((rr) => rr.rowKey === entry.studentKey);
          if (matched) entry.studentKey = matched.id;
        }
      }

      toast.success(`Imported ${result.inserted} new and updated ${result.updated} records.`);
      const refreshed = await mod.adapter.loadExistingRecords();
      setExistingRows(refreshed as ExistingStudentRecord[]);
      await handleRefreshHistory();
      const committedMappingReport = buildAutoMappingReport(parsedFile.headers, customFields, {
        preferredBindings,
      });
      const committedTemplate = saveImportMappingTemplate({
        name: current.batchName || batchName.trim() || getDefaultBatchName(parsedFile.fileName),
        moduleId,
        headers: parsedFile.headers,
        mapping: committedMappingReport.mapping,
        conflicts: committedMappingReport.conflicts,
        sourceProfileId: selectedProfileId || null,
        customFieldIds: customFields.map((field) => field.id),
      });
      setRecoveredMappingTemplate(committedTemplate);

      current.status = "transferred";
      current.insertedCount = result.inserted;
      current.updatedCount = result.updated;
      current.skippedCount = result.skipped;
      current.completedAt = new Date().toISOString();
      await saveImportBatches([current]);
      emitAppSync(importBatchSyncKey);
      setSavedBatches((prev) => prev.map((b) => (b.batchId === current.batchId ? current : b)));

      saveDuplicateIssues(duplicateIssues);
      resolveDuplicateFeedbackLoop();

      setStep(8);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Commit failed");
    } finally {
      setCommitting(false);
    }
  };

  const handleRollback = async () => {
    const current = getCurrentBatch();
    if (!current?.rollbackData?.length) {
      toast.error("No rollback data available.");
      return;
    }
    const mod = getModule(current.moduleId || moduleId);
    if (!mod) {
      toast.error(`Module "${current.moduleId}" not found.`);
      return;
    }
    setRollbackLoading(true);
    try {
      const result = await rollbackImport(current, {
        rollbackFn: mod.adapter.rollbackRows,
      });
      current.status = "rolled_back";
      current.updatedAt = new Date().toISOString();
      await saveImportBatches([current]);
      emitAppSync(importBatchSyncKey);
      setSavedBatches((prev) => prev.map((b) => (b.batchId === current.batchId ? current : b)));
      setCommitResult(null);
      const refreshed = await mod.adapter.loadExistingRecords();
      setExistingRows(refreshed as ExistingStudentRecord[]);
      toast.success(`Rolled back: ${result.restored} records restored.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rollback failed");
    } finally {
      setRollbackLoading(false);
    }
  };

  const handleApproveItem = (header: string, suggestion: string) => {
    if (!parsedFile) return;
    const next = approveRegistryAiMapping(header, suggestion, registryAiState);
    updateRegistryAiState(next);
    setMapping((prev) => ({ ...prev, [header]: suggestion as ImportTargetBinding }));
    toast.success(`Mapped "${header}" → ${suggestion}`);
  };

  const handleIgnoreItem = (header: string) => {
    const next = ignoreRegistryAiHeader(header, "user-dismissed", registryAiState);
    updateRegistryAiState(next);
    setMapping((prev) => ({ ...prev, [header]: "ignore" }));
    toast.success(`Ignored header "${header}"`);
  };

  useEffect(() => {
    if (!autoCommitPending || !preview || !parsedFile) return;
    setAutoCommitPending(false);
    void handleCommit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCommitPending, preview, parsedFile]);

  useEffect(() => {
    return subscribeImportValidationRuntime(() => {
      setValidationRuntimeSnapshot(getImportValidationRuntimeSnapshot());
    });
  }, []);

  useEffect(() => {
    if (!preview || !validationBatch) return;
    const result = runImportValidationCycle(pipelineRef.current, validationBatch, preview);
    validationAuditSignatureRef.current = result.report.signature;
    setValidationRuntimeSnapshot(result.snapshot);
  }, [preview, validationBatch]);

  if (!getModule(moduleId)) {
    return (
      <div>
        <PageHeader title="Import Pipeline" subtitle="Loading module..." icon={<Upload className="h-6 w-6" />} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">
              {loadingBatches ? "Initializing import engine..." : `Module "${moduleId}" not available.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Import Pipeline"
        subtitle={`Upload, map, match, preview, and commit ${moduleId === "students" ? "student" : moduleId} records.`}
        icon={<Upload className="h-6 w-6" />}
        actions={
          <Button variant="outline" className="rounded-xl" onClick={() => void handleRefreshExisting()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Register
          </Button>
        }
      />

      <Card className="glass mb-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {STEPS.map((stepDef, index) => {
            const active = index === step;
            const done = index < step;
            const Icon = stepDef.icon;
            return (
              <button
                key={stepDef.id}
                onClick={() => tryNavigateTo(index)}
                className={cn(
                  "group flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all",
                  active && "border-primary bg-primary/10 shadow-glow",
                  done && !active && "border-success/40 bg-success/5",
                  !active && !done && "border-border/60 bg-card/40 hover:bg-secondary/60"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                    active
                      ? "bg-gradient-primary text-primary-foreground"
                      : done
                        ? "bg-success/20 text-success"
                        : "bg-secondary text-muted-foreground"
                  )}
                >
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <span className="hidden flex-col leading-tight sm:flex">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Step {index + 1}</span>
                  <span className="text-xs font-semibold">{stepDef.title}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {STEPS[step].title} · {STEPS[step].caption}
            </span>
            <span className="font-mono">{stepPct}%</span>
          </div>
          <Progress value={stepPct} className="h-1.5" />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="glass p-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Active className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-lg font-semibold">{STEPS[step].title}</h3>
              <p className="text-xs text-muted-foreground">
                {parsedFile ? `${parsedFile.fileName} · ${parsedFile.rows.length} rows` : "No file parsed yet"}
              </p>
            </div>
          </div>

          {step === 0 && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="batch-name">Batch Name</Label>
                  <Input
                    id="batch-name"
                    name="batchName"
                    value={batchName}
                    onChange={(event) => setBatchName(event.target.value)}
                    placeholder={parsedFile ? getDefaultBatchName(parsedFile.fileName) : "Example: Scholarship Intake"}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="batch-description">Description</Label>
                  <Textarea
                    id="batch-description"
                    name="batchDescription"
                    rows={4}
                    value={batchDescription}
                    onChange={(event) => setBatchDescription(event.target.value)}
                    placeholder="Source, purpose, or migration notes"
                  />
                </div>
                <fieldset className="rounded-2xl border border-border/60 bg-card/60 p-4">
                  <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Module</legend>
                  <p className="text-xs text-muted-foreground mb-3">Choose which data type you are importing.</p>
                  <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
                    {modules.map((mod) => {
                      const IconComponent =
                        ["Users", "UserRound", "GraduationCap", "Building2", "BedDouble"].includes(mod.icon) ? Users :
                        mod.icon === "DollarSign" ? DollarSign :
                        ["ClipboardCheck", "BookOpen", "FileCheck"].includes(mod.icon) ? ClipboardCheck :
                        ["FileSpreadsheet", "DoorOpen"].includes(mod.icon) ? FileSpreadsheet :
                        Database;
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          role="radio"
                          aria-checked={moduleId === mod.id}
                          onClick={() => setModuleId(mod.id)}
                          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${
                            moduleId === mod.id
                              ? "border-primary bg-primary/5"
                              : "border-border/60 bg-card/60 hover:border-primary/40"
                          }`}
                        >
                          <IconComponent className={`h-6 w-6 ${moduleId === mod.id ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={`text-sm font-semibold ${moduleId === mod.id ? "text-primary" : ""}`}>{mod.name}</span>
                          <span className="text-[10px] text-muted-foreground text-center leading-tight">{mod.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <fieldset className="rounded-2xl border border-border/60 bg-card/60 p-4">
                  <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Import Mode</legend>
                  <p className="text-xs text-muted-foreground mb-3">Controls the level of automation and user interaction.</p>
                  <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
                    {(["auto", "hybrid", "manual"] as ImportMode[]).map((modeKey) => {
                      const config = IMPORT_MODE_CONFIGS[modeKey];
                      const IconComponent =
                        modeKey === "auto" ? Zap :
                        modeKey === "hybrid" ? RefreshCw :
                        Hand;
                      return (
                        <button
                          key={modeKey}
                          type="button"
                          role="radio"
                          aria-checked={mode === modeKey}
                          onClick={() => setMode(modeKey)}
                          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${
                            mode === modeKey
                              ? "border-primary bg-primary/5"
                              : "border-border/60 bg-card/60 hover:border-primary/40"
                          }`}
                        >
                          <IconComponent className={`h-6 w-6 ${mode === modeKey ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={`text-sm font-semibold ${mode === modeKey ? "text-primary" : ""}`}>{config.label}</span>
                          <span className="text-[10px] text-muted-foreground text-center leading-tight">{config.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label htmlFor="rule">Transfer Rule</Label>
                      <p className="text-xs text-muted-foreground">Controls how incoming values replace existing values.</p>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {rule}
                    </Badge>
                  </div>
                  <Select name="rule" value={rule} onValueChange={(value) => setRule(value as ImportTransferRule)}>
                    <SelectTrigger id="rule" className="mt-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {importTransferRules.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
                  <Label htmlFor="design">Match Design</Label>
                  <Select name="design" value={design} onValueChange={(value) => setDesign(value as ImportMatchStrategy)}>
                    <SelectTrigger id="design" className="mt-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(getModule(moduleId)?.matchStrategies ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {design === "fuzzy_name_dob" && (
                  <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Label className="text-xs">Fuzzy Threshold</Label>
                      <Badge variant="secondary">{threshold}%</Badge>
                    </div>
                    <Slider
                      id="fuzzy-threshold"
                      name="threshold"
                      value={[threshold]}
                      min={70}
                      max={100}
                      step={1}
                      onValueChange={(value) => setThreshold(value[0] ?? 88)}
                      className="mt-3"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="source-file" className="mb-2 block">Upload Source File</Label>
                <label className="flex h-56 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary/40 transition-colors hover:border-primary hover:bg-primary/5">
                  <Upload className="h-8 w-8 text-primary" />
                  <p className="text-sm font-semibold">{file ? file.name : "Drop UMIS Excel or CSV here"}</p>
                  <p className="text-xs text-muted-foreground">.xlsx · .xls · .csv</p>
                  <input
                    id="source-file"
                    name="sourceFile"
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                </label>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Card className="border-border/60 bg-card/60 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">File</p>
                    <p className="mt-1 text-sm font-medium">{getReadableFileType(parsedFile)}</p>
                  </Card>
                  <Card className="border-border/60 bg-card/60 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Existing Rows</p>
                    <p className="mt-1 text-sm font-medium">{loadingExisting ? "Loading..." : formatRowCount(existingRows.length)}</p>
                  </Card>
                </div>

                {driftReport?.hasDrift && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Schema Drift</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{driftReport.summary}</p>
                    <div className="space-y-1.5">
                      {driftReport.unrecognized.length > 0 && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1">Unrecognized Headers</p>
                          {driftReport.unrecognized.map((entry) => (
                            <p key={entry.header} className="text-xs text-amber-800">
                              "{entry.header}"{entry.suggestedField ? ` → suggest: ${entry.suggestedField}` : ""}
                            </p>
                          ))}
                        </div>
                      )}
                      {driftReport.lowConfidence.length > 0 && (
                        <div className="rounded-lg border border-orange-200 bg-orange-50/50 p-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-700 mb-1">Low-Confidence Matches</p>
                          {driftReport.lowConfidence.map((entry) => (
                            <p key={entry.header} className="text-xs text-orange-800">{entry.detail}</p>
                          ))}
                        </div>
                      )}
                      {driftReport.missingRequired.length > 0 && (
                        <div className="rounded-lg border border-red-200 bg-red-50/50 p-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-red-700 mb-1">Missing Required Fields</p>
                          {driftReport.missingRequired.map((entry) => (
                            <p key={entry.suggestedField} className="text-xs text-red-800">{entry.detail}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Auto Summary</p>
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      {mappingStats.mapped} mapped
                    </Badge>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Card className="border-border/60 bg-card/60 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Mapped Columns</p>
                      <p className="mt-1 font-mono text-lg">{mappingStats.mapped}</p>
                    </Card>
                    <Card className="border-border/60 bg-card/60 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ignored Columns</p>
                      <p className="mt-1 font-mono text-lg">{mappingStats.ignored}</p>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-display text-lg font-semibold">Batch Created</h4>
                  <p className="text-sm text-muted-foreground">
                    Review the batch details and proceed to mapping.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 rounded-xl border border-border/60 bg-card/40 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Batch Name</p>
                  <p className="font-medium">{batchName || "Untitled"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transfer Rule</p>
                  <p className="font-medium">{rule}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Match Design</p>
                  <p className="font-medium">{design}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Import Mode</p>
                  <p className="font-medium">{mode}</p>
                </div>
              </div>
              {parsedFile && (
                <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <p className="text-sm font-medium">File Analysis</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg bg-primary/5 p-3 text-center">
                      <p className="font-display text-2xl font-bold text-primary">{parsedFile.rows.length}</p>
                      <p className="text-xs text-muted-foreground">Rows detected</p>
                    </div>
                    <div className="rounded-lg bg-primary/5 p-3 text-center">
                      <p className="font-display text-2xl font-bold text-primary">{parsedFile.headers.length}</p>
                      <p className="text-xs text-muted-foreground">Columns detected</p>
                    </div>
                    <div className="rounded-lg bg-primary/5 p-3 text-center">
                      <p className="font-display text-2xl font-bold text-primary">{parsedFile.sourceType.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">File type</p>
                    </div>
                  </div>
                  {parsedFile.headers.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-1">Detected columns:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedFile.headers.map((h) => (
                          <Badge key={h} variant="secondary" className="text-[11px]">{h}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && parsedFile && (
            <div className="space-y-4">
              <ImportDetectedHeaders
                headers={parsedFile.headers}
                mapping={mapping}
                customFields={customFields}
                aiReviewQueue={aiReviewQueue}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Card className="border-primary/20 bg-primary/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Registry-driven mapping</p>
                    <p className="text-xs text-muted-foreground">
                      Default key and active preset are pulled from the shared header registry before you map anything manually.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Default key: {registryMappingStats.defaultBinding}
                    </Badge>
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      Active preset: {registryMappingStats.activeProfileName}
                    </Badge>
                    {recoveredMappingTemplate && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        Recovered: {recoveredMappingTemplate.name}
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() =>
                        parsedFile &&
                        setMapping(
                          applyRegistryPresetMapping(
                            parsedFile.headers,
                            customFields,
                            activeRegistryProfile,
                            recoveredMappingTemplate,
                          ),
                        )
                      }
                      disabled={!parsedFile}
                    >
                      Apply registry defaults
                    </Button>
                    {recoveredMappingTemplate && (
                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => parsedFile && setMapping(recoveredMappingTemplate.mapping)}
                        disabled={!parsedFile}
                      >
                        Reapply recovered mapping
                      </Button>
                    )}
                  </div>
                </div>
              </Card>

              {parsedFile && (
                <Card className="glass border-primary/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">AI Header Mapping</p>
                        <p className="text-xs text-muted-foreground">
                          {parsedFile.headers.length} header{parsedFile.headers.length !== 1 ? "s" : ""} detected
                          {aiReviewQueue && aiReviewQueue.queue.length > 0
                            ? ` · ${parsedFile.headers.length - aiReviewQueue.queue.length} confident`
                            : ` · ${mappingStats.mapped} mapped`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {aiReviewQueue && aiReviewQueue.queue.length > 0 ? (
                        <>
                          <Badge variant="outline" className="border-indigo-300 bg-indigo-50 text-indigo-700">
                            {aiReviewQueue.queue.length} need review
                          </Badge>
                          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setReviewQueueOpen(true)}>
                            Open Review Queue
                          </Button>
                        </>
                      ) : (
                        <Badge variant="secondary" className="bg-success/10 text-success">
                          All clear
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {driftReport?.hasDrift && (
                <Card className="border-amber-200 bg-amber-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-amber-800">Schema Drift Detected</p>
                      <p className="text-xs text-amber-700">{driftReport.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {driftReport.unrecognized.length > 0 && (
                          <Badge variant="outline" className="border-amber-300 bg-amber-100/50 text-amber-800">
                            {driftReport.unrecognized.length} unrecognized
                          </Badge>
                        )}
                        {driftReport.lowConfidence.length > 0 && (
                          <Badge variant="outline" className="border-orange-300 bg-orange-100/50 text-orange-800">
                            {driftReport.lowConfidence.length} weak matches
                          </Badge>
                        )}
                        {driftReport.missingRequired.length > 0 && (
                          <Badge variant="outline" className="border-red-300 bg-red-100/50 text-red-800">
                            {driftReport.missingRequired.length} missing required
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Schema mapping</p>
                  <p className="text-xs text-muted-foreground">Map each source column to the register field it should populate.</p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() =>
                    parsedFile &&
                    setMapping(
                      applyRegistryPresetMapping(
                        parsedFile.headers,
                        customFields,
                        activeRegistryProfile,
                        recoveredMappingTemplate,
                      ),
                    )
                  }
                  disabled={!parsedFile}
                >
                  Auto-map again
                </Button>
              </div>

              {!parsedFile ? (
                <Card className="border-dashed border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
                  Choose a file first. We'll parse the headers and build a mapping automatically.
                </Card>
              ) : (
                <div className="space-y-3">
                  {parsedFile.headers.map((header) => (
                    <div
                      key={header}
                      className="grid gap-3 rounded-xl border border-border/60 bg-card/60 p-3 lg:grid-cols-[1fr_auto_1fr]"
                    >
                      <div>
                        <label htmlFor={`map-${header}`} className="text-[10px] uppercase tracking-wider text-muted-foreground">Source Column</label>
                        <p className="mt-1 font-mono text-sm">{header}</p>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Select name={`mapping[${header}]`} value={mapping[header] ?? "ignore"} onValueChange={(value) => handleMappingChange(header, value)}>
                        <SelectTrigger id={`map-${header}`}>
                          <SelectValue placeholder="Ignore column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ignore">Ignore column</SelectItem>
                          {moduleFieldGroups.map((group) => (
                            <SelectGroup key={group.title}>
                              <SelectLabel>{group.title}</SelectLabel>
                              {group.fields.map((field) => (
                                <SelectItem key={field.key} value={field.key}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Active match design</p>
                    <p className="text-xs text-muted-foreground">Duplicate detection uses the selected key strategy and threshold.</p>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {getModule(moduleId)?.matchStrategies.find((s) => s.id === design)?.label ?? design}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="border-border/60 bg-card/60 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Existing rows</p>
                  <p className="mt-2 font-display text-3xl font-bold">{formatRowCount(existingRows.length)}</p>
                </Card>
                <Card className="border-border/60 bg-card/60 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Parsed rows</p>
                  <p className="mt-2 font-display text-3xl font-bold">{formatRowCount(preview?.summary.total ?? 0)}</p>
                </Card>
                <Card className="border-border/60 bg-card/60 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Threshold</p>
                  <p className="mt-2 font-display text-3xl font-bold">{threshold}%</p>
                </Card>
              </div>

              {loadingExisting ? (
                <Card className="border-dashed border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
                  Loading the register for duplicate detection...
                </Card>
              ) : existingError ? (
                <Card className="border border-warning/30 bg-warning/5 p-4 text-sm text-warning">
                  {existingError}
                </Card>
              ) : (
                <Card className="border-border/60 bg-card/60 p-4 text-sm text-muted-foreground">
                  {moduleId === "students"
                    ? "The importer will match against the current register using admission number, UMIS, EMIS, or name + DOB depending on the active design."
                    : `Existing records loaded from the ${getModule(moduleId)?.name || moduleId} module. Matching will use the selected strategy.`}
                </Card>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Potential duplicates</p>
                  <p className="text-xs text-muted-foreground">Rows grouped by identity key or matched to an existing student.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-warning/15 text-warning">
                    {duplicateGroups.length} groups
                  </Badge>
                  <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => navigate("/students/duplicates")}>
                    Resolve duplicates
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => setStep(6)}>
                    Review missing data
                  </Button>
                </div>
              </div>

              {!preview ? (
                <Card className="border-dashed border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
                  Parse a file and build a preview to see duplicate groups.
                </Card>
            ) : duplicateGroups.length ? (
                duplicateGroups.slice(0, 10).map((group) => (
                  <div key={group.identityKey} className="rounded-xl border border-border/60 bg-card/60 p-3">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Identity Key</p>
                        <p className="mt-1 truncate font-mono text-xs">{group.identityKey}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{group.rows.length} row(s)</Badge>
                        <Select
                          name={`groupOverrides[${group.identityKey}]`}
                          value={groupOverrides[group.identityKey] ?? "keep-first"}
                          onValueChange={(value) =>
                            setGroupOverrides((current) => ({
                              ...current,
                              [group.identityKey]: value as ImportDuplicateGroupDecision,
                            }))
                          }
                        >
                          <SelectTrigger className="w-44">
                            <SelectValue placeholder="Group action" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="keep-first">Keep first row</SelectItem>
                            <SelectItem value="keep-last">Keep last row</SelectItem>
                            <SelectItem value="skip-group">Skip entire group</SelectItem>
                            <SelectItem value="manual-review">Manual review</SelectItem>
                            <SelectItem value="match-existing">Use existing match</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {group.rows.map((row) => (
                        <div key={row.rowKey} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-background/60 px-3 py-2">
                          <div>
                            <p className="text-sm font-medium">{row.displayName}</p>
                            <p className="text-xs text-muted-foreground">{summarizeExisting(row.existing)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={cn(
                                row.duplicateStatus === "exact" && "bg-success/15 text-success",
                                row.duplicateStatus === "fuzzy" && "bg-warning/15 text-warning",
                                row.duplicateStatus === "internal-duplicate" && "bg-primary/10 text-primary"
                              )}
                            >
                              {row.duplicateStatus}
                            </Badge>
                            <Badge variant="secondary">{row.matchScore}%</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <Card className="border-dashed border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
                  No duplicate groups were detected for the current design.
                </Card>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Validation</p>
                  <p className="text-xs text-muted-foreground">QA scoring, blockers, and review signals before commit.</p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    validationReport.status === "blocked" && "bg-destructive/15 text-destructive",
                    validationReport.status === "warning" && "bg-warning/15 text-warning",
                    validationReport.status === "healthy" && "bg-success/15 text-success",
                    validationReport.status === "empty" && "bg-muted text-muted-foreground",
                  )}
                >
                  {validationReport.status}
                </Badge>
              </div>

              {!preview ? (
                <Card className="border-dashed border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
                  Validation appears after a file is parsed and mapped.
                </Card>
              ) : (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-4">
                    {[
                      { label: "Score", value: `${validationReport.score}`, className: "text-primary" },
                      { label: "Blockers", value: validationReport.blockerCount, className: "text-destructive" },
                      { label: "Warnings", value: validationReport.warningCount, className: "text-warning" },
                      { label: "Review rows", value: validationReport.reviewRows, className: "text-muted-foreground" },
                    ].map((item) => (
                      <Card key={item.label} className="glass p-4 text-center">
                        <p className={cn("font-display text-3xl font-bold", item.className)}>{item.value}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                      </Card>
                    ))}
                  </div>

                  <Card className="border-border/60 bg-card/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{validationReport.summary}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {validationReport.validRows}/{validationReport.totalRows} rows valid · {validationReport.invalidRows} invalid · {validationReport.internalDuplicates} internal duplicates
                        </p>
                      </div>
                      <div className="min-w-24 text-right">
                        <p className="font-display text-3xl font-bold text-primary">{validationReport.score}</p>
                        <p className="text-xs text-muted-foreground">Quality score</p>
                      </div>
                    </div>
                    <Progress value={validationReport.score} className="mt-4 h-1.5" />
                  </Card>

                  {criticalFieldIssues.hardBlocking > 0 && (
                    <Card className="border-red-200 bg-red-50/50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-sm font-semibold text-red-800">Critical Field Analysis</p>
                          <p className="text-xs text-red-700">
                            {criticalFieldIssues.hardBlocking} hard-blocking field{criticalFieldIssues.hardBlocking !== 1 ? "s" : ""} require{criticalFieldIssues.hardBlocking === 1 ? "s" : ""} attention before commit.
                          </p>
                          <Button variant="outline" size="sm" className="mt-2 rounded-lg border-red-300 bg-white text-xs text-red-700 hover:bg-red-100" onClick={() => navigate("/students/missing-fields")}>
                            Fix missing contact fields
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {duplicateAliasIssues.length > 0 && (
                    <Card className="border-amber-200 bg-amber-50/50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-sm font-semibold text-amber-800">Duplicate Aliases</p>
                          <p className="text-xs text-amber-700">
                            {duplicateAliasIssues.length} alias group{duplicateAliasIssues.length !== 1 ? "s" : ""} shared between multiple target fields.
                          </p>
                          <ul className="mt-2 space-y-1">
                            {duplicateAliasIssues.slice(0, 5).map((issue) => (
                              <li key={issue.alias} className="text-xs text-amber-700">
                                "<span className="font-medium">{issue.alias}</span>" → {issue.fields.map((f) => f.label).join(", ")}
                              </li>
                            ))}
                          </ul>
                          {duplicateAliasIssues.length > 5 && (
                            <p className="text-xs text-amber-600">+{duplicateAliasIssues.length - 5} more</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
                    <Card className="border-border/60 bg-card/60 p-4">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Validation runtime</p>
                      <p className="mt-2 text-sm font-semibold capitalize">{validationRuntimeSnapshot.stability}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Last run: {validationRuntimeSnapshot.lastRunAt ? new Date(validationRuntimeSnapshot.lastRunAt).toLocaleString() : "Not run yet"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Last audit: {validationRuntimeSnapshot.lastAuditedAt ? new Date(validationRuntimeSnapshot.lastAuditedAt).toLocaleString() : "Not audited yet"}
                      </p>
                    </Card>
                    <Card className="border-border/60 bg-card/60 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Integrity notes</p>
                        <Badge variant="secondary">{validationRuntimeSnapshot.integrityNotes.length}</Badge>
                      </div>
                      {validationRuntimeSnapshot.integrityNotes.length ? (
                        <div className="mt-2 space-y-1.5">
                          {validationRuntimeSnapshot.integrityNotes.slice(0, 3).map((note) => (
                            <p key={note} className="text-xs text-muted-foreground">
                              {note}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">No data integrity mismatches were detected.</p>
                      )}
                    </Card>
                  </div>

                  {validationReport.findings.length ? (
                    <div className="space-y-3">
                      {validationReport.findings.slice(0, 8).map((finding) => {
                        const enumInfo = finding.rowKey && finding.kind === "blocker" ? parseEnumIssue(finding.detail) : null;
                        return (
                        <Card
                          key={finding.code}
                          className={cn(
                            "p-4",
                            finding.kind === "blocker" && "border-destructive/30 bg-destructive/5",
                            finding.kind === "warning" && "border-warning/30 bg-warning/5",
                            finding.kind === "info" && "border-primary/30 bg-primary/5",
                          )}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium">{finding.title}</p>
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    finding.kind === "blocker" && "bg-destructive/15 text-destructive",
                                    finding.kind === "warning" && "bg-warning/15 text-warning",
                                    finding.kind === "info" && "bg-primary/10 text-primary",
                                  )}
                                >
                                  {finding.kind}
                                </Badge>
                              </div>
                              {finding.rowLabel ? (
                                <p className="mt-1 text-xs text-muted-foreground">{finding.rowLabel}</p>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="max-w-xl text-sm text-muted-foreground">{finding.detail}</p>
                              {enumInfo && effectivePreview && finding.rowKey ? (() => {
                                const row = effectivePreview.rows.find((r) => r.rowKey === finding.rowKey);
                                const currentRaw = row?.sourceRow?.[enumInfo.fieldKey] || row?.mapped?.[enumInfo.fieldKey] || "";
                                return (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0 rounded-lg"
                                    onClick={() => setEditTarget({ ...enumInfo, rowKey: finding.rowKey!, currentValue: currentRaw })}
                                  >
                                    Fix
                                  </Button>
                                );
                              })() : null}
                            </div>
                          </div>
                        </Card>
                      );})}
                    </div>
                  ) : (
                    <Card className="border-dashed border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
                      No validation findings were raised for the current preview.
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Fix validation issue</DialogTitle>
                <DialogDescription>
                  {editTarget ? `Update "${editTarget.fieldLabel}" for ${(() => {
                    const row = effectivePreview?.rows.find((r) => r.rowKey === editTarget.rowKey);
                    return row?.displayName || `row #${editTarget.rowKey}`;
                  })()}` : ""}
                </DialogDescription>
              </DialogHeader>
              {editTarget && (
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Current value</Label>
                    <p className="rounded-md border border-border/60 bg-card/60 px-3 py-2 text-sm font-mono">
                      "{editTarget.currentValue}"
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fix-value">Valid options for {editTarget.fieldLabel}</Label>
                    <Select
                      value={valueOverrides[editTarget.rowKey]?.[editTarget.fieldKey] ?? ""}
                      onValueChange={(newValue) => {
                        setValueOverrides((prev) => ({
                          ...prev,
                          [editTarget.rowKey]: {
                            ...(prev[editTarget.rowKey] ?? {}),
                            [editTarget.fieldKey]: newValue,
                          },
                        }));
                      }}
                    >
                      <SelectTrigger id="fix-value">
                        <SelectValue placeholder="Select a value..." />
                      </SelectTrigger>
                      <SelectContent>
                        {editTarget.validValues.map((v) => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-lg">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button className="rounded-lg" disabled={!editTarget || !valueOverrides[editTarget.rowKey]?.[editTarget.fieldKey]}>
                    Apply fix
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {step === 7 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  { label: "Ready inserts", value: (effectivePreview ?? preview)?.summary.inserts ?? 0, className: "text-success" },
                  { label: "Ready updates", value: (effectivePreview ?? preview)?.summary.updates ?? 0, className: "text-primary" },
                  { label: "Review rows", value: (effectivePreview ?? preview)?.summary.reviews ?? 0, className: "text-warning" },
                  { label: "Invalid rows", value: (effectivePreview ?? preview)?.summary.invalid ?? 0, className: "text-muted-foreground" },
                ].map((item) => (
                  <Card key={item.label} className="glass p-4 text-center">
                    <p className={cn("font-display text-3xl font-bold", item.className)}>{item.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                  </Card>
                ))}
              </div>

              {!(effectivePreview ?? preview) ? (
                <Card className="border-dashed border-border/60 bg-card/40 p-6 text-sm text-muted-foreground">
                  Parse a file to see the preview.
                </Card>
              ) : (
                <div className="space-y-3">
                  {(effectivePreview ?? preview).rows.slice(0, 8).map((row) => {
                    const expanded = expandedRows[row.rowKey] ?? false;
                    const diffs = "fieldDiffs" in row ? (row as Record<string, unknown>).fieldDiffs as Array<{fieldKey: string; label: string; existingValue: string | null; incomingValue: string}> : [];
                    const diffCount = diffs.length;
                    return (
                    <Card key={row.rowKey} className="border-border/60 bg-card/60">
                      <div className="flex items-stretch divide-x divide-border/40">
                        <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 p-3">
                          <Badge className={cn(
                            "text-[10px] font-semibold uppercase tracking-wider",
                            row.validationIssues.length > 0 && "bg-destructive/15 text-destructive",
                            row.validationIssues.length === 0 && row.action === "review" && "bg-warning/15 text-warning",
                            row.validationIssues.length === 0 && row.action === "skip" && "bg-muted text-muted-foreground",
                            row.validationIssues.length === 0 && (row.action === "insert" || row.action === "update") && "bg-success/15 text-success",
                          )}>
                            {row.validationIssues.length > 0 ? "Error" : row.action === "review" ? "Needs Review" : row.action === "skip" ? "Blocked" : "Ready"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{row.matchScore}%</span>
                        </div>
                        <div className="flex flex-1 flex-col gap-2 p-3">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                            <span className="font-medium text-foreground">{row.displayName}</span>
                            <span className="text-muted-foreground">Row {row.sourceRowIndex + 1}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                            <div>
                              <span className="text-muted-foreground">Student Key: </span>
                              <span className="font-medium text-foreground">{row.identityKey || row.admissionNo || "—"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Match: </span>
                              <span className="font-medium text-foreground">{row.matchReason}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Existing: </span>
                              <span className="font-medium text-foreground">
                                {row.existing ? `${row.existing.display_name} (${row.existing.student_id})` : "New record"}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Type: </span>
                              <span className="font-medium text-foreground">
                                {row.duplicateGroupSize > 1 ? "Internal Duplicate" : row.action === "update" ? "Matched" : "Direct Insert"}
                              </span>
                            </div>
                          </div>
                          {diffCount > 0 && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setExpandedRows((prev) => ({ ...prev, [row.rowKey]: !prev[row.rowKey] }))}
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                                  expanded
                                    ? "bg-muted/60 text-muted-foreground"
                                    : "bg-primary/10 text-primary hover:bg-primary/15",
                                )}
                              >
                                <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
                                {expanded ? "Hide changes" : `Show changes (${diffCount})`}
                              </button>
                              {!expanded && row.diffSummary.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {row.diffSummary.slice(0, 3).map((diff) => (
                                    <span key={diff} className="rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                      {diff}
                                    </span>
                                  ))}
                                  {row.diffSummary.length > 3 && (
                                    <span className="text-[10px] text-muted-foreground">+{row.diffSummary.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex w-20 shrink-0 items-center justify-center p-2">
                          <Select
                            name={`actionOverrides[${row.rowKey}]`}
                            value={actionOverrides[row.rowKey] ?? row.action}
                            onValueChange={(value) =>
                              setActionOverrides((current) => ({
                                ...current,
                                [row.rowKey]: value as ImportResolvedAction,
                              }))
                            }
                          >
                            <SelectTrigger className="h-8 w-full text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="insert" className="text-xs">Insert</SelectItem>
                              <SelectItem value="update" className="text-xs">Update</SelectItem>
                              <SelectItem value="skip" className="text-xs">Skip</SelectItem>
                              <SelectItem value="review" className="text-xs">Review</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {expanded && diffCount > 0 && (
                        <div className="border-t border-border/40">
                          <div className="grid grid-cols-[1fr_1fr_1fr] gap-px bg-border/40 text-[11px]">
                            <div className="bg-card px-3 py-2 font-medium text-foreground">Field</div>
                            <div className="bg-card px-3 py-2 font-medium text-muted-foreground">Existing</div>
                            <div className="bg-card px-3 py-2 font-medium text-muted-foreground">New</div>
                            {diffs.map((diff) => (
                              <div key={diff.fieldKey} className="contents">
                                <div className="bg-card px-3 py-1.5 text-foreground">{diff.label}</div>
                                <div className="bg-card px-3 py-1.5">
                                  {diff.existingValue ? (
                                    <span className="text-destructive/70 line-through">{diff.existingValue}</span>
                                  ) : (
                                    <span className="text-muted-foreground/50">—</span>
                                  )}
                                </div>
                                <div className="bg-card px-3 py-1.5">
                                  <span className="text-success">{diff.incomingValue}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                    );
                  })}
                  {(effectivePreview ?? preview).rows.length > 8 && (
                    <p className="text-xs text-muted-foreground">
                      Showing 8 of {(effectivePreview ?? preview).rows.length} preview rows. The commit will process the full batch.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div>
                <h4 className="font-display text-xl font-semibold">Transfer complete</h4>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {commitResult
                    ? `Inserted ${commitResult.inserted}, updated ${commitResult.updated}, skipped ${commitResult.skipped}, failed ${commitResult.failed}.`
                    : "Run a commit to write the current preview into the register."}
                </p>
              </div>
              {commitResult && (
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    { label: "Inserted", value: commitResult.inserted, className: "text-success" },
                    { label: "Updated", value: commitResult.updated, className: "text-primary" },
                    { label: "Skipped", value: commitResult.skipped, className: "text-muted-foreground" },
                    { label: "Failed", value: commitResult.failed, className: "text-warning" },
                  ].map((item) => (
                    <Card key={item.label} className="glass p-4 text-center">
                      <p className={cn("font-display text-3xl font-bold", item.className)}>{item.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                    </Card>
                  ))}
                </div>
              )}
              {commitResult?.errors.length ? (
                <div className="space-y-2 text-left">
                  {commitResult.errors.map((error) => (
                    <div key={`${error.rowNumber}-${error.message}`} className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
                      Row {error.rowNumber}: {error.message}
                    </div>
                  ))}
                </div>
              ) : null}
              {commitResult && getCurrentBatch()?.rollbackData?.length ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl border-warning/40 text-warning hover:bg-warning/10">
                      <Undo2 className="mr-2 h-4 w-4" />
                      Rollback Import
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Rollback this import?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete inserted records and restore updated records to their previous state. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => void handleRollback()} disabled={rollbackLoading}>
                        {rollbackLoading ? "Rolling back..." : "Rollback"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
            </div>
          )}

          {step === 9 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div>
                <h4 className="font-display text-xl font-semibold">Import finalized</h4>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  The batch has been archived and the dashboard is being refreshed.
                </p>
              </div>
              {commitResult && (
                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    { label: "Inserted", value: commitResult.inserted, className: "text-success" },
                    { label: "Updated", value: commitResult.updated, className: "text-primary" },
                    { label: "Skipped", value: commitResult.skipped, className: "text-muted-foreground" },
                    { label: "Failed", value: commitResult.failed, className: "text-warning" },
                  ].map((item) => (
                    <Card key={item.label} className="glass p-4 text-center">
                      <p className={cn("font-display text-3xl font-bold", item.className)}>{item.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                    </Card>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => window.open("/settings/trace", "_blank")}
                >
                  Trace Settings
                </Button>
                <Button
                  className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90"
                  onClick={() => {
                    const batch = getCurrentBatch();
                    if (batch) {
                      batch.status = 'archived' as any;
                      void saveImportBatches([batch]);
                      emitAppSync('dashboard.refresh');
                      toast.success('Batch archived and dashboard refreshed.');
                    }
                    pipelineRef.current = createImportPipelineState();
                    resetImportEngineSession("new-import");
                    setImportRuntimeActiveBatch(null);
                    setStep(0);
                    setCommitResult(null);
                    setParsedFile(null);
                    setFile(null);
                    setBatchName("");
                    setBatchDescription("");
                  }}
                >
                  Start New Import
                  <Upload className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {parseError ? (
            <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
              {parseError}
            </div>
          ) : null}

          {batchDescription.trim() ? (
            <div className="mt-4 rounded-xl border border-border/60 bg-card/40 p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Batch notes: </span>
              {batchDescription}
            </div>
          ) : null}

          <StickyActionBar className="justify-between">
            <Button variant="outline" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {step < 8 ? (
              <Button onClick={() => tryNavigateTo(step + 1)} className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : step === 8 ? (
              commitResult ? (
                <Button
                  onClick={() => { setStep(9); }}
                  className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90"
                >
                  Next: Finalize
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => void handleCommit()}
                  disabled={committing || !preview || preview.summary.total === 0}
                  className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90"
                >
                  {committing ? "Committing..." : "Commit Import"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              )
            ) : (
              <Button
                variant="outline"
                onClick={() => { pipelineRef.current = createImportPipelineState(); resetImportEngineSession("new-import"); setImportRuntimeActiveBatch(null); setStep(0); setCommitResult(null); setParsedFile(null); setFile(null); setBatchName(""); setBatchDescription(""); }}
                className="rounded-xl"
              >
                New Import
                <Upload className="ml-2 h-4 w-4" />
              </Button>
            )}
          </StickyActionBar>
        </Card>

        <div className="space-y-4">
          <Card className="glass p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Versioned Presets</p>
                <p className="text-xs text-muted-foreground">Save and replay the current importer state.</p>
              </div>
              <Badge variant="secondary">{profiles.length} saved</Badge>
            </div>
            <div className="mt-3 space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  id="profile-name"
                  name="profileName"
                  value={profileDraft.name}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder={activeRegistryProfile ? activeRegistryProfile.name : "Preset name"}
                />
                <Input
                  id="profile-description"
                  name="profileDescription"
                  value={profileDraft.description}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Optional note"
                />
              </div>
              {profiles.length ? (
                <div className="space-y-2">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="rounded-xl border border-border/60 bg-card/60 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{profile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            v{profile.version} · {profile.rule} · {profile.design}
                          </p>
                        </div>
                        <Badge variant="secondary">{profile.threshold}%</Badge>
                      </div>
                      {profile.description ? <p className="mt-2 text-xs text-muted-foreground">{profile.description}</p> : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => handleApplyProfile(profile)}>
                          Apply
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-lg text-warning hover:text-warning" onClick={() => handleDeleteProfile(profile.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-3 text-sm text-muted-foreground">
                  No saved presets yet.
                </div>
              )}
            </div>
          </Card>

          <StickyActionBar className="justify-end">
            <Button className="rounded-xl" onClick={() => handleSaveProfile()} disabled={!parsedFile}>
              <Save className="mr-2 h-4 w-4" />
              Save Current Setup
            </Button>
          </StickyActionBar>

          {parsedFile && (
            <Card className="glass p-4">
              <p className="text-sm font-semibold mb-3">Diagnostics</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">AI Review Queue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {aiReviewQueue ? `${aiReviewQueue.queue.length} pending` : "—"}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setReviewQueueOpen(true)} disabled={!aiReviewQueue?.queue.length}>
                      Open
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-xs font-medium">Critical Fields</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-[10px]", criticalFieldIssues.hardBlocking > 0 ? "border-red-200 text-red-700" : "border-green-200 text-green-700")}>
                      {criticalFieldIssues.hardBlocking > 0
                        ? `${criticalFieldIssues.hardBlocking} blocking`
                        : criticalFieldIssues.softWarnings > 0
                          ? `${criticalFieldIssues.softWarnings} warnings`
                          : "All good"}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => navigate("/students/missing-fields")}>
                      View
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-indigo-500" />
                    <span className="text-xs font-medium">Duplicates</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {duplicateIssues.length > 0 ? `${duplicateIssues.filter((d) => duplicateIssueStage(d) === "detected" || duplicateIssueStage(d) === "in-review").length} pending` : "—"}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => navigate("/students/duplicates")} disabled={duplicateIssues.length === 0}>
                      Open
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-medium">Duplicate Aliases</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {duplicateAliasIssues.length > 0 ? `${duplicateAliasIssues.length} issues` : "—"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">Orphan Groups</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {orphanGroups.length > 0 ? `${orphanGroups.length} groups` : "—"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-xs font-medium">Profile Warnings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {profileWarnings.length > 0 ? `${profileWarnings.length} warnings` : "—"}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card className="glass p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Custom Fields</p>
                <p className="text-xs text-muted-foreground">Versioned headers that can be mapped like core fields.</p>
              </div>
              <Button variant="ghost" size="sm" className="rounded-lg" onClick={handleReloadRegistry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload
              </Button>
            </div>
              <div className="mt-3 space-y-3">
              <div className="grid gap-2">
                <Input
                  id="custom-field-key"
                  name="customFieldKey"
                  value={customFieldDraft.key}
                  onChange={(event) => setCustomFieldDraft((current) => ({ ...current, key: event.target.value }))}
                  placeholder="key (e.g. house_code)"
                />
                <Input
                  id="custom-field-label"
                  name="customFieldLabel"
                  value={customFieldDraft.label}
                  onChange={(event) => setCustomFieldDraft((current) => ({ ...current, label: event.target.value }))}
                  placeholder="Label"
                />
                <Select
                  name="customFieldType"
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
                <Textarea
                  id="custom-field-options"
                  name="customFieldOptions"
                  rows={3}
                  value={customFieldDraft.options}
                  onChange={(event) => setCustomFieldDraft((current) => ({ ...current, options: event.target.value }))}
                  placeholder="Options, one per line or comma separated"
                />
                <Input
                  id="custom-field-default-value"
                  name="customFieldDefaultValue"
                  value={customFieldDraft.defaultValue}
                  onChange={(event) => setCustomFieldDraft((current) => ({ ...current, defaultValue: event.target.value }))}
                  placeholder="Default value"
                />
                <Textarea
                  id="custom-field-aliases"
                  name="customFieldAliases"
                  rows={2}
                  value={customFieldDraft.aliases}
                  onChange={(event) => setCustomFieldDraft((current) => ({ ...current, aliases: event.target.value }))}
                  placeholder="Aliases, one per line or comma separated"
                />
                <Textarea
                  id="custom-field-notes"
                  name="customFieldNotes"
                  rows={2}
                  value={customFieldDraft.notes}
                  onChange={(event) => setCustomFieldDraft((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Notes"
                />
              </div>
              {customFields.length ? (
                <div className="space-y-2">
                  {customFields.map((field) => (
                    <div key={field.id} className="rounded-xl border border-border/60 bg-card/60 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{field.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {field.key} · {field.type} · v{field.version}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm" className="rounded-lg text-warning hover:text-warning" onClick={() => handleDeleteCustomField(field.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {field.notes ? <p className="mt-2 text-xs text-muted-foreground">{field.notes}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-3 text-sm text-muted-foreground">
                  No custom fields defined.
                </div>
              )}
            </div>
          </Card>

          <StickyActionBar className="justify-end">
            <Button className="rounded-xl" onClick={handleSaveCustomField}>
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Field
            </Button>
          </StickyActionBar>

          <Card className="glass p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Register Preview</p>
                <p className="text-xs text-muted-foreground">What the importer currently thinks it will do.</p>
              </div>
              <Badge variant="secondary">
                {(effectivePreview ?? preview) ? `${(effectivePreview ?? preview)!.summary.total} rows` : "Waiting"}
              </Badge>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Valid rows", value: (effectivePreview ?? preview)?.summary.valid ?? 0, tone: "text-success" },
                { label: "Invalid rows", value: (effectivePreview ?? preview)?.summary.invalid ?? 0, tone: "text-warning" },
                { label: "Exact matches", value: (effectivePreview ?? preview)?.summary.exactMatches ?? 0, tone: "text-primary" },
                { label: "Fuzzy matches", value: (effectivePreview ?? preview)?.summary.fuzzyMatches ?? 0, tone: "text-muted-foreground" },
              ].map((item) => (
                <Card key={item.label} className="border-border/60 bg-card/60 p-3 text-center">
                  <p className={cn("font-display text-2xl font-bold", item.tone)}>{item.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                </Card>
              ))}
            </div>
          </Card>

          <Card className="glass p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Saved Batches</p>
                <p className="text-xs text-muted-foreground">IndexedDB batches ready to resume or delete.</p>
              </div>
              <Button variant="ghost" size="sm" className="rounded-lg" onClick={async () => {
                const batches = await loadImportBatchesFromDB();
                setSavedBatches(batches);
              }}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {loadingBatches ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-3 text-sm text-muted-foreground">Loading...</div>
              ) : savedBatches.length ? (
                savedBatches.slice(0, 5).map((batch) => (
                  <div key={batch.batchId} className="rounded-xl border border-border/60 bg-card/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{batch.batchName}</p>
                        <p className="text-xs text-muted-foreground">
                          {batch.rowCount} rows · {batch.status} · {batch.createdAt.slice(0, 10)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{batch.status}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => setDetailBatch(batch)}>
                        Detail
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={() => void handleResumeBatch(batch)}>
                        Resume
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-lg text-xs text-warning hover:text-warning" onClick={() => void handleDeleteSavedBatch(batch.batchId)}>
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-3 text-sm text-muted-foreground">
                  No saved batches yet.
                </div>
              )}
            </div>
          </Card>

          <Card className="glass p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Batch History</p>
                <p className="text-xs text-muted-foreground">Recent completed imports recorded in audit log.</p>
              </div>
              <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => void handleRefreshHistory()}>
                Refresh
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {loadingHistory ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-3 text-sm text-muted-foreground">
                  Loading history...
                </div>
              ) : historyEntries.length ? (
                historyEntries.map((entry) => (
                  <div key={`${entry.batchName}-${entry.createdAt}`} className="rounded-xl border border-border/60 bg-card/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{entry.batchName}</p>
                        <p className="text-xs text-muted-foreground">{entry.fileName}</p>
                      </div>
                      <Badge variant="secondary">{entry.createdAt.slice(0, 10)}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{entry.rule}</span>
                      <span>{entry.total} rows</span>
                      <span>{entry.inserted} inserted</span>
                      <span>{entry.updated} updated</span>
                      <span>{entry.failed} failed</span>
                    </div>
                    {entry.description ? <p className="mt-2 text-xs text-muted-foreground">{entry.description}</p> : null}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-3 text-sm text-muted-foreground">
                  No completed batches yet.
                </div>
              )}
            </div>
          </Card>

          <Card className="glass p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Warnings</p>
                <p className="text-xs text-muted-foreground">Things to confirm before transfer.</p>
              </div>
              <Badge variant="secondary">{(effectivePreview ?? preview)?.summary.reviews ?? 0} review rows</Badge>
            </div>
            <div className="mt-4 space-y-2">
              {existingError ? (
                <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
                  {existingError}
                </div>
              ) : null}
              {parseError ? (
                <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm text-warning">
                  {parseError}
                </div>
              ) : null}
              {!existingError && !parseError && !preview ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-3 text-sm text-muted-foreground">
                  No warnings yet. Import a file to see duplicate and validation signals here.
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="glass p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Commit Notes</p>
                <p className="text-xs text-muted-foreground">Helpful reminders for the migration run.</p>
              </div>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Rows marked review or invalid are skipped until the operator resolves them.</li>
              <li>• Duplicate detection always runs against the current register loaded from Supabase.</li>
              <li>• Commit writes only the rows approved by the current action state.</li>
            </ul>
          </Card>
        </div>
      </div>
      <ImportBatchDetailDialog batch={detailBatch} open={!!detailBatch} onOpenChange={(open) => { if (!open) setDetailBatch(null); }} />
      <Dialog open={reviewQueueOpen} onOpenChange={setReviewQueueOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Review Queue</DialogTitle>
            <DialogDescription>
              Review suggested mappings from the AI registry engine.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {aiReviewQueue?.queue.map((item) => {
              const alreadyApproved = registryAiState.rules.some((r) => r.normalizedHeader === item.detectedHeader);
              const alreadyIgnored = registryAiState.ignoredHeaders.some((r) => r.normalizedHeader === item.detectedHeader);
              return (
                <div key={item.id} className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-2" data-item-id={item.id} data-header-name={item.detectedHeader}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.detectedHeader}</p>
                      <p className="text-xs text-muted-foreground">
                        Type: {item.type} · Confidence: {item.confidence}
                      </p>
                    </div>
                    <Badge variant={item.type === "conflict" ? "outline" : "secondary"} className={cn(
                      item.type === "conflict" ? "border-amber-200 text-amber-700" : "border-indigo-200 text-indigo-700 bg-indigo-50"
                    )}>
                      {item.type}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.suggestions.map((s) => (
                      <Badge key={s.field.key} variant="outline" className="border-primary/30 text-primary bg-primary/5">
                        {s.field.label} ({s.score}%)
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {item.suggestions.map((s) => (
                      <Button
                        key={s.field.key}
                        size="sm"
                        variant="default"
                        className="review-approve-btn rounded-lg text-xs h-7"
                        onClick={() => handleApproveItem(item.detectedHeader, s.field.key)}
                        disabled={alreadyApproved || alreadyIgnored}
                      >
                        Map: {s.field.label}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="review-ignore-btn rounded-lg text-xs h-7 text-warning hover:text-warning"
                      onClick={() => handleIgnoreItem(item.detectedHeader)}
                      disabled={alreadyApproved || alreadyIgnored}
                    >
                      Ignore
                    </Button>
                  </div>
                </div>
              );
            })}
            {(!aiReviewQueue || aiReviewQueue.queue.length === 0) && (
              <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center text-sm text-muted-foreground">
                No items in the review queue.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
