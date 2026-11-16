import { requireCustomerIdentity } from "../../core/request-auth";
import { resolveStoreContext } from "../../core/store-context";
import { supabaseServer } from "../../core/supabase";
import { canAi } from "../../../../packages/ai-core/policy.mjs";

export async function requireCustomerAi(request:Request,ability:string,requestedStore?:string|null) {
  const identity=requireCustomerIdentity(request);
  const {data,error}=await supabaseServer.from("users").select("user_id,status,roles(is_customer)")
    .eq("user_id",identity.userId).maybeSingle();
  const role=Array.isArray(data?.roles)?data.roles[0]:data?.roles;
  if (error || !data || data.status!=="active" || !role?.is_customer) throw Object.assign(new Error("Tài khoản không có quyền Customer"),{status:403});
  if (!canAi("customer",ability)) throw Object.assign(new Error("Không có quyền"),{status:403});
  const store=await resolveStoreContext(requestedStore,identity);
  return {userId:identity.userId,role:"customer" as const,storeId:store.storeId,storeIds:[store.storeId]};
}
