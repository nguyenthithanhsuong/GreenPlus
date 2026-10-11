import { AppError } from "./errors";
import { supabaseServer } from "./supabase";

export type TenantPermission =
  | "catalog.read"
  | "inventory.read"
  | "inventory.write"
  | "orders.read"
  | "orders.write"
  | "delivery.read"
  | "delivery.write";

const ROLE_PERMISSIONS: Record<string, TenantPermission[]> = {
  manager: [
    "catalog.read",
    "inventory.read",
    "inventory.write",
    "orders.read",
    "orders.write",
    "delivery.read",
    "delivery.write",
  ],
  employee: [
    "catalog.read",
    "inventory.read",
    "inventory.write",
    "orders.read",
    "orders.write",
    "delivery.read",
  ],
  shipper: ["orders.read", "delivery.read", "delivery.write"],
};

export async function requireTenantPermission(
  userId: string,
  storeId: string,
  permission: TenantPermission,
): Promise<void> {
  const { data: membership, error } = await supabaseServer
    .from("store_members")
    .select("role_id")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500);
  }
  if (!membership) {
    throw new AppError("Forbidden", 403);
  }

  const { data: role, error: roleError } = await supabaseServer
    .from("roles")
    .select("role_name,is_admin")
    .eq("role_id", membership.role_id)
    .maybeSingle();

  if (roleError) {
    throw new AppError(roleError.message, 500);
  }

  const roleName = String(role?.role_name ?? "").toLowerCase();
  const allowed =
    role?.is_admin === true ||
    (ROLE_PERMISSIONS[roleName] ?? []).includes(permission);

  if (!allowed) {
    throw new AppError("Forbidden", 403);
  }
}

export async function requirePlatformAdmin(userId: string): Promise<void> {
  const { data, error } = await supabaseServer
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new AppError(error.message, 500);
  }
  if (!data) {
    throw new AppError("Forbidden", 403);
  }
}
