import { AppError } from "./errors";
import { createServiceRoleSupabaseClient } from "./supabase";
import { AuthService } from "../modules/auth/auth.service";

export async function portalActor(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.match(/(?:^|;\s*)gp_admin_auth=([^;]+)/)?.[1];
  if (!token) throw new AppError("Unauthorized", 401);
  let identity;
  try {
    identity = await new AuthService().verifySession(decodeURIComponent(token));
  } catch {
    throw new AppError("Unauthorized", 401);
  }
  const db = createServiceRoleSupabaseClient();
  const { data, error } = await db
    .from("users")
    .select("user_id,status,roles(role_name)")
    .eq("user_id", identity.id)
    .single();
  if (error || !data || data.status !== "active")
    throw new AppError("Forbidden", 403);
  const relation = data.roles as unknown as
    { role_name?: string } | { role_name?: string }[] | null;
  const role = (
    Array.isArray(relation) ? relation[0]?.role_name : relation?.role_name
  )?.toLowerCase();
  if (role !== "admin" && role !== "manager")
    throw new AppError("Forbidden", 403);
  return { id: identity.id, role };
}
export async function managerStoreIds(actorId: string): Promise<string[]> {
  const db = createServiceRoleSupabaseClient();
  const [members, owned] = await Promise.all([
    db
      .from("store_members")
      .select("store_id")
      .eq("user_id", actorId)
      .eq("status", "active"),
    db.from("stores").select("store_id").eq("manager_id", actorId),
  ]);
  if (members.error || owned.error)
    throw new AppError("Store membership lookup failed", 503);
  return [
    ...new Set(
      [...(members.data ?? []), ...(owned.data ?? [])].map((row) =>
        String(row.store_id),
      ),
    ),
  ];
}
export async function assertManagerEmployeeTarget(
  actorId: string,
  targetUserId: string,
) {
  const allowed = await managerStoreIds(actorId);
  if (allowed.length === 0) throw new AppError("Forbidden", 403);
  const db = createServiceRoleSupabaseClient();
  const { data, error } = await db
    .from("users")
    .select("user_id,store_id,roles(is_employee)")
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (error) throw new AppError("User lookup failed", 503);
  const rel = data?.roles as unknown as
    { is_employee?: boolean } | { is_employee?: boolean }[] | null;
  const employee = Array.isArray(rel) ? rel[0]?.is_employee : rel?.is_employee;
  if (!data || !employee) throw new AppError("Forbidden", 403);
  const { data: members, error: memberError } = await db
    .from("store_members")
    .select("store_id")
    .eq("user_id", targetUserId)
    .eq("status", "active");
  if (memberError) throw new AppError("User membership lookup failed", 503);
  if (
    !allowed.includes(String(data.store_id ?? "")) &&
    !(members ?? []).some((row) => allowed.includes(String(row.store_id)))
  )
    throw new AppError("Forbidden", 403);
  return allowed;
}
export async function assertEmployeeRoleId(roleId: string | null | undefined) {
  if (!roleId) throw new AppError("Employee role is required", 400);
  const { data, error } = await createServiceRoleSupabaseClient()
    .from("roles")
    .select("is_employee,is_admin,is_manager,is_shipper")
    .eq("role_id", roleId)
    .maybeSingle();
  if (
    error ||
    !data ||
    !data.is_employee ||
    data.is_admin ||
    data.is_manager ||
    data.is_shipper
  )
    throw new AppError("Manager can create employees only", 403);
}
