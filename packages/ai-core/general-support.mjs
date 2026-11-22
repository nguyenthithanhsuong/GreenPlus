/** Tenant-scoped live human support, independent of an order. Server-only. */
import { safeText, validUuid } from './policy.mjs';
import { SupportError } from './support-server.mjs';
const STAFF = new Set(['manager','employee']);
const CREATORS = new Set(['manager','employee','customer','shipper']);
function result(response) {
  if (response.error) throw new SupportError('Không thể truy cập dữ liệu hỗ trợ',503);
  return response.data;
}
function scope(actor) {
  const storeId=actor?.storeIds?.[0];
  if (!validUuid(storeId)||!validUuid(actor.userId)) throw new SupportError('Cửa hàng hoặc tài khoản không hợp lệ',403);
  return storeId;
}
function allowed(actor,record) {
  if (!actor.storeIds.includes(record.store_id)) return false;
  if (STAFF.has(actor.role)) return true;
  if (actor.role==='admin') return record.is_escalated===true;
  return actor.userId===record.created_by;
}
async function quota(db,actor,action,limit) {
  const {data,error}=await db.rpc('gp_consume_submission_quota',{
    p_store:scope(actor),p_actor:actor.userId,p_action:action,p_limit:limit,
  });
  if(error)throw new SupportError('Bộ giới hạn gửi tin chưa sẵn sàng',503);
  if(data!==true)throw new SupportError('Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau',429);
}
export async function listInquiries(db,actor) {
  const storeId=scope(actor);
  let q=db.from('support_inquiries').select('id,store_id,created_by,subject,status,is_escalated,created_at,updated_at')
    .eq('store_id',storeId).order('created_at',{ascending:false}).limit(80);
  if (!STAFF.has(actor.role)&&actor.role!=='admin')q=q.eq('created_by',actor.userId);
  if (actor.role==='admin')q=q.eq('is_escalated',true);
  const rows=result(await q)??[];
  return rows.filter(row=>allowed(actor,row));
}
export async function getInquiry(db,actor,id) {
  const storeId=scope(actor);
  if(!validUuid(id))throw new SupportError('Mã hội thoại không hợp lệ',400);
  const row=result(await db.from('support_inquiries').select('*').eq('id',id).eq('store_id',storeId).maybeSingle());
  if(!row)throw new SupportError('Không tìm thấy hội thoại',404);
  if(!allowed(actor,row))throw new SupportError('Không có quyền truy cập hội thoại',403);
  return row;
}
export async function startInquiry(db,actor,subjectValue) {
  const storeId=scope(actor);
  if(!CREATORS.has(actor.role))throw new SupportError('Không được tạo hội thoại',403);
  const subject=safeText(subjectValue,160,3);
  if(!subject)throw new SupportError('Vui lòng nhập chủ đề từ 3 đến 160 ký tự',400);
  await quota(db,actor,'support.inquiry',12);
  const row=result(await db.from('support_inquiries').insert({store_id:storeId,created_by:actor.userId,created_role:actor.role,subject})
    .select('id,store_id,created_by,subject,status,is_escalated,created_at').single());
  if(!row || row.store_id!==storeId || row.created_by!==actor.userId)throw new SupportError('Kết quả tạo hội thoại không hợp lệ',503);
  return row;
}
export async function listInquiryMessages(db,actor,id) {
  await getInquiry(db,actor,id);
  return result(await db.from('support_inquiry_messages').select('id,sender_id,sender_role,body,created_at')
    .eq('store_id',scope(actor)).eq('inquiry_id',id).order('created_at',{ascending:false}).limit(150))?.reverse()??[];
}
export async function sendInquiryMessage(db,actor,id,raw) {
  const thread=await getInquiry(db,actor,id);
  if(thread.status!=='open')throw new SupportError('Hội thoại đã đóng',409);
  const body=safeText(raw,2000);
  if(!body)throw new SupportError('Tin nhắn không hợp lệ',400);
  await quota(db,actor,'support.message',80);
  const row=result(await db.from('support_inquiry_messages').insert({store_id:scope(actor),inquiry_id:id,
    sender_id:actor.userId,sender_role:actor.role,body}).select('id,sender_id,sender_role,body,created_at').single());
  if(!row || row.sender_id!==actor.userId)throw new SupportError('Kết quả gửi tin không hợp lệ',503);
  return row;
}
export async function resolveInquiry(db,actor,id) {
  if(!STAFF.has(actor.role)&&actor.role!=='admin')throw new SupportError('Chỉ nhân viên hỗ trợ được đóng hội thoại',403);
  await getInquiry(db,actor,id);
  const row=result(await db.from('support_inquiries').update({status:'resolved',updated_at:new Date().toISOString()})
    .eq('store_id',scope(actor)).eq('id',id).select('id,status').single());
  return row;
}

export async function escalateInquiry(db,actor,id) {
  if(actor.role!=='manager')throw new SupportError('Chỉ Manager được chuyển cấp',403);
  await getInquiry(db,actor,id);
  const row=result(await db.from('support_inquiries').update({is_escalated:true,updated_at:new Date().toISOString()})
    .eq('store_id',scope(actor)).eq('id',id).select('id,is_escalated').single());
  return row;
}
