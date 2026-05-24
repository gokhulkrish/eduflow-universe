import { pool } from '@/db/pool';
import type { RegisteredAction, WorkspacePreset, WorkspaceAction, ReportSnapshot } from './types';
import { createWorkspaceMessage, recordWorkspaceAuditEvent, upsertWorkspaceSubscription } from '../workspace-messaging';

// -- Selection Helpers --

export function applySelectionAction(
  action: RegisteredAction,
  currentIds: string[],
  visibleIds: string[],
): string[] {
  switch (action) {
    case 'select_all':
      return [...visibleIds];
    case 'deselect_all':
      return [];
    case 'invert_select':
      return visibleIds.filter(id => !currentIds.includes(id));
    case 'select_by_filter':
      return [...visibleIds];
    default:
      return currentIds;
  }
}

// -- Presets --

export async function savePreset(
  preset: Omit<WorkspacePreset, 'id'>,
): Promise<string> {
  const res = await pool.query(
    `insert into public.registered_workspace_presets
      (institution_id, user_id, preset_name, view_mode,
       compact, wrap, freeze_first, freeze_actions, banded_rows, focus_mode,
       group_by, control_break, visible_columns, sort_state, filter_state, report_state)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     returning id`,
    [
      preset.institutionId,
      preset.userId ?? null,
      preset.presetName,
      preset.viewMode,
      preset.compact,
      preset.wrap,
      preset.freezeFirst,
      preset.freezeActions,
      preset.bandedRows,
      preset.focusMode,
      preset.groupBy ?? null,
      preset.controlBreak ?? null,
      preset.visibleColumns ?? null,
      preset.sortState ?? null,
      preset.filterState ?? null,
      preset.reportState ?? null,
    ],
  );
  return res.rows[0].id;
}

export async function loadPresets(
  institutionId: string,
  userId?: string,
): Promise<WorkspacePreset[]> {
  if (userId) {
    const res = await pool.query(
      `select id, preset_name, view_mode, compact, wrap,
              freeze_first, freeze_actions, banded_rows, focus_mode,
              group_by, control_break, visible_columns, sort_state, filter_state, report_state
       from public.registered_workspace_presets
       where institution_id = $1 and (user_id = $2 or user_id is null)
       order by preset_name`,
      [institutionId, userId],
    );
    return res.rows.map(mapPresetRow);
  }
  const res = await pool.query(
    `select id, preset_name, view_mode, compact, wrap,
            freeze_first, freeze_actions, banded_rows, focus_mode,
            group_by, control_break, visible_columns, sort_state, filter_state, report_state
     from public.registered_workspace_presets
     where institution_id = $1
     order by preset_name`,
    [institutionId],
  );
  return res.rows.map(mapPresetRow);
}

export async function deletePreset(id: string): Promise<void> {
  await pool.query('delete from public.registered_workspace_presets where id = $1', [id]);
}

function mapPresetRow(row: any): WorkspacePreset {
  return {
    id: row.id,
    institutionId: row.institution_id,
    presetName: row.preset_name,
    viewMode: row.view_mode,
    compact: row.compact,
    wrap: row.wrap,
    freezeFirst: row.freeze_first,
    freezeActions: row.freeze_actions,
    bandedRows: row.banded_rows,
    focusMode: row.focus_mode,
    groupBy: row.group_by,
    controlBreak: row.control_break,
    visibleColumns: row.visible_columns,
    sortState: row.sort_state,
    filterState: row.filter_state,
    reportState: row.report_state,
  };
}

// -- Action Logging --

