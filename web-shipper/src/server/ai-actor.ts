import { requireShipper } from "./shipper-auth";
import { shipperDb } from "./shipper-db";
import { validUuid, canAi } from "../../../packages/ai-core/policy.mjs";

export async function requireShipperAi(request:Request,ability:string,selected?:string|null) {
  const user=await requireShipper();
  if (!canAi("shipper",ability)) throw Object.assign(new Error("Không có quyền"),{status:403});
  const {data,error}=await shipperDb().from("store_members").select("store_id")
    .eq("user_id",user.user_id).eq("status","active").limit(100);
  if (error) throw Object.assign(new Error("Không truy cập được quyền Shipper"),{status:503});
  const stores=(data??[]).map((entry)=>String(entry.store_id)).filter(validUuid).sort();
  const chosen=selected?.trim() || stores[0];
  if (!chosen || !stores.includes(chosen)) throw Object.assign(new Error("Shipper không thuộc cửa hàng"),{status:403});
  return {userId:user.user_id,role:"shipper" as const,storeId:chosen,storeIds:[chosen]};
}
