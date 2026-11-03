import { isSellableBatch } from "../products/product-stock";
import { supabaseServer } from "../../core/supabase";

type RelObj = Record<string, unknown> | Record<string, unknown>[] | null;

export type CartRow = {
  cart_id: string;
  user_id: string;
  store_id: string;
};

export type CartItemWithProductRow = {
  cart_item_id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  note: string | null;
  products: RelObj;
};

export type CartItemRow = {
  cart_item_id: string;
  quantity: number;
};

export class CartRepository {
  async findCartByUserId(
    userId: string,
    storeId: string,
  ): Promise<CartRow | null> {
    const { data, error } = await supabaseServer
      .from("carts")
      .select("cart_id,user_id,store_id")
      .eq("user_id", userId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as CartRow | null) ?? null;
  }

  async createCart(userId: string, storeId: string): Promise<CartRow> {
    const { data, error } = await supabaseServer
      .from("carts")
      .insert({ user_id: userId, store_id: storeId })
      .select("cart_id,user_id,store_id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as CartRow;
  }

  async listCartItemsWithProduct(
    cartId: string,
    storeId: string,
  ): Promise<CartItemWithProductRow[]> {
    const { data, error } = await supabaseServer
      .from("cart_items")
      .select(
        "cart_item_id,cart_id,product_id,quantity,note,products(name,image_url)",
      )
      .eq("cart_id", cartId)
      .eq("store_id", storeId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as CartItemWithProductRow[];
  }

  async listLatestPriceRows(
    productIds: string[],
    storeId: string,
  ): Promise<Array<{ product_id: string; price: number }>> {
    if (productIds.length === 0) {
      return [];
    }

    const { data: batchData, error: batchError } = await supabaseServer
      .from("batches")
      .select("batch_id,product_id")
      .in("product_id", productIds)
      .eq("store_id", storeId);

    if (batchError) {
      throw new Error(batchError.message);
    }

    const batchToProductMap = new Map<string, string>();
    const batchIds = Array.from(
      new Set(
        (batchData ?? [])
          .map((row) => {
            const batchId = String(row.batch_id);
            batchToProductMap.set(batchId, String(row.product_id));
            return batchId;
          })
          .filter(Boolean),
      ),
    );

    if (batchIds.length === 0) {
      return [];
    }

    const { data, error } = await supabaseServer
      .from("prices")
      .select("batch_id,price,date")
      .in("batch_id", batchIds)
      .eq("store_id", storeId)
      .order("date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const latestRows = new Map<string, { product_id: string; price: number }>();

    (data ?? []).forEach((row) => {
      const productId = batchToProductMap.get(String(row.batch_id));
      if (!productId || latestRows.has(productId)) {
        return;
      }

      latestRows.set(productId, {
        product_id: productId,
        price: Number(row.price),
      });
    });

    return Array.from(latestRows.values());
  }

  async listBatchIdsByProduct(
    productId: string,
    storeId: string,
  ): Promise<string[]> {
    const { data, error } = await supabaseServer
      .from("batches")
      .select("batch_id,status,expire_date")
      .eq("product_id", productId)
      .eq("store_id", storeId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? [])
      .filter((row) => isSellableBatch(row.status, row.expire_date, 1))
      .map((row) => String(row.batch_id));
  }

  async listInventoryByBatchIds(
    batchIds: string[],
    storeId: string,
  ): Promise<number[]> {
    if (batchIds.length === 0) {
      return [];
    }

    const { data, error } = await supabaseServer
      .from("inventory")
      .select("quantity_available")
      .in("batch_id", batchIds)
      .eq("store_id", storeId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => Number(row.quantity_available ?? 0));
  }

  async findProductById(
    productId: string,
    storeId: string,
  ): Promise<{ product_id: string } | null> {
    const { data, error } = await supabaseServer
      .from("products")
      .select("product_id")
      .eq("product_id", productId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as { product_id: string } | null) ?? null;
  }

  async findCartItemByProduct(
    cartId: string,
    productId: string,
  ): Promise<CartItemRow | null> {
    const { data, error } = await supabaseServer
      .from("cart_items")
      .select("cart_item_id,quantity")
      .eq("cart_id", cartId)
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as CartItemRow | null) ?? null;
  }

  async findCartItemById(
    cartId: string,
    cartItemId: string,
  ): Promise<{ cart_item_id: string } | null> {
    const { data, error } = await supabaseServer
      .from("cart_items")
      .select("cart_item_id")
      .eq("cart_id", cartId)
      .eq("cart_item_id", cartItemId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as { cart_item_id: string } | null) ?? null;
  }

  async insertCartItem(input: {
    cartId: string;
    productId: string;
    quantity: number;
    storeId: string;
  }): Promise<void> {
    const { error } = await supabaseServer.from("cart_items").insert({
      cart_id: input.cartId,
      product_id: input.productId,
      quantity: input.quantity,
      store_id: input.storeId,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateCartItemQuantity(
    cartItemId: string,
    quantity: number,
  ): Promise<void> {
    const { error } = await supabaseServer
      .from("cart_items")
      .update({ quantity })
      .eq("cart_item_id", cartItemId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async deleteCartItemByProduct(
    cartId: string,
    productId: string,
  ): Promise<void> {
    const { error } = await supabaseServer
      .from("cart_items")
      .delete()
      .eq("cart_id", cartId)
      .eq("product_id", productId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateCartItemNote(
    cartItemId: string,
    note: string | null,
  ): Promise<void> {
    const { error } = await supabaseServer
      .from("cart_items")
      .update({ note })
      .eq("cart_item_id", cartItemId);

    if (error) {
      throw new Error(error.message);
    }
  }
}
