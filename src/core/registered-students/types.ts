export type RegisteredAction =
  | 'select_all'
  | 'deselect_all'
  | 'invert_select'
  | 'select_by_filter'
  | 'highlight_missing'
  | 'duplicate_detect'
  | 'approve'
  | 'reject'
  | 'compare_versions'
  | 'lock_fields'
  | 'send_correction_request'
  | 'internal_note'
  | 'counselor_note'
  | 'principal_note'
  | 'parent_request_log'
  | 'download_template'
  | 'open_import'
  | 'export_csv'
  | 'export_xlsx'
  | 'export_json'
  | 'export_gov_format'
  | 'download_report'
  | 'open_report_center'
  | 'print_grid'
  | 'subscription'
  | 'copy_view'
  | 'view_grid'
  | 'view_card'
  | 'view_split'
  | 'toggle_compact'
  | 'toggle_wrap'
  | 'toggle_freeze_first'
  | 'toggle_freeze_actions'
  | 'toggle_banded'
  | 'toggle_focus'
  | 'compute_summary'
  | 'chart_report'
  | 'pivot_report'
  | 'group_by'
  | 'control_break'
  | 'save_report'
  | 'permissions'
  | 'field_visibility'
  | 'audit_log'
  | 'restore_version'
  | 'retention_policies';

export interface WorkspacePreset {
  id?: string;
  institutionId: string;
  userId?: string;
  presetName: string;
  viewMode: 'grid' | 'card' | 'split';
  compact: boolean;
  wrap: boolean;
  freezeFirst: boolean;
  freezeActions: boolean;
  bandedRows: boolean;
  focusMode: boolean;
  groupBy?: Record<string, unknown>;
  controlBreak?: Record<string, unknown>;
  visibleColumns?: Record<string, unknown>;
  sortState?: Record<string, unknown>;
  filterState?: Record<string, unknown>;
  reportState?: Record<string, unknown>;
}

export interface WorkspaceAction {
  id?: string;
  institutionId: string;
  userId?: string;
  action: RegisteredAction;
  rowIds?: string[];
  meta?: Record<string, unknown>;
}

export interface ReportSnapshot {
  id?: string;
  institutionId: string;
  userId?: string;
  reportName: string;
  reportState: Record<string, unknown>;
}
