import { AppError } from "./errors";
import { supabaseServer } from "./supabase";

export type StoreContext = {
  storeId: string;
  userId?: string;
  role?: string;
  source: "request" | "legacy-single-store";
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateStoreId(value: string): string {
  const storeId = value.trim();
  if (!UUID_PATTERN.test(storeId)) {
    throw new AppError("storeId must be a valid UUID", 400);
  }
  return storeId;
}

/**
 * During the one-store transition, preserve legacy behavior only while the
 * database still has exactly one active store. A caller must select a store
 * explicitly as soon as more than one active store exists.
 */
export async function resolveStoreContext(
  requestedStoreId?: string | null,
  identity?: { userId: string },
): Promise<StoreContext> {
  if (requestedStoreId?.trim()) {
    const storeId = validateStoreId(requestedStoreId);
    const { data, error } = await supabaseServer
      .from("stores")
      .select("store_id")
      .eq("store_id", storeId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      throw new AppError(error.message, 500);
    }
    if (!data) {
      throw new AppError("Store not found or inactive", 404);
    }

    return {
      storeId,
      userId: identity?.userId,
      source: "request",
    };
  }

  const { data, error } = await supabaseServer
    .from("stores")
    .select("store_id")
    .eq("status", "active");

  if (error) {
    throw new AppError(error.message, 500);
  }
  if (data?.length !== 1) {
    throw new AppError(
      "storeId is required when more than one active store exists",
      400,
    );
  }

  return {
    storeId: String(data[0].store_id),
    userId: identity?.userId,
    source: "legacy-single-store",
  };
}
