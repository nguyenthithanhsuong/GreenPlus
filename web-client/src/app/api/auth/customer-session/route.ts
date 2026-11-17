import { requireCustomerIdentity } from "../../../../../backend/core/request-auth";
import { supabaseServer } from "../../../../../backend/core/supabase";
import { AppError } from "../../../../../backend/core/errors";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
/** Status API for login-screen navigation. Never trust persisted localStorage as a session. */
export async function GET(request: Request) {
  let id: string;
  try { id = requireCustomerIdentity(request).userId; }
  catch (error) { return Response.json({ authenticated: false }, { status: error instanceof AppError && error.statusCode === 500 ? 503 : 401, headers }); }
  try {
    const { data, error } = await supabaseServer.from("users").select("user_id,status,roles(role_name)").eq("user_id",id).maybeSingle();
    if (error) return Response.json({ authenticated:false }, { status:503, headers });
    const roles = data?.roles as {role_name?:string}|{role_name?:string}[]|null|undefined;
    const role = Array.isArray(roles)?roles[0]?.role_name:roles?.role_name;
    if (!data || data.status!=="active" || role?.toLowerCase()!=="customer") return Response.json({ authenticated:false }, { status:401, headers });
    return Response.json({ authenticated:true, userId:id }, { headers });
  } catch { return Response.json({ authenticated:false }, { status:503, headers }); }
}
