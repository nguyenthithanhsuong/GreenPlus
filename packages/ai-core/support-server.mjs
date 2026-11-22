import { canAccessOrderThread, canStartThread } from "./support-policy.mjs";
import { safeText, validUuid } from "./policy.mjs";

export class SupportError extends Error {
  constructor(message, status = 403) { super(message); this.status = status; }
}

function requireData(result) {
  if (result.error) throw new SupportError("Không truy cập được hộp thoại hỗ trợ", 503);
  return result.data;
}

async function currentShipper(db, storeId, orderId) {
  const data = requireData(await db.from("deliveries").select("employee_id")
    .eq("store_id", storeId).eq("order_id", orderId).limit(1));
  return data?.[0]?.employee_id ?? null;
}

export async function getThread(db, actor, threadId) {
  if (!validUuid(threadId)) throw new SupportError("Hội thoại không hợp lệ", 400);
  const thread = requireData(await db.from("support_threads").select("*")
    .eq("id", threadId).eq("store_id", actor.storeIds[0]).maybeSingle());
  if (!thread) throw new SupportError("Không tìm thấy hội thoại", 404);
  if (actor.role === "shipper") {
    const assigned = await currentShipper(db, thread.store_id, thread.order_id);
    if (!assigned || assigned !== actor.userId) throw new SupportError("Đơn không được phân công", 403);
    if (thread.shipper_id !== assigned) {
      const result = await db.from("support_threads").update({ shipper_id: assigned })
        .eq("store_id", thread.store_id).eq("id", thread.id).select().maybeSingle();
      return requireData(result);
    }
  }
  if (!canAccessOrderThread({ ...actor, escalated: Boolean(thread.is_escalated) }, thread))
    throw new SupportError("Không có quyền xem hội thoại", 403);
  return thread;
}

export async function listThreads(db, actor) {
  const storeId = actor.storeIds[0];
  let query = db.from("support_threads").select("id,store_id,order_id,customer_id,shipper_id,status,is_escalated,created_at")
    .eq("store_id", storeId).order("created_at", { ascending: false }).limit(80);
  if (actor.role === "customer") query = query.eq("customer_id", actor.userId);
  if (actor.role === "admin") query = query.eq("is_escalated", true);
  const records = requireData(await query) ?? [];
  if (actor.role !== "shipper") return records.filter((thread) => canAccessOrderThread({ ...actor, escalated: thread.is_escalated }, thread));
  const assigned = requireData(await db.from("deliveries").select("order_id")
    .eq("store_id",storeId).eq("employee_id",actor.userId).limit(100));
  const orderIds = new Set((assigned??[]).map((row)=>row.order_id));
  return records.filter((thread)=>orderIds.has(thread.order_id));
}

export async function startThread(db, actor, orderId) {
  if (!validUuid(orderId)) throw new SupportError("Đơn hàng không hợp lệ", 400);
  const storeId = actor.storeIds[0];
  const order = requireData(await db.from("orders").select("order_id,store_id,user_id")
    .eq("store_id",storeId).eq("order_id",orderId).maybeSingle());
  if (!order) throw new SupportError("Đơn hàng không thuộc cửa hàng", 404);
  const shipperId = await currentShipper(db,storeId,orderId);
  if (!canStartThread(actor, {store_id:storeId,user_id:order.user_id,shipper_id:shipperId}))
    throw new SupportError("Không thể tạo hội thoại cho đơn này",403);
  const inserted = await db.from("support_threads").upsert({store_id:storeId,order_id:orderId,
    customer_id:order.user_id,shipper_id:shipperId}, {onConflict:"store_id,order_id",ignoreDuplicates:true})
    .select("id");
  requireData(inserted);
  const existing=requireData(await db.from("support_threads").select("*")
    .eq("store_id",storeId).eq("order_id",orderId).maybeSingle());
  if (!existing) throw new SupportError("Không tạo được hội thoại",503);
  return getThread(db,actor,existing.id);
}

export async function listMessages(db,actor,threadId) {
  await getThread(db,actor,threadId);
  return requireData(await db.from("support_messages").select("id,sender_id,sender_role,body,created_at")
    .eq("store_id",actor.storeIds[0]).eq("thread_id",threadId)
    .order("created_at",{ascending:false}).limit(150))?.reverse()??[];
}

export async function sendMessage(db,actor,threadId,raw) {
  const thread=await getThread(db,actor,threadId);
  if (thread.status!=="open") throw new SupportError("Hội thoại đã kết thúc",409);
  const body=safeText(raw,2000);
  if (!body) throw new SupportError("Nội dung tin nhắn không hợp lệ",400);
  // Shared PostgreSQL quota (atomic across Vercel instances), not a memory counter.
  // Requires reviewed migration 0022 to be applied before deploying these routes.
  const { data: allowed, error: quotaError } = await db.rpc("gp_consume_submission_quota", {
    p_store:actor.storeIds[0],p_actor:actor.userId,p_action:"support.order-message",p_limit:100,
  });
  if (quotaError) throw new SupportError("Bộ giới hạn gửi tin chưa sẵn sàng",503);
  if (allowed !== true) throw new SupportError("Đã gửi quá nhiều tin nhắn",429);
  const response=await db.from("support_messages").insert({store_id:actor.storeIds[0],
    thread_id:threadId,sender_id:actor.userId,sender_role:actor.role,body})
    .select("id,sender_role,body,created_at").single();
  return requireData(response);
}

export async function escalateThread(db,actor,threadId) {
  if (actor.role!=="manager") throw new SupportError("Chỉ Manager được chuyển cấp",403);
  await getThread(db,actor,threadId);
  const result=await db.from("support_threads").update({is_escalated:true})
    .eq("store_id",actor.storeIds[0]).eq("id",threadId).select("id,is_escalated").single();
  return requireData(result);
}
