import { aiDb, resultOrFail } from "./db";
import { AiError } from "./errors";
import { hourlyLimit } from "../../../../packages/ai-core/policy.mjs";
import type { AiActor } from "./types";

export async function consumeAiQuota(actor: AiActor, action: "chat" | "recipes" | "forecast" | "promotions" | "triage") {
  const limit = action === "chat" ? hourlyLimit(actor.role) : action === "recipes" ? 20 : 8;
  const { data, error } = await aiDb().rpc("ai_consume_quota", {
    p_store: actor.storeId, p_actor: actor.id, p_action: action, p_limit: limit,
  });
  if (!resultOrFail(data, error)) throw new AiError("Đã vượt số lượt yêu cầu trong một giờ", 429);
}
