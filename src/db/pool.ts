import { Pool } from 'pg';

const globalForPool = globalThis as unknown as { pool: Pool | undefined };

function createPool(): Pool {
  const connectionString =
    process.env.DATABASE_URL ||
    (() => {
      const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (url && key) {
        const supabaseUrl = new URL(url);
        const dbHost = supabaseUrl.hostname.replace('.supabase.co', '');
        return `postgresql://postgres:${key}@${supabaseUrl.hostname}:5432/postgres`;
      }
      return undefined;
    })();

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is required for database pool. ' +
      'Set it in .env.local or provide VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  return new Pool({ connectionString, max: 10 });
}

export const pool = globalForPool.pool ?? (globalForPool.pool = createPool());
