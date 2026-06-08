import { createSupabaseBrowserClient } from "@greenplus/supabase-shared/supabaseClient";

let supabaseInstance: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseBrowserClient("web-client");
  }

  return supabaseInstance;
}