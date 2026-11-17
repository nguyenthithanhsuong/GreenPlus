import { portalActor } from "../../../../../backend/core/manager-scope";
import { aiServiceEndpoint } from "../../../../../../packages/ai-core/ai-client.mjs";
import { aiDb } from "../../../../../backend/modules/ai-assist/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const reply = (status: string, message: string, http = 503) => Response.json({ status, message }, { status: http, headers });

/** Admin-only diagnostics: no credentials/URL or raw database errors are exposed. */
export async function GET(request: Request) {
  try {
    const actor = await portalActor(request);
    if (actor.role !== "admin") return reply("forbidden", "Không có quyền", 403);
  } catch { return reply("unauthorized", "Chưa đăng nhập", 401); }

  let endpoint: ReturnType<typeof aiServiceEndpoint>;
  try { endpoint = aiServiceEndpoint(); }
  catch { return reply("unconfigured", "Chưa có URL hoặc khóa AI server-to-server hợp lệ trong môi trường Web Admin."); }
  try {
    const health = await fetch(new URL("/health", endpoint.base), {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(4000),
    });
    if (!health.ok) return reply("service_error", "AI container phản hồi lỗi health. Kiểm tra docker compose logs ai-assist.");
    // /health is public. Check a read-only inference call to verify the key is accepted.
    const authorized = await fetch(new URL("/v1/complaints", endpoint.base), {
      method: "POST", redirect: "error", cache: "no-store",
      headers: { "Content-Type": "application/json", "X-AI-Service-Key": endpoint.secret },
      body: JSON.stringify({ store_id: "00000000-0000-4000-8000-000000000000", text: "Kiểm tra kết nối AI Assist" }),
      signal: AbortSignal.timeout(6000),
    });
    if (authorized.status === 401 || authorized.status === 403)
      return reply("key_mismatch", "Container AI đang chạy nhưng khóa AI_SERVICE_KEY không khớp với GREENPLUS_AI_SERVICE_KEY.");
    if (!authorized.ok) return reply("inference_error", "AI container phản hồi health nhưng endpoint phân tích không hoạt động. Xem log AI service.");
  } catch {
    return reply("unreachable", "Web Admin không thể kết nối AI container. Kiểm tra port 8100, Docker Compose và URL nội bộ.");
  }
  // The AI process may be healthy while Supabase-backed AI tables are unavailable.
  try {
    const { error } = await aiDb().from("ai_knowledge").select("id").limit(1);
    if (error) return reply("database_error", "AI service đã kết nối, nhưng không đọc được ai_knowledge. Kiểm tra migration 0016–0019 và Supabase service-role.");
  } catch {
    return reply("database_error", "AI service hoạt động, nhưng kết nối dữ liệu AI trong Supabase chưa sẵn sàng.");
  }
  return reply("ready", "AI container, khóa server-to-server và dữ liệu AI trong Supabase đều sẵn sàng.", 200);
}
