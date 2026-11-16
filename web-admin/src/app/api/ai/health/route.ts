import { portalActor } from "../../../../../backend/core/manager-scope";
import { aiServiceEndpoint } from "../../../../../../packages/ai-core/ai-client.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

/** Diagnose the private AI container without exposing its credentials or URL. */
export async function GET(request: Request) {
  try {
    const actor = await portalActor(request);
    if (actor.role !== "admin") return Response.json({ status: "forbidden" }, { status: 403, headers });
  } catch { return Response.json({ status: "unauthorized" }, { status: 401, headers }); }
  let endpoint: ReturnType<typeof aiServiceEndpoint>;
  try { endpoint = aiServiceEndpoint(); }
  catch { return Response.json({ status: "unconfigured", message: "Thiếu URL AI hoặc khóa máy chủ tối thiểu 32 byte; kiểm tra biến môi trường trên Web Admin." }, { status: 503, headers }); }
  try {
    const response = await fetch(new URL("/health", endpoint.base), {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(3500),
    });
    if (response.ok) return Response.json({ status: "ready", message: "AI Assist đang phản hồi." }, { headers });
    return Response.json({ status: "unavailable", message: "AI Assist phản hồi lỗi; kiểm tra container và healthcheck." }, { status: 503, headers });
  } catch {
    return Response.json({ status: "unavailable", message: "Web Admin không kết nối được service AI; kiểm tra mạng Docker, DNS và port 8100." }, { status: 503, headers });
  }
}
