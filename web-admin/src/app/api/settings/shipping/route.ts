import { portalActor, managerStoreIds } from '../../../../../backend/core/manager-scope';
import { AppError } from '../../../../../backend/core/errors';
import { createServiceRoleSupabaseClient } from '../../../../../backend/core/supabase';
import { normalizeShippingConfig } from '../../../../../../packages/location/shipping-fee.mjs';
export const runtime='nodejs';
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
async function actorStores(request:Request) {
  const actor=await portalActor(request);
  const db=createServiceRoleSupabaseClient();
  if(actor.role==='admin') {
    const {data,error}=await db.from('stores').select('store_id,name').order('name').limit(100);
    if(error)throw Error('Stores unavailable');
    return {db,stores:data??[]};
  }
  const allowed=await managerStoreIds(actor.id);
  if(!allowed.length)return {db,stores:[]};
  const {data,error}=await db.from('stores').select('store_id,name').in('store_id',allowed).order('name').limit(100);
  if(error)throw Error('Stores unavailable');
  return {db,stores:data??[]};
}
export async function GET(request:Request) {
  try {
    const {db,stores}=await actorStores(request);
    const storeId=new URL(request.url).searchParams.get('storeId')??stores[0]?.store_id;
    if(!storeId) return Response.json({stores,storeId:null,config:null},{headers:{'Cache-Control':'no-store'}});
    if(!stores.some(store=>store.store_id===storeId))return Response.json({error:'Forbidden'},{status:403});
    const {data,error}=await db.from('store_settings').select('shipping_config,updated_at').eq('store_id',storeId).maybeSingle();
    if(error)throw Error('Settings unavailable');
    return Response.json({stores,storeId,config:normalizeShippingConfig(data?.shipping_config as Record<string,number>|null),updatedAt:data?.updated_at??null},{headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    if(error instanceof AppError && (error.statusCode===401 || error.statusCode===403))
      return Response.json({error:error.statusCode===401?'Chưa đăng nhập':'Không có quyền truy cập'},{status:error.statusCode});
    return Response.json({error:'Không thể đọc cấu hình phí vận chuyển'},{status:503});
  }
}
export async function PUT(request:Request) {
  try {
    const origin=request.headers.get('origin');
    if(origin && origin!==new URL(request.url).origin)return Response.json({error:'Origin không hợp lệ'},{status:403});
    if(!(request.headers.get('content-type')??'').startsWith('application/json'))return Response.json({error:'JSON required'},{status:415});
    if(Number(request.headers.get('content-length')??0)>2048)return Response.json({error:'Payload quá lớn'},{status:413});
    const {db,stores}=await actorStores(request);
    const body=await request.json() as {storeId?:string;config?:Record<string,number>;updatedAt?:string};
    if(!UUID.test(body.storeId??'') || !stores.some(store=>store.store_id===body.storeId))return Response.json({error:'Forbidden'},{status:403});
    const config=normalizeShippingConfig(body.config,{strict:true});
    // Optimistic concurrency: do not silently overwrite another manager's edits.
    let query=db.from('store_settings').update({shipping_config:config,updated_at:new Date().toISOString()}).eq('store_id',body.storeId!);
    if(typeof body.updatedAt==='string')query=query.eq('updated_at',body.updatedAt);
    const {data,error}=await query.select('updated_at').maybeSingle();
    if(error)throw Error('Settings write failed');
    if(!data)return Response.json({error:'Cấu hình đã thay đổi hoặc không tồn tại. Tải lại trước khi lưu.'},{status:409});
    return Response.json({storeId:body.storeId,config,updatedAt:data.updated_at},{headers:{'Cache-Control':'no-store'}});
  } catch(error) {
    if(error instanceof AppError && (error.statusCode===401 || error.statusCode===403))
      return Response.json({error:error.statusCode===401?'Chưa đăng nhập':'Không có quyền truy cập'},{status:error.statusCode});
    return Response.json({error:error instanceof TypeError?'Cấu hình phí ship không hợp lệ':'Không lưu được cài đặt phí vận chuyển'},{status:error instanceof TypeError?400:503});
  }
}