export async function logWorkspaceAction(
  action: Omit<WorkspaceAction, 'id'>,
): Promise<void> {
  const inserted = await pool.query(
    `insert into public.registered_workspace_actions
      (institution_id, user_id, action, row_ids, meta)
     values ($1,$2,$3,$4,$5)
     returning id`,
    [
      action.institutionId,
      action.userId ?? null,
      action.action,
      action.rowIds ? JSON.stringify(action.rowIds) : null,
      action.meta ?? null,
    ],
  );

  const actionRowId = inserted.rows[0]?.id as string | undefined;
  const meta = (action.meta ?? {}) as Record<string, unknown>;

  if (action.action === 'subscription') {
    const scope = typeof meta.scope === 'string' ? meta.scope.trim() : '';
    if (scope) {
      try {
        await upsertWorkspaceSubscription({
          tenantId: action.institutionId,
          userId: (typeof meta.userId === 'string' && meta.userId.trim()) || action.userId || null,
          scope,
          targetKey: typeof meta.targetKey === 'string' ? meta.targetKey : null,
          enabled: typeof meta.enabled === 'boolean' ? meta.enabled : true,
          delivery: typeof meta.delivery === 'string' ? meta.delivery : 'in_app',
          meta,
        });
      } catch (error) {
        console.warn('[workspace-subscription] failed to persist subscription trail:', error);
      }
    }
  }

  const noteChannel = getActionChannel(action.action);
  if (!noteChannel) return;

  const title = getActionTitle(action.action, meta);
  const body = getActionBody(action.action, meta, title);
  if (!body) return;

  try {
    const message = await createWorkspaceMessage({
      tenantId: action.institutionId,
      channel: noteChannel,
      title,
      body,
      sourceModule: asText(meta.sourceModule) ?? 'registered-students',
      sourceWorkspace: asText(meta.sourceWorkspace) ?? 'registered-students',
      rowIds: action.rowIds?.length ? action.rowIds : undefined,
      createdBy: action.userId ?? undefined,
      meta: {
        ...meta,
        action: action.action,
        sourceModule: asText(meta.sourceModule) ?? 'registered-students',
        sourceWorkspace: asText(meta.sourceWorkspace) ?? 'registered-students',
      },
    });

    await recordWorkspaceAuditEvent({
      tenantId: action.institutionId,
      userId: action.userId ?? undefined,
      action: action.action,
      subjectType: 'registered_workspace_action',
      subjectId: actionRowId ?? message.id,
      messageId: message.id,
      meta: {
        ...meta,
        rowIds: action.rowIds ?? [],
        action: action.action,
        noteChannel,
        sourceModule: asText(meta.sourceModule) ?? 'registered-students',
        sourceWorkspace: asText(meta.sourceWorkspace) ?? 'registered-students',
      },
    });
  } catch (error) {
    console.warn('[workspace-message] failed to persist workspace message trail:', error);
  }
}

// -- Report Snapshots --

export async function saveReportSnapshot(
  snapshot: Omit<ReportSnapshot, 'id'>,
): Promise<string> {
  const res = await pool.query(
    `insert into public.registered_report_snapshots
      (institution_id, user_id, report_name, report_state)
     values ($1,$2,$3,$4)
     returning id`,
    [snapshot.institutionId, snapshot.userId ?? null, snapshot.reportName, snapshot.reportState],
  );
  return res.rows[0].id;
}

export async function listReportSnapshots(
  institutionId: string,
): Promise<ReportSnapshot[]> {
  const res = await pool.query(
    `select id, report_name, report_state, created_at
     from public.registered_report_snapshots
     where institution_id = $1
     order by created_at desc`,
    [institutionId],
  );
  return res.rows.map((r: any) => ({
    id: r.id,
    institutionId,
    reportName: r.report_name,
    reportState: r.report_state,
  }));
}

export async function deleteReportSnapshot(id: string): Promise<void> {
  await pool.query('delete from public.registered_report_snapshots where id = $1', [id]);
}

const ACTION_CHANNELS: Partial<Record<RegisteredAction, 'notice' | 'internal_note' | 'counselor_note' | 'principal_note' | 'parent_request' | 'subscription'>> = {
  internal_note: 'internal_note',
  counselor_note: 'counselor_note',
  principal_note: 'principal_note',
  parent_request_log: 'parent_request',
  subscription: 'subscription',
};

function getActionChannel(action: RegisteredAction) {
  return ACTION_CHANNELS[action] ?? null;
}

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getActionTitle(action: RegisteredAction, meta: Record<string, unknown>): string {
  const custom = asText(meta.title);
  if (custom) return custom;

  switch (action) {
    case 'internal_note':
      return 'Internal Note';
    case 'counselor_note':
      return 'Counselor Note';
    case 'principal_note':
      return 'Principal Review Note';
    case 'parent_request_log':
      return 'Parent Request Log';
    case 'subscription':
      return 'Subscription Update';
    default:
      return action.replace(/_/g, ' ');
  }
}

function getActionBody(action: RegisteredAction, meta: Record<string, unknown>, title: string): string {
  const candidates = [
    asText(meta.body),
    asText(meta.note),
    asText(meta.message),
    asText(meta.detail),
    asText(meta.content),
    title,
  ];
  if (action === 'subscription' && !candidates[0]) {
    const scope = asText(meta.scope);
    const targetKey = asText(meta.targetKey);
    return [scope, targetKey].filter(Boolean).join(' · ') || title;
  }
  return candidates.find(Boolean) ?? title;
}
