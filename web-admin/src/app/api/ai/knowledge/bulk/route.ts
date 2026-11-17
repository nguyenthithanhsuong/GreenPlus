import { requireAiActor } from "../../../../../../backend/modules/ai-assist/actor";
import { aiErrorResponse, checkOrigin } from "../../../../../../backend/modules/ai-assist/errors";
import { bulkKnowledge } from "../../../../../../backend/modules/ai-assist/knowledge";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 32000) return Response.json({error:"Dữ liệu quá lớn"},{status:413});
    const input = JSON.parse(raw) as { storeId?: string };
    const actor = await requireAiActor(request, "knowledge.read", input.storeId);
    return Response.json(await bulkKnowledge(actor, input), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return aiErrorResponse(error); }
}
