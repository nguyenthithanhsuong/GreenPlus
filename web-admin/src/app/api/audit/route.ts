import { NextResponse } from "next/server";
import { portalActor, managerStoreIds } from "../../../../backend/core/manager-scope";
import { createServiceRoleSupabaseClient } from "../../../../backend/core/supabase";
import { hasPermissionForUser } from "../../../../backend/core/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const safe = (input: string | null, max = 100) => input?.trim().slice(0, max) ?? "";
const allowedFields = new Set(["status", "name", "quantity_available", "quantity_reserved", "discount_value", "percentage", "product_id", "batch_id", "start_at", "end_at"]);
function redact(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return Object.fromEntries(Object.entries(value).filter(([key]) => allowedFields.has(key)));
}
export async function GET(request: Request) {
  try {
    const actor = await portalActor(request);
    if (!(await hasPermissionForUser(actor.id, "audit.read"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers });
    }
    const query = new URL(request.url).searchParams;
    const page = Number(query.get("page") ?? "1");
    const pageSize = Number(query.get("size") ?? "20");
    if (!Number.isInteger(page) || page < 1 || page > 10000 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      return NextResponse.json({ error: "Phân trang không hợp lệ" }, { status: 400, headers });
    }
    const storeId = safe(query.get("storeId"));
    const actorId = safe(query.get("actorId"));
    if ((storeId && !uuid.test(storeId)) || (actorId && !uuid.test(actorId))) {
      return NextResponse.json({ error: "Bộ lọc UUID không hợp lệ" }, { status: 400, headers });
    }
    const from = safe(query.get("from"), 30);
    const to = safe(query.get("to"), 30);
    if ((from && !Number.isFinite(Date.parse(from))) || (to && !Number.isFinite(Date.parse(to)))) {
      return NextResponse.json({ error: "Ngày không hợp lệ" }, { status: 400, headers });
    }
    if (from && to && Date.parse(from) > Date.parse(to)) {
      return NextResponse.json({ error: "Ngày bắt đầu sau ngày kết thúc" }, { status: 400, headers });
    }
    const db = createServiceRoleSupabaseClient();
    let allowedStores: string[] | null = null;
    if (actor.role === "manager") {
      allowedStores = await managerStoreIds(actor.id);
      if (!allowedStores.length || (storeId && !allowedStores.includes(storeId))) {
        return NextResponse.json({ items: [], total: 0, page, pageSize }, { headers });
      }
    }
    let builder = db.from("audit_logs")
      .select("id,store_id,actor_id,action,entity,entity_id,before_data,after_data,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
    if (allowedStores) builder = builder.in("store_id", allowedStores);
    else if (storeId) builder = builder.eq("store_id", storeId);
    const entity = safe(query.get("entity"), 70);
    const action = safe(query.get("action"), 100);
    const search = safe(query.get("search"), 70).replace(/[%,()\\]/g, "");
    if (entity) builder = builder.eq("entity", entity);
    if (action) builder = builder.ilike("action", `%${action.replace(/[%,()\\]/g, "")}%`);
    if (actorId) builder = builder.eq("actor_id", actorId);
    if (from) builder = builder.gte("created_at", new Date(from).toISOString());
    if (to) builder = builder.lte("created_at", new Date(to).toISOString());
    if (search) builder = builder.or(`action.ilike.%${search}%,entity.ilike.%${search}%`);
    const { data, error, count } = await builder.range((page - 1) * pageSize, page * pageSize - 1);
    if (error) return NextResponse.json({ error: "Không thể đọc Audit Log" }, { status: 503, headers });
    // The UI uses readable names/links. Never send passwords or full user profiles.
    const rows = data ?? [];
    const actors = [...new Set(rows.map(row => row.actor_id).filter((id): id is string => Boolean(id)))];
    const stores = [...new Set(rows.map(row => row.store_id).filter((id): id is string => Boolean(id)))];
    const [peopleResult, storeResult] = await Promise.all([
      actors.length ? db.from("users").select("user_id,name").in("user_id", actors) : Promise.resolve({ data: [], error: null }),
      stores.length ? db.from("stores").select("store_id,name").in("store_id", stores) : Promise.resolve({ data: [], error: null }),
    ]);
    const names = new Map((peopleResult.error ? [] : peopleResult.data ?? []).map(person => [person.user_id, person.name]));
    const storeNames = new Map((storeResult.error ? [] : storeResult.data ?? []).map(store => [store.store_id, store.name]));
    return NextResponse.json({
      items: rows.map((row) => ({ ...row, actor_name: row.actor_id ? names.get(row.actor_id) ?? "Tài khoản" : "Hệ thống",
        store_name: row.store_id ? storeNames.get(row.store_id) ?? "Cửa hàng" : "Nền tảng",
        before_data: redact(row.before_data), after_data: redact(row.after_data) })),
      total: count ?? 0, page, pageSize,
    }, { headers });
  } catch {
    return NextResponse.json({ error: "Không có quyền hoặc không thể xác minh phiên" }, { status: 403, headers });
  }
}
