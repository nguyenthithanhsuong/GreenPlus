import { createAnonSupabaseClient } from "../../core/supabase";

type VerifiedUser = {
  id: string;
  email: string | null;
  role: string;
};

export class AuthService {
  async verifySession(accessToken: string): Promise<VerifiedUser> {
    if (!accessToken.trim()) {
      throw new Error("accessToken is required");
    }

    const supabase = createAnonSupabaseClient();
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
      throw new Error(error?.message ?? "Invalid session");
    }

    return {
      id: data.user.id,
      email: data.user.email ?? null,
      role: data.user.role ?? "authenticated",
    };
  }
}