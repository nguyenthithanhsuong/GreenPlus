import { createClient } from "@supabase/supabase-js";

export function createSupabaseBrowserClient(appName: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Missing Supabase env vars for ${appName}. Expected NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY`
    );
  }

  return createClient(supabaseUrl, supabaseKey);
}
