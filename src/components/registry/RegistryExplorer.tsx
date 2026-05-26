import { useEffect, useMemo, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import {
  getOrderedRegistryFieldsForScope,
  getRegistryMetricsForActiveScope,
  getExplorerFilteredFields,
  fieldToRegistryRow,
  setRegistryContextState,
  type ExplorerFilterOptions,
} from "@/lib/registry-explorer";
import { loadRegistryAiState } from "@/lib/registry-ai-queue";
import ExplorerFieldTable from "./ExplorerFieldTable";

const GROUP_OPTIONS = [
  { value: 'basicInfo', label: 'Basic Information' },
  { value: 'instituteInfo', label: 'Institute Information' },
  { value: 'courseInfo', label: 'Course Information' },
  { value: 'academic', label: 'Academic Information' },
  { value: 'personal', label: 'Personal Information' },
  { value: 'contact', label: 'Contact Information' },
  { value: 'family', label: 'Family Information' },
  { value: 'hostel', label: 'Hostel Information' },
  { value: 'documents', label: 'Documents & Identity' },
  { value: 'other', label: 'Other Information' },
  { value: 'general', label: 'General Information' },
  { value: 'headOfInstitute', label: 'Head of the Institute' },
  { value: 'nodalOfficer', label: 'Nodal Officer' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'hidden', label: 'Archived' },
  { value: 'deprecated', label: 'Deprecated' },
];

const SOURCE_OPTIONS = [
  { value: 'Base', label: 'Base' },
  { value: 'Custom', label: 'Custom' },
  { value: 'Fetched', label: 'Fetched' },
  { value: 'Import', label: 'Import' },
  { value: 'Detected', label: 'Detected' },
];

const PAGE_SIZES = [25, 50];

export default function RegistryExplorer() {
  const [filters, setFilters] = useState<ExplorerFilterOptions>({
    groups: [],
    statuses: [],
    sources: [],
    search: '',
  });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const [aiVersion, setAiVersion] = useState(0);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'sms.registry-ai-state.v1') setAiVersion(v => v + 1);
    };
    const customHandler = () => setAiVersion(v => v + 1);
    window.addEventListener('storage', handler);
    window.addEventListener('sms:ai-state-changed', customHandler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('sms:ai-state-changed', customHandler);
    };
  }, []);

  const allFields = useMemo(() => getOrderedRegistryFieldsForScope('student', { includeStatuses: ['active', 'hidden', 'deprecated'] }), []);
  const metrics = useMemo(() => getRegistryMetricsForActiveScope(), []);
  const aiState = useMemo(() => loadRegistryAiState(), [aiVersion]);

  const filtered = useMemo(() => getExplorerFilteredFields(allFields, filters), [allFields, filters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const rows = useMemo(() => paged.map(f => fieldToRegistryRow(f, aiState)), [paged, aiState]);

  useEffect(() => {
    setRegistryContextState({ module: 'student' });
  }, []);

  const onOpenMapping = useCallback((fieldId: string) => {
    setRegistryContextState({ field: fieldId, view: 'mapping', module: 'student' });
    window.dispatchEvent(new CustomEvent('sms:navigate-registry-tab', { detail: { tab: 'mapping', fieldId } }));
  }, []);

  const onViewAiLinks = useCallback((fieldId: string) => {
    setRegistryContextState({ field: fieldId, view: 'diagnostics', module: 'student' });
    window.dispatchEvent(new CustomEvent('sms:navigate-registry-tab', { detail: { tab: 'diagnostics', fieldId } }));
  }, []);

  const toggleFilter = (key: keyof ExplorerFilterOptions, value: string) => {
    setFilters(prev => {
      const arr = [...(prev[key] as string[] || [])];
      const idx = arr.indexOf(value);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(value);
      const next = { ...prev, [key]: arr };
      setPage(0);
      return next;
    });
  };

  const clearFilters = () => {
    setFilters({ groups: [], statuses: [], sources: [], search: '' });
    setPage(0);
  };

  const hasFilters = (filters.groups?.length || filters.statuses?.length || filters.sources?.length || (filters.search?.length ?? 0) >= 2);

  return (
    <div className="flex gap-4">
      {/* Filter Sidebar */}
      <div className="w-56 shrink-0 space-y-4">
        <Card className="glass p-3">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">GROUPS</p>
          <div className="flex flex-wrap gap-1.5">
            {GROUP_OPTIONS.map(g => (
              <button
                key={g.value}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  filters.groups?.includes(g.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => toggleFilter('groups', g.value)}
              >
                {g.label}
              </button>
            ))}
          </div>
        </Card>

        <Card className="glass p-3">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">STATUS</p>
          <div className="space-y-1">
            {STATUS_OPTIONS.map(s => (
              <label key={s.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-primary"
                  checked={filters.statuses?.includes(s.value) ?? false}
                  onChange={() => toggleFilter('statuses', s.value)}
                />
                <span className="text-xs">{s.label}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="glass p-3">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">SOURCE</p>
          <div className="space-y-1">
            {SOURCE_OPTIONS.map(s => (
              <label key={s.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-primary"
                  checked={filters.sources?.includes(s.value) ?? false}
                  onChange={() => toggleFilter('sources', s.value)}
                />
                <span className="text-xs">{s.label}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="glass p-3">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">SEARCH</p>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 rounded-lg pl-7 text-xs"
              placeholder="label, key, aliases..."
              value={filters.search || ''}
              onChange={e => { setFilters(prev => ({ ...prev, search: e.target.value })); setPage(0); }}
            />
          </div>
        </Card>

        {hasFilters && (
          <Button size="sm" variant="ghost" className="w-full text-xs" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" /> Clear filters
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="min-w-0 flex-1 space-y-3">
        {/* Metrics Header */}
        <Card className="glass p-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-muted-foreground">Metrics</span>
            <Badge variant="secondary">Total: {metrics.total}</Badge>
            <Badge variant="secondary" className="bg-success/10 text-success">Active: {metrics.active}</Badge>
            <Badge variant="secondary" className="bg-primary/10 text-primary">System: {metrics.system}</Badge>
            <Badge variant="secondary" className="bg-warning/10 text-warning">Custom: {metrics.custom}</Badge>
            <Badge variant="secondary" className="bg-primary/10 text-primary">Canonical: {metrics.canonical}</Badge>
            <Badge variant="secondary" className="bg-destructive/10 text-destructive">Detected: {metrics.detected}</Badge>
            <Badge variant="secondary" className="bg-success/10 text-success">Mapped: {metrics.mapped}</Badge>
            <Badge variant="secondary" className="bg-warning/10 text-warning">Review: {metrics.reviewCount}</Badge>
          </div>
        </Card>

        {/* Count + Pagination */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {paged.length} of {filtered.length} fields</span>
          <div className="flex items-center gap-2">
            <span>Rows:</span>
            {PAGE_SIZES.map(ps => (
              <button
                key={ps}
                className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                  pageSize === ps ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
                onClick={() => { setPageSize(ps); setPage(0); }}
              >
                {ps}
              </button>
            ))}
            <span className="mx-1">|</span>
            <button
              className="rounded px-2 py-0.5 text-[11px] hover:bg-muted disabled:opacity-30"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(0, Math.min(safePage - 2, totalPages - 5));
              const p = start + i;
              if (p >= totalPages) return null;
              return (
                <button
                  key={p}
                  className={`rounded px-2 py-0.5 text-[11px] font-medium ${
                    safePage === p ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  onClick={() => setPage(p)}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              className="rounded px-2 py-0.5 text-[11px] hover:bg-muted disabled:opacity-30"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(safePage + 1)}
            >
              Next
            </button>
          </div>
        </div>

        {/* Field Table */}
        <ExplorerFieldTable
          fields={rows}
          onOpenMapping={onOpenMapping}
          onViewAiLinks={onViewAiLinks}
        />
      </div>
    </div>
  );
}
