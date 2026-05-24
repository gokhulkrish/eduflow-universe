import { pool } from '@/db/pool';
import type { InstituteIdentity, HeaderConfig, ExperienceSettings } from './types';

export interface InstituteProfileRow {
  identity: InstituteIdentity;
  headerConfig?: HeaderConfig[];
  settings?: ExperienceSettings;
}

// -- Profile --

export async function loadProfile(institutionId: string): Promise<InstituteProfileRow | null> {
  const res = await pool.query(
    `select identity, header_config, settings
     from public.institute_profile
     where institution_id = $1`,
    [institutionId],
  );

  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  return {
    identity: row.identity,
    headerConfig: row.header_config,
    settings: row.settings,
  };
}

export async function saveProfile(
  institutionId: string,
  profile: Partial<InstituteProfileRow>,
  userId?: string,
): Promise<void> {
  const current = await pool.query(
    'select identity, header_config, settings from public.institute_profile where institution_id = $1',
    [institutionId],
  );
  const before = current.rows.length > 0
    ? { identity: current.rows[0].identity, headerConfig: current.rows[0].header_config, settings: current.rows[0].settings }
    : null;

  await pool.query(
    `insert into public.institute_profile (institution_id, identity, header_config, settings, updated_by)
     values ($1, $2, $3, $4, $5)
     on conflict (institution_id)
     do update set
       identity = coalesce(excluded.identity, public.institute_profile.identity),
       header_config = coalesce(excluded.header_config, public.institute_profile.header_config),
       settings = coalesce(excluded.settings, public.institute_profile.settings),
       updated_by = excluded.updated_by,
       updated_at = now()`,
    [
      institutionId,
      profile.identity ?? null,
      profile.headerConfig ?? null,
      profile.settings ?? null,
      userId ?? null,
    ],
  );

  await pool.query(
    `insert into public.institute_settings_history (institution_id, changed_by, before_state, after_state)
     values ($1, $2, $3, $4)`,
    [
      institutionId,
      userId ?? null,
      before,
      { identity: profile.identity, headerConfig: profile.headerConfig, settings: profile.settings },
    ],
  );
}

// -- Header Resolution --

export function resolveHeaderMapping(headers: HeaderConfig[]) {
  return headers
    .filter(h => h.visible)
    .sort((a, b) => a.order - b.order)
    .map(h => ({
      key: h.key,
      label: h.label,
      mappedTo: h.mappedTo ?? h.key,
      aliasOf: h.aliasOf,
      group: h.group,
    }));
}

// -- Settings History --

export async function getSettingsHistory(institutionId: string, limit = 50) {
  const res = await pool.query(
    `select id, changed_by, before_state, after_state, reason, created_at
     from public.institute_settings_history
     where institution_id = $1
     order by created_at desc
     limit $2`,
    [institutionId, limit],
  );
  return res.rows;
}
