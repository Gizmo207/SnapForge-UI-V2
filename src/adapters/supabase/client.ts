import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client. Reads config from the environment; never hard-code
 * keys. The service role key must stay server-only (never shipped to the client).
 */
let cached: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
