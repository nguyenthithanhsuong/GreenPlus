import { resolveStoreContext } from "../../../../backend/core/store-context";
import { supabaseServer } from "../../../../backend/core/supabase";
import { apiFailure } from "../../../../../packages/ai-core/response.mjs";
export const runtime="nodejs";
export async function GET(request:Request){
 try{
  const store=await resolveStoreContext(new URL(request.url).searchParams.get("storeId"));
  const current=new Date().toISOString();
  const response=await supabaseServer.from("promotions")
   .select("id,scope,product_id,batch_id,discount_type,discount_value,start_at,end_at,image_url")
   .eq("store_id",store.storeId).eq("status","active").lte("start_at",current).gt("end_at",current)
   .order("end_at",{ascending:true}).limit(75);
  if(response.error)throw new Error("Không tải được khuyến mãi");
  const list=response.data??[];
  const ids=[...new Set(list.map(row=>row.product_id))];
  const lookup=ids.length?await supabaseServer.from("products").select("product_id,name,image_url")
   .eq("store_id",store.storeId).in("product_id",ids):{data:[],error:null};
  if(lookup.error)throw new Error("Không tìm được tên sản phẩm");
  const products=new Map((lookup.data??[]).map(row=>[row.product_id,row]));
  return Response.json({items:list.filter(row=>products.has(row.product_id)).map(row=>({...row,product_name:products.get(row.product_id)?.name,image_url:row.image_url || products.get(row.product_id)?.image_url || null}))},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return apiFailure(e);}
}
