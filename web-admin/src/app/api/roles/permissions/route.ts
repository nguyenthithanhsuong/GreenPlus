import { portalActor } from "../../../../../backend/core/manager-scope";
import { createServiceRoleSupabaseClient } from "../../../../../backend/core/supabase";

export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store" };

/** Inspection only. Custom grants must not be confused with active legacy flags. */
export async function GET(request: Request) {
  try {
    const actor = await portalActor(request);
    if (actor.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403, headers });
    const db = createServiceRoleSupabaseClient();
    const [roles, permissions, bindings] = await Promise.all([
      db.from("roles").select("role_id,role_name,is_admin,is_manager,is_employee,is_customer,is_shipper").order("role_name"),
      db.from("permissions").select("id,key,description").order("key"),
      db.from("role_permissions").select("role_id,permission_id").limit(20000),
    ]);
    if (roles.error || permissions.error || bindings.error) {
      return Response.json({ error: "Chưa đọc được registry RBAC; kiểm tra migration 0019." }, { status: 503, headers });
    }
    return Response.json({ roles: roles.data ?? [], permissions: permissions.data ?? [], grants: bindings.data ?? [], transitional: true }, { headers });
  } catch { return Response.json({ error: "Không thể xác minh phiên quản trị" }, { status: 401, headers }); }
}
