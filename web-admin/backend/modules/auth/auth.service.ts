import { createAnonSupabaseClient, supabaseServer } from "../../core/supabase";

type VerifiedUser = {
  id: string;
  email: string | null;
  role: string;
};

export class AuthService {
  async verifySession(accessToken: string): Promise<VerifiedUser> {
    if (!accessToken) {
      throw new Error("Missing access token");
    }

    // 1. verify token with Supabase
    const supabase = createAnonSupabaseClient(accessToken);

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      throw new Error("Invalid session");
    }

    // 2. get role from DB
    const { data: profile, error: profileError } = await supabaseServer
      .from("users")
      .select("user_id, role_name, email")
      .eq("user_id", data.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    return {
      id: profile.user_id,
      email: profile.email,
      role: profile.role_name,
    };
  }
}