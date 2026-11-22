import { requireShipperAi } from "../../../../server/ai-actor";
import { shipperDb } from "../../../../server/shipper-db";
import { apiFailure, requireJsonOrigin, readBoundedJson } from "../../../../../../packages/ai-core/response.mjs";
import { listInquiries, startInquiry } from "../../../../../../packages/ai-core/general-support.mjs";
export const runtime = "nodejs";
async function context(request:Request, selected?:string|null, ability:"support.read"|"support.write"="support.read") {
  return requireShipperAi(request,ability,selected);
}
export async function GET(request:Request) {
  try {
    const actor=await context(request,new URL(request.url).searchParams.get("storeId"));
    return Response.json({items:await listInquiries(shipperDb(),actor)},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiFailure(error); }
}
export async function POST(request:Request) {
  try {
    requireJsonOrigin(request);
    const data=await readBoundedJson(request) as {storeId?:string;subject?:string};
    const actor=await context(request,data.storeId,"support.write");
    return Response.json(await startInquiry(shipperDb(),actor,data.subject),{status:201,headers:{"Cache-Control":"no-store"}});
  } catch(error) { return apiFailure(error); }
}
