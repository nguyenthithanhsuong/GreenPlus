import { cookies } from "next/headers";
import { portalActor } from "../../../../../backend/core/manager-scope";
import { fetchDockerGateway } from "../../../../../backend/core/docker-gateway.mjs";
import { callAiService } from "../../../../../../packages/ai-core/ai-client.mjs";
import { assertSameStore,validUuid } from "../../../../../../packages/ai-core/policy.mjs";
import { apiFailure } from "../../../../../../packages/ai-core/response.mjs";
export const runtime="nodejs";
export const dynamic="force-dynamic";

type Inventory={store_id:string;product_id:string;available:number};
type Product={product_id:string;store_id:string;name:string};
export async function GET(request:Request){
 try{
  if(process.env.GREENPLUS_TENANCY_DEMO!=="true")return Response.json({error:"Docker sandbox chưa được bật"},{status:404});
  const actor=await portalActor(request);
  if(actor.role!=="admin")return Response.json({error:"Chỉ Admin có quyền xem sandbox"},{status:403});
  if((await cookies()).get("greenplus_admin_storage_view")?.value!=="docker")return Response.json({error:"Hãy chọn Docker Local trong Settings"},{status:409});
  const storeId=new URL(request.url).searchParams.get("storeId")??"";
  if(!validUuid(storeId))return Response.json({error:"Mã cửa hàng không hợp lệ"},{status:400});
  const [stock,source]=await Promise.all([fetchDockerGateway(`/stores/${storeId}/inventory`),fetchDockerGateway(`/stores/${storeId}/products`)]);
  if(!stock.ok||!source.ok)return Response.json({error:"Không đọc được Docker gateway"},{status:503});
  const inventory=stock.data as {items?:Inventory[]};
  const catalog=source.data as {products?:Product[]};
  if(!Array.isArray(inventory.items)||!Array.isArray(catalog.products))return Response.json({error:"Định dạng gateway không hợp lệ"},{status:503});
  const names=new Map(catalog.products.filter(p=>p.store_id===storeId).map(p=>[p.product_id,p.name]));
  const items=inventory.items.slice(0,200).map(item=>{
    if(item.store_id!==storeId||!names.has(item.product_id)||!Number.isSafeInteger(item.available)||item.available<0)throw new Error("Cross-store or invalid Docker inventory");
    return {product_id:item.product_id,batch_id:null,name:names.get(item.product_id),available:item.available,expires_at:null,history:[]};
  });
  if(!items.length)return Response.json({source:"docker-three-tier-sandbox",status:"no_inventory",items:[],partial:false,previewOnly:true});
  const data=await callAiService("forecast",{store_id:storeId,items});
  assertSameStore(storeId,String(data.store_id??""));
  if(!Array.isArray(data.items)||data.items.some((row:{store_id?:string})=>row.store_id!==storeId))throw new Error("AI returned wrong store");
  return Response.json({source:"docker-three-tier-sandbox",previewOnly:true,partial:inventory.items.length>200,items:data.items,notice:"Sandbox không có dữ liệu lô và lịch sử 90 ngày. Mọi dự báo có độ tin cậy thấp. Không lưu đề xuất hoặc ghi Supabase."},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return apiFailure(error);}
}
