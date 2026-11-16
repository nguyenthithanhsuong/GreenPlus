import { randomUUID } from "node:crypto";
import { requireAiActor } from "../../../../../../backend/modules/ai-assist/actor";
import { aiErrorResponse, checkOrigin, AiError } from "../../../../../../backend/modules/ai-assist/errors";
import { aiDb } from "../../../../../../backend/modules/ai-assist/db";
export const runtime = "nodejs";
const types: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const BUCKET = "Product-Image";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (Number(request.headers.get("content-length") || 0) > 5_500_000)
      throw new AiError("Ảnh khuyến mãi phải nhỏ hơn 5MB", 413);
    const form = await request.formData();
    const storeId = form.get("storeId");
    const actor = await requireAiActor(request, "promotion.decide", typeof storeId === "string" ? storeId : null);
    const file = form.get("file");
    if (!(file instanceof File) || !types[file.type] || file.size > 5 * 1024 * 1024 || file.size === 0)
      throw new AiError("Chỉ nhận JPEG, PNG hoặc WebP dưới 5MB", 400);
    const path = `promotions/${actor.storeId}/${randomUUID()}.${types[file.type]}`;
    const client = aiDb();
    const { error } = await client.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new AiError("Không tải được ảnh khuyến mãi lên Storage", 503);
    const { data } = client.storage.from(BUCKET).getPublicUrl(path);
    return Response.json({ imageUrl: data.publicUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return aiErrorResponse(error); }
}
