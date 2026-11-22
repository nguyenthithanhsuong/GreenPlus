/** Authorized, read-only order status tool for high-level AI. No LLM receives order data. */
import {validUuid} from './policy.mjs';
const UUID_IN_TEXT=/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;
const STATUSES=Object.freeze({
  pending:{vi:'đang chờ xác nhận',en:'pending confirmation'},
  confirmed:{vi:'đã được xác nhận',en:'confirmed'},
  preparing:{vi:'đang được chuẩn bị',en:'being prepared'},
  delivering:{vi:'đang được giao',en:'out for delivery'},
  completed:{vi:'đã hoàn tất',en:'completed'},
  cancelled:{vi:'đã hủy',en:'cancelled'},
});
// The user must be asking for a live status. Generic policy questions containing
// “đơn hàng”, “giao hàng” or “order” must still reach FAQ/RAG.
const ORDER_CONTEXT=/(?:\b(?:order|shipment|delivery)\b|đơn(?: hàng)?|giao hàng)/i;
const STATUS_INTENT=/(?:\b(?:status|track|tracking)\b|where is|where's|trạng thái|tình trạng|đang ở đâu|đến đâu|theo dõi|đã giao|đang giao)/i;
function deny(locale){return locale==='en'?'No order was found in your authorized store/account.':'Không tìm thấy đơn hàng trong phạm vi tài khoản và cửa hàng của bạn.';}
function pack(answer){return {answer,sources:[],confidence:1,mode:'authorized_order_lookup',level:'high',handoff:false,degraded:false};}
/** A status request without order ID is answered locally, not forwarded to LLM. */
export async function readAuthorizedOrderStatus(db,actor,question,locale='vi'){
  if(typeof question!=='string'||!ORDER_CONTEXT.test(question)||!STATUS_INTENT.test(question))return null;
  const id=question.match(UUID_IN_TEXT)?.[0];
  if(!id)return pack(locale==='en'?'Please provide the order UUID to check its status.':'Vui lòng cung cấp mã UUID của đơn hàng để kiểm tra trạng thái.');
  if(!validUuid(id))return pack(deny(locale));
  const storeId=actor?.storeId,userId=actor?.userId;
  if(!validUuid(storeId)||!validUuid(userId))throw Object.assign(new Error('Unauthorized order scope'),{status:403});
  const role=actor.role;
  if(!['customer','shipper','manager','employee'].includes(role))return pack(deny(locale));
  if(role==='shipper'){
    const assignment=await db.from('deliveries').select('order_id').eq('store_id',storeId)
      .eq('employee_id',userId).eq('order_id',id).maybeSingle();
    if(assignment.error)throw Object.assign(new Error('Cannot verify assigned delivery'),{status:503});
    if(!assignment.data)return pack(deny(locale));
  }
  let query=db.from('orders').select('order_id,store_id,user_id,status').eq('order_id',id).eq('store_id',storeId);
  if(role==='customer')query=query.eq('user_id',userId);
  const {data,error}=await query.maybeSingle();
  if(error)throw Object.assign(new Error('Order verification unavailable'),{status:503});
  if(!data||data.store_id!==storeId||(role==='customer'&&data.user_id!==userId))return pack(deny(locale));
  const known=STATUSES[String(data.status)]?.[locale]??(locale==='en'?'status unavailable':'trạng thái chưa xác định');
  return pack(locale==='en'?`Order ${id} is ${known}. This is the latest stored status, not a delivery-time estimate.`:`Đơn hàng ${id} ${known}. Đây là trạng thái ghi nhận trong hệ thống, không phải dự kiến giờ giao.`);
}
