import { requireCustomerAi } from "../../../../../backend/modules/ai-assist/actor";
import { getSupabaseServer } from "../../../../../backend/core/supabase";
import { callAiService } from "../../../../../../packages/ai-core/ai-client.mjs";
import { apiFailure, requireJsonOrigin, readBoundedJson } from "../../../../../../packages/ai-core/response.mjs";
import { safeText } from "../../../../../../packages/ai-core/policy.mjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    requireJsonOrigin(request);
    const input = (await readBoundedJson(request)) as {
      storeId?: string;
      ingredients?: string[];
      servings?: number;
      useCart?: boolean;
      restrictions?: string[];
    };
    const actor = await requireCustomerAi(request, "recipes", input.storeId);
    const db = getSupabaseServer();
    const quota = await db.rpc("ai_consume_quota", {
      p_store: actor.storeId,
      p_actor: actor.userId,
      p_action: "recipes",
      p_limit: 20,
    });
    if (quota.error)
      throw Object.assign(new Error("Không truy cập được hạn mức AI"), {
        status: 503,
      });
    if (!quota.data)
      throw Object.assign(new Error("Đã hết lượt yêu cầu"), { status: 429 });
    let ingredients = (Array.isArray(input.ingredients) ? input.ingredients : [])
      .map((name) => safeText(name, 100))
      .filter((name): name is string => Boolean(name));
    if (input.useCart) {
      const cart = await db
        .from("carts")
        .select("cart_id")
        .eq("store_id", actor.storeId)
        .eq("user_id", actor.userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cart.error)
        throw Object.assign(new Error("Không lấy được giỏ hàng"), {
          status: 503,
        });
      if (cart.data) {
        const items = await db
          .from("cart_items")
          .select("product_id")
          .eq("store_id", actor.storeId)
          .eq("cart_id", cart.data.cart_id)
          .limit(50);
        if (items.error)
          throw Object.assign(new Error("Không lấy được nguyên liệu"), {
            status: 503,
          });
        const ids = [
          ...new Set((items.data ?? []).map((row) => row.product_id).filter(Boolean)),
        ];
        if (ids.length) {
          const products = await db
            .from("products")
            .select("name")
            .eq("store_id", actor.storeId)
            .in("product_id", ids);
          if (products.error)
            throw Object.assign(new Error("Không lấy được sản phẩm"), {
              status: 503,
            });
          ingredients = [
            ...new Set([
              ...ingredients,
              ...(products.data ?? []).map((row) => row.name),
            ]),
          ];
        }
      }
    }
    const servings = Number(input.servings);
    if (!ingredients.length || ingredients.length > 25 || !Number.isInteger(servings) || servings < 1 || servings > 12)
      throw Object.assign(new Error("Chọn nguyên liệu và số khẩu phần hợp lệ"), {
        status: 400,
      });
    const restrictions = (Array.isArray(input.restrictions)
      ? input.restrictions
      : []
    )
      .slice(0, 10)
      .map((item) => safeText(item, 100))
      .filter((name): name is string => Boolean(name));
    return Response.json(
      await callAiService("recipes", {
        store_id: actor.storeId,
        ingredients,
        servings,
        restrictions,
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiFailure(error);
  }
}
