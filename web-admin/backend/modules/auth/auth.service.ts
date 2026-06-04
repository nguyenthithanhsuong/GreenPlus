import { createAnonSupabaseClient, supabaseServer } from "../../core/supabase";

type VerifiedUser = {
  id: string;
  email: string | null;
  role: string;
};

function resolveRoleName(profile: {
  roles?: Array<{ role_name?: unknown }> | null;
}): string {
  const firstRole = Array.isArray(profile.roles) ? profile.roles[0] : undefined;
  return typeof firstRole?.role_name === "string" ? firstRole.role_name.toLowerCase() : "";
}

export class AuthService {
  async verifySession(accessToken: string): Promise<VerifiedUser> {
    if (!accessToken) {
      throw new Error("Missing access token");
    }

    const supabase = createAnonSupabaseClient(accessToken);

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      throw new Error("Invalid session");
    }

    let { data: profile, error: profileError } = await supabaseServer
      .from("users")
      .select("user_id, role_id, email, roles(role_name)")
      .eq("user_id", data.user.id)
      .single();

    if ((profileError || !profile) && data.user.email) {
      const fallback = await supabaseServer
        .from("users")
        .select("user_id, role_id, email, roles(role_name)")
        .eq("email", data.user.email)
        .maybeSingle();

      profile = fallback.data ?? null;
      profileError = fallback.error ?? null;
    }

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    let roleName = resolveRoleName(profile);
    if (!roleName && profile.role_id && typeof profile.role_id === "string") {
      const { data: roleData, error: roleError } = await supabaseServer
        .from("roles")
        .select("role_name")
        .eq("role_id", profile.role_id)
        .maybeSingle();

      if (!roleError && roleData && typeof roleData.role_name === "string") {
        roleName = roleData.role_name.toLowerCase();
      }
    }

    return {
      id: profile.user_id,
      email: profile.email,
      role: roleName || "",
    };
  }
}