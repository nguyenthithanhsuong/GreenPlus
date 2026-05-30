import { createHmac, timingSafeEqual } from "crypto";
import { createAnonSupabaseClient, supabaseServer } from "../../core/supabase";

type VerifiedUser = {
  id: string;
  email: string | null;
  role: string;
};

type CustomSessionTokenPayload = {
  userId: string;
  email: string | null;
  role: string;
  sessionId: string;
  loginTime: string;
};

const CUSTOM_TOKEN_PREFIX = "gpv1";

function resolveRoleName(profile: {
  roles?: Array<{ role_name?: unknown }> | null;
}): string {
  const firstRole = Array.isArray(profile.roles) ? profile.roles[0] : undefined;
  return typeof firstRole?.role_name === "string" ? firstRole.role_name.toLowerCase() : "";
}

export class AuthService {
  private getSessionSecret(): string {
    const secret = process.env.AUTH_HANDOFF_SECRET || process.env.AUTH_SESSION_SECRET;

    if (!secret) {
      throw new Error("Missing session secret");
    }

    return secret;
  }

  private verifyCustomToken(token: string): VerifiedUser {
    const parts = token.split(".");

    if (parts.length !== 3 || parts[0] !== CUSTOM_TOKEN_PREFIX) {
      throw new Error("Invalid session token");
    }

    const [, payload, signature] = parts;
    const expectedSignature = createHmac("sha256", this.getSessionSecret()).update(payload).digest("base64url");

    if (signature.length !== expectedSignature.length) {
      throw new Error("Invalid session token");
    }

    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new Error("Invalid session token");
    }

    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<CustomSessionTokenPayload>;

    if (!parsed.userId || typeof parsed.userId !== "string") {
      throw new Error("Invalid session token");
    }

    return {
      id: parsed.userId,
      email: typeof parsed.email === "string" ? parsed.email : null,
      role: typeof parsed.role === "string" ? parsed.role : "",
    };
  }

  async verifySession(accessToken: string): Promise<VerifiedUser> {
    if (!accessToken) {
      throw new Error("Missing access token");
    }

    if (accessToken.startsWith(`${CUSTOM_TOKEN_PREFIX}.`)) {
      return this.verifyCustomToken(accessToken);
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