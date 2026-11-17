import { requireAiActor } from "../../../../../backend/modules/ai-assist/actor";
import { aiErrorResponse, checkOrigin } from "../../../../../backend/modules/ai-assist/errors";
import { listKnowledge, updateKnowledge, importKnowledgeDrafts } from "../../../../../backend/modules/ai-assist/knowledge";
export const runtime="nodejs";
export async function GET(request:Request) {
  try { const actor=await requireAiActor(request,"knowledge.read",new URL(request.url).searchParams.get("storeId"));
    const reviewer = actor.role === "manager" || actor.role === "admin";
    return Response.json({items:await listKnowledge(actor.storeId,!reviewer,reviewer ? undefined : actor.role,reviewer)},{headers:{"Cache-Control":"no-store"}});
  } catch(error) { return aiErrorResponse(error); }
}
export async function POST(request:Request) {
  try { checkOrigin(request); const value=await request.json() as {storeId?:string};
    const actor=await requireAiActor(request,"knowledge.read",value.storeId);
    return Response.json(await updateKnowledge(actor,value));
  } catch(error) { return aiErrorResponse(error); }
}

/** Import reviewed CSV rows as disabled drafts; server never accepts enabled from input. */
export async function PUT(request:Request) {
  try {
    checkOrigin(request);
    const raw = await request.text();
    if (Buffer.byteLength(raw,"utf8") > 32000) return Response.json({error:"Dữ liệu nhập quá lớn"},{status:413});
    const value = JSON.parse(raw) as {storeId?:string;items?:unknown};
    const actor = await requireAiActor(request,"knowledge.read",value.storeId);
    return Response.json(await importKnowledgeDrafts(actor,value));
  } catch(error) { return aiErrorResponse(error); }
}
