import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
  throw new Error(
    "Missing Supabase env vars. Expected NEXT_PUBLIC_SUPABASE_URL and one of SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabaseServer = createClient(supabaseUrl, serviceRoleKey ?? anonKey ?? "", {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const isUsingServiceRoleKey = Boolean(serviceRoleKey);
