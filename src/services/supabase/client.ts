import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * `true` when Supabase env vars are present. When `false` the app must run in
 * pure-local mode (LocalStorageDriver only) — see SPEC §6 offline requirement.
 */
export const isSupabaseConfigured = Boolean(url && publishableKey);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY not set — running in local-only mode.'
  );
}

/**
 * Singleton browser client. Auth session is persisted to localStorage and
 * refreshed automatically. Safe to ship the publishable key: Row Level Security
 * on `public.progress` restricts every row to its owner.
 */
export const supabase = createClient<Database>(url ?? '', publishableKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
