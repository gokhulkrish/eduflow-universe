import { createClient, type RealtimeChannel } from '@supabase/supabase-js';
import { allModules, type ModuleDefinition } from '../module-registry';

type SupabaseLike = ReturnType<typeof createClient>;
type EnvBag = Record<string, string | undefined>;

function readEnv(): EnvBag {
  return (globalThis as typeof globalThis & { process?: { env?: EnvBag } }).process?.env ?? {};
}

export interface ModuleCountSnapshot {
  moduleKey: string;
  count: number;
  updatedAt: string;
}

export interface ModuleSubscriptionOptions {
  module: ModuleDefinition;
  onCount: (snapshot: ModuleCountSnapshot) => void;
  onError?: (error: unknown) => void;
}

export function getSupabaseRealtimeClient() {
  const env = readEnv();
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

export function makeModuleChannelName(moduleKey: string) {
  return 'module:' + moduleKey;
}

export function makeModuleTableName(moduleKey: string) {
  return 'module_' + moduleKey.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
}

export function subscribeToModuleCounts(options: ModuleSubscriptionOptions) {
  const client = getSupabaseRealtimeClient();
  if (!client) {
    options.onCount({ moduleKey: options.module.key, count: 0, updatedAt: new Date().toISOString() });
    return { unsubscribe: () => void 0 };
  }

  const channel = client.channel(makeModuleChannelName(options.module.key));
  const tableName = makeModuleTableName(options.module.key);
  const listener = channel
    .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, payload => {
      const record = (payload.new || payload.old || {}) as Record<string, unknown>;
      options.onCount({
        moduleKey: options.module.key,
        count: Number(record.count ?? 0),
        updatedAt: String(record.updated_at ?? new Date().toISOString()),
      });
    })
    .subscribe(status => { if (status === 'CHANNEL_ERROR') options.onError?.(new Error(`Realtime channel error for ${options.module.key}`)); });

  return {
    channel: listener as RealtimeChannel,
    unsubscribe: () => client.removeChannel(listener),
  };
}

export function getPrimaryModuleSnapshots() {
  return allModules.map(module => ({ moduleKey: module.key, count: 0, updatedAt: new Date().toISOString() }));
}
