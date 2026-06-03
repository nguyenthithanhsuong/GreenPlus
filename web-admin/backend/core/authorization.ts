import { createServiceRoleSupabaseClient } from "./supabase";
import { AppError } from "./errors";

type RoleRow = Record<string, unknown> & {
  role_id?: string;
  is_admin?: boolean | number;
};

const PERMISSION_KEYS = [
  "auth.login",

  "users.create",
  "users.read",
  "users.update",
  "users.delete",

  "roles.create",
  "roles.read",
  "roles.update",
  "roles.delete",

  "stores.create",
  "stores.read",
  "stores.update",
  "stores.delete",

  "suppliers.create",
  "suppliers.read",
  "suppliers.update",
  "suppliers.delete",
  "suppliers.approve",

  "categories.create",
  "categories.read",
  "categories.update",
  "categories.delete",

  "products.create",
  "products.read",
  "products.update",
  "products.delete",

  "batches.create",
  "batches.read",
  "batches.update",
  "batches.delete",
  "batches.qr_scan",

  "inventory.read",
  "inventory.update",

  "prices.create",
  "prices.read",
  "prices.update",
  "prices.delete",

  "orders.read",
  "orders.assign",
  "orders.update_status",
  "deliveries.view_assigned",

  "content.create",
  "content.read",
  "content.update",
  "content.delete",

  "complaints.read",
  "complaints.update",

  "reports.business_view",
  "reports.customer_analytics",
  "reports.finance",
];

const FLAG_TO_PERMISSIONS: Record<string, string[]> = {
  is_admin: PERMISSION_KEYS.slice(),
  is_manager: [
    "auth.login",
    
    "users.read",
    
    "stores.read",
    
    "suppliers.create",
    "suppliers.read",
    "suppliers.update",
    "suppliers.approve",

    "categories.create",
    "categories.read",
    "categories.update",
    
    "products.create",
    "products.read",
    "products.update",
    
    "batches.create",
    "batches.read",
    "batches.update",
    "batches.delete",
    
    "inventory.read",
    "inventory.update",
    
    "prices.create",
    "prices.read",
    "prices.update",
    
    "orders.read",
    "orders.assign",
    "orders.update_status",
    
    "deliveries.view_assigned",
    
    "content.create",
    "content.read",
    "content.update",
    "content.delete",
    
    "complaints.read",
    "complaints.update",
    
    "reports.business_view",
    "reports.customer_analytics",
    "reports.finance",
  ],
  is_employee: [
    "auth.login",
    "stores.read",
    "suppliers.read",
    "categories.read",
    "products.read",
    "batches.read",
    "batches.qr_scan",
    "inventory.read",
    "prices.read",
    "orders.read",
    "orders.update_status",
    "deliveries.view_assigned",
    "complaints.read",
    "complaints.update",
  ],
  is_customer: [],
  is_shipper: ["deliveries.view_assigned"],
};

export async function getRoleRow(
  roleId: string | null
): Promise<RoleRow | null> {
  if (!roleId) return null;
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.from("roles").select("*").eq("role_id", roleId).limit(1).maybeSingle();
  if (error) {
    throw new AppError("Failed to load role information: " + error.message);
  }
  return data as RoleRow | null;
}

export async function getPermissionsForRole(roleRow: RoleRow | null) {
  if (!roleRow) return [] as string[];

  const collected = new Set<string>();
  for (const flag of Object.keys(FLAG_TO_PERMISSIONS)) {
    if (roleRow[flag] === true || roleRow[flag] === 1) {
      for (const p of FLAG_TO_PERMISSIONS[flag]) collected.add(p);
    }
  }

  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permissions(key)")
      .eq("role_id", roleRow.role_id);

    if (!error && Array.isArray(data)) {
      for (const row of data ?? []) {
  const permissions = row.permissions as any[];

  for (const permission of permissions ?? []) {
    if (permission?.key) {
      collected.add(permission.key);
    }
  }
}
  }
 } catch {
  }

  return Array.from(collected.values());
}

export async function getPermissionsForUser(userId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.from("users").select("role_id").eq("user_id", userId).limit(1).maybeSingle();
  if (error) throw new AppError("Failed to read user role: " + error.message);
  const roleId = data?.role_id ?? null;
  const roleRow = await getRoleRow(roleId);
  return getPermissionsForRole(roleRow);
}

export async function hasPermissionForUser(userId: string, permissionKey: string) {
  if (!userId) return false;
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.from("users").select("role_id").eq("user_id", userId).limit(1).maybeSingle();
  if (error) throw new AppError("Failed to read user role: " + error.message);
  const roleId = data?.role_id ?? null;
  const roleRow = await getRoleRow(roleId);
  if (!roleRow) return false;
  if (roleRow.is_admin === true || roleRow.is_admin === 1) return true;

  const perms = await getPermissionsForRole(roleRow);
  return perms.includes(permissionKey);
}

export async function requirePermissionForUser(userId: string, permissionKey: string) {
  const ok = await hasPermissionForUser(userId, permissionKey);
  if (!ok) throw new AppError("Forbidden", 403);
}

export { PERMISSION_KEYS };
