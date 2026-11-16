import { createServiceRoleSupabaseClient } from "../../../../../backend/core/supabase";
import { AuthService } from "../../../../../backend/modules/auth/auth.service";
import { managerStoreIds } from "../../../../../backend/core/manager-scope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Audited changes are pushed to the browser over SSE (8s database cursor fallback).
// This is near-real-time, NOT a claim of Supabase postgres_changes subscriptions.
export async function GET(request: Request) {
  const token = request.headers.get("cookie")?.match(/(?:^|;\s*)gp_admin_auth=([^;]+)/)?.[1];
  if (!token) return new Response(null, { status: 401 });
  const db = createServiceRoleSupabaseClient();
  try {
    const identity = await new AuthService().verifySession(decodeURIComponent(token));
    const { data: member, error } = await db.from("users")
      .select("user_id,status,roles(role_name)").eq("user_id", identity.id).maybeSingle();
    const relation = member?.roles as unknown as { role_name?: string } | { role_name?: string }[] | null;
    const role = (Array.isArray(relation) ? relation[0]?.role_name : relation?.role_name)?.toLowerCase();
    if (error || !member || member.status !== "active" || role !== identity.role?.toLowerCase() || !role || !["admin","manager","employee"].includes(role)) {
      return new Response(null, { status: 403 });
    }
    let stores: string[] | null = null;
    if (role === "manager") stores = await managerStoreIds(identity.id);
    if (role === "employee") {
      const { data, error: storeError } = await db.from("store_members")
        .select("store_id").eq("user_id", identity.id).eq("status", "active");
      if (storeError) return new Response(null, { status: 503 });
      stores = (data ?? []).map(x => x.store_id);
    }
    const allowed = stores;
    const encoder = new TextEncoder();
    let tick: ReturnType<typeof setInterval> | undefined;
    let stop: ReturnType<typeof setTimeout> | undefined;
    let cursor = new Date().toISOString();
    let inFlight = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(": connected\n\n"));
        const close = () => { if (tick) clearInterval(tick); if (stop) clearTimeout(stop); try { controller.close(); } catch {} };
        const poll = async () => {
          if (request.signal.aborted) { close(); return; }
          if (inFlight || (allowed && allowed.length === 0)) return;
          inFlight = true;
          try {
            let query = db.from("audit_logs").select("id,action,entity,created_at")
              .gt("created_at", cursor).order("created_at", { ascending: false }).limit(1);
            if (allowed) query = query.in("store_id", allowed);
            const { data, error: readError } = await query;
            if (!readError && data?.length) {
              const latest = data[0];
              cursor = latest.created_at;
              controller.enqueue(encoder.encode(`event: activity\ndata: ${JSON.stringify({ action: latest.action, entity: latest.entity, createdAt: latest.created_at })}\n\n`));
            }
          } catch { /* Connection may have closed; the next EventSource reconnect retries. */ }
          finally { inFlight = false; }
        };
        tick = setInterval(() => { controller.enqueue(encoder.encode(": heartbeat\n\n")); void poll(); }, 8000);
        stop = setTimeout(close, 55_000);
        request.signal.addEventListener("abort", close, { once: true });
      },
      cancel() { if (tick) clearInterval(tick); if (stop) clearTimeout(stop); },
    });
    return new Response(stream, { headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "private, no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "Connection": "keep-alive",
    } });
  } catch { return new Response(null, { status: 401 }); }
}
