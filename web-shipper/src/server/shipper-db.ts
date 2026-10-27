// Server-only: imported exclusively by Next.js route handlers.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let instance: SupabaseClient | undefined;

/** Service role is used ONLY on the server. All queries must enforce shipper ownership. */
export function shipperDb(): SupabaseClient {
  if (instance) return instance;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing server-side Supabase configuration');
  instance = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return instance;
}
