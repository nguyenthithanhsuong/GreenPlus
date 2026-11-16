import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AuthService } from "../../../../../backend/modules/auth/auth.service";
import { createServiceRoleSupabaseClient } from "../../../../../backend/core/supabase";
import { asPortalRole } from "../../../../lib/portal-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };

type RoleRow = { role_name?: string | null };

export async function GET() {
  const token = (await cookies()).get("gp_admin_auth")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStore });
  }
  let identity: { id: string; role: string };
  try {
    identity = await new AuthService().verifySession(token);
  } catch {
    return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" }, { status: 401, headers: noStore });
  }
  const { data, error } = await createServiceRoleSupabaseClient()
    .from("users")
    .select("user_id,status,roles(role_name)")
    .eq("user_id", identity.id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: "Không thể xác minh quyền truy cập" }, { status: 503, headers: noStore });
  }
  const rawRoles = data?.roles as RoleRow | RoleRow[] | null | undefined;
  const currentRole = asPortalRole(Array.isArray(rawRoles) ? rawRoles[0]?.role_name : rawRoles?.role_name);
  if (!data || data.status !== "active" || !currentRole || currentRole !== asPortalRole(identity.role)) {
    return NextResponse.json({ error: "Tài khoản hoặc quyền truy cập đã thay đổi" }, { status: 403, headers: noStore });
  }
  return NextResponse.json({ userId: data.user_id, role: currentRole }, { headers: noStore });
}
