import { createServiceRoleSupabaseClient } from "./supabase";
import { AppError } from "./errors";

const PERMISSION_KEYS = [
  // Auth
  "auth.login",

  // Users
  "users.create",
  "users.read",
  "users.update",
  "users.delete",

  // Roles
  "roles.create",
  "roles.read",
  "roles.update",
  "roles.delete",

  // Stores
  "stores.create",
  "stores.read",
  "stores.update",
  "stores.delete",

  // Suppliers
  "suppliers.create",
  "suppliers.read",
  "suppliers.update",
  "suppliers.delete",
  "suppliers.approve",

  // Categories
  "categories.create",
  "categories.read",
  "categories.update",
  "categories.delete",

  // Products
  "products.create",
  "products.read",
  "products.update",
  "products.delete",

  // Batches
  "batches.create",
  "batches.read",
  "batches.update",
  "batches.delete",
  "batches.qr_scan",

  // Inventory
  "inventory.read",
  "inventory.update",

  // Prices
  "prices.create",
  "prices.read",
  "prices.update",
  "prices.delete",

  // Orders / Deliveries
  "orders.read",
  "orders.assign",
  "orders.update_status",
  "deliveries.view_assigned",

  // Content
  "content.create",
  "content.read",
  "content.update",
  "content.delete",

  // Complaints
  "complaints.read",
  "complaints.update",

  // Reports
  "reports.business_view",
  "reports.customer_analytics",
  "reports.finance",
];

const FLAG_TO_PERMISSIONS: Record<string, string[]> = {
  is_admin: PERMISSION_KEYS.slice(),
  is_manager: [
    "auth.login",
    // users: manager can read users
    "users.read",
    // stores
    "stores.read",
    // suppliers: C,R,U
    "suppliers.create",
    "suppliers.read",
    "suppliers.update",
    "suppliers.approve",
    // categories: C,R,U
    "categories.create",
    "categories.read",
    "categories.update",
    // products: full
    "products.create",
    "products.read",
    "products.update",
    // batches: full
    "batches.create",
    "batches.read",
    "batches.update",
    "batches.delete",
    // inventory R,U
    "inventory.read",
    "inventory.update",
    // prices C,R,U
    "prices.create",
    "prices.read",
    "prices.update",
    // orders
    "orders.read",
    "orders.assign",
    "orders.update_status",
    // deliveries
    "deliveries.view_assigned",
    // content moderation
    "content.create",
    "content.read",
    "content.update",
    "content.delete",
    // complaints
    "complaints.read",
    "complaints.update",
    // reports
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

export async function getRoleRow(roleId: string | null) {
  if (!roleId) return null;
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.from("roles").select("*").eq("role_id", roleId).limit(1).maybeSingle();
  if (error) {
    throw new AppError("Failed to load role information: " + error.message);
  }
  return data as Record<string, any> | null;
}

export async function getPermissionsForRole(roleRow: Record<string, any> | null) {
  if (!roleRow) return [] as string[];

  // If role has explicit boolean flags, map them to permission keys
  const collected = new Set<string>();
  for (const flag of Object.keys(FLAG_TO_PERMISSIONS)) {
    if (roleRow[flag] === true || roleRow[flag] === 1) {
      for (const p of FLAG_TO_PERMISSIONS[flag]) collected.add(p);
    }
  }

  // If there is a role_permissions table with permission keys, try to include them too.
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from("role_permissions")
      .select("permissions(key)")
      .eq("role_id", roleRow.role_id);

    if (!error && Array.isArray(data)) {
      for (const row of data) {
        if (row?.permissions?.key) collected.add(row.permissions.key);
      }
    }
  } catch {
    // ignore — permissions table may not exist yet
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
  // Admin shortcut: if user's role row has is_admin true, allow
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
