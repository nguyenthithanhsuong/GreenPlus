import { AuthService } from "../modules/auth/auth.service";
import { AppError } from "./errors";
import { createServiceRoleSupabaseClient } from "./supabase";

import type { TenantScope } from "./tenant-store";

type RoleFlags = {
  is_admin?: boolean;
  is_manager?: boolean;
  is_employee?: boolean;
};
const getRole = (value: unknown): RoleFlags | null => {
  if (Array.isArray(value)) return (value[0] as RoleFlags) ?? null;
  return value && typeof value === "object" ? (value as RoleFlags) : null;
};

export async function resolveTenantScope(
  request: Request,
): Promise<TenantScope | null> {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.match(/(?:^|;\s*)gp_admin_auth=([^;]+)/)?.[1];
  if (!token) throw new AppError("Unauthorized", 401);

  let userId: string;
  try {
    userId = (await new AuthService().verifySession(decodeURIComponent(token)))
      .id;
  } catch {
    throw new AppError("Unauthorized", 401);
  }

  const db = createServiceRoleSupabaseClient();
  const { data: user, error } = await db
    .from("users")
    .select("user_id,store_id,status,roles(is_admin,is_manager,is_employee)")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new AppError("Could not verify the current account", 503);
  if (!user || user.status !== "active") throw new AppError("Forbidden", 403);
  const role = getRole(user.roles);
  if (role?.is_admin) return null; // Platform admins may run global aggregate queries.
  if (!role?.is_manager && !role?.is_employee)
    throw new AppError("Forbidden", 403);

  const { data: memberships, error: membersError } = await db
    .from("store_members")
    .select("store_id")
    .eq("user_id", userId)
    .eq("status", "active");
  if (membersError)
    throw new AppError("Could not verify store membership", 503);
  const allowed = new Set(
    (memberships ?? []).map((item) => String(item.store_id)),
  );
  // users.store_id is a default-store hint, NOT an authorization grant.
  // Revoking store_members must immediately remove employee access.
  if (role.is_manager) {
    const { data: managed, error: managedError } = await db
      .from("stores")
      .select("store_id")
      .eq("manager_id", userId);
    if (managedError)
      throw new AppError("Could not verify store ownership", 503);
    for (const item of managed ?? []) allowed.add(String(item.store_id));
  }
  if (!allowed.size) throw new AppError("No authorized store is assigned", 403);

  const cookieStore = cookie.match(/(?:^|;\s*)gp_current_store=([^;]+)/)?.[1];
  const explicit = request.headers.get("x-greenplus-store-id");
  if (explicit && !allowed.has(explicit))
    throw new AppError("Store access denied", 403);
  const preferred =
    typeof user.store_id === "string" && allowed.has(user.store_id)
      ? user.store_id
      : [...allowed].sort()[0];
  const selected =
    explicit ??
    (cookieStore && allowed.has(cookieStore) ? cookieStore : preferred);
  return {
    userId,
    role: role.is_manager ? "manager" : "employee",
    storeIds: [selected],
  };
}
