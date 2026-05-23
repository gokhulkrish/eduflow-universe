import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type EnvBag = Record<string, string | undefined>;

function readEnv(): EnvBag {
  return (globalThis as typeof globalThis & { process?: { env?: EnvBag } }).process?.env ?? {};
}

export function createSupabaseClient(): SupabaseClient | null {
  const env = readEnv();
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}
