import { supabaseServer } from "../../core/supabase";

type RelObj = Record<string, unknown> | Record<string, unknown>[] | null;

export type CartRow = {
  cart_id: string;
  user_id: string;
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
  async findCartByUserId(userId: string): Promise<CartRow | null> {
    const { data, error } = await supabaseServer
      .from("carts")
      .select("cart_id,user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as CartRow | null) ?? null;
  }

  async createCart(userId: string): Promise<CartRow> {
    const { data, error } = await supabaseServer
      .from("carts")
      .insert({ user_id: userId })
      .select("cart_id,user_id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as CartRow;
  }

  async listCartItemsWithProduct(cartId: string): Promise<CartItemWithProductRow[]> {
    const { data, error } = await supabaseServer
      .from("cart_items")
      .select("cart_item_id,cart_id,product_id,quantity,note,products(name)")
      .eq("cart_id", cartId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as CartItemWithProductRow[];
  }

  async listLatestPriceRows(productIds: string[]): Promise<Array<{ product_id: string; price: number }>> {
    if (productIds.length === 0) {
      return [];
    }

    const { data, error } = await supabaseServer
      .from("prices")
      .select("product_id,price,date")
      .in("product_id", productIds)
      .order("date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Array<{ product_id: string; price: number }>).map((row) => ({
      product_id: String(row.product_id),
      price: Number(row.price),
    }));
  }

  async listBatchIdsByProduct(productId: string): Promise<string[]> {
    const { data, error } = await supabaseServer.from("batches").select("batch_id").eq("product_id", productId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => String(row.batch_id));
  }

  async listInventoryByBatchIds(batchIds: string[]): Promise<number[]> {
    if (batchIds.length === 0) {
      return [];
    }

    const { data, error } = await supabaseServer
      .from("inventory")
      .select("quantity_available")
      .in("batch_id", batchIds);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => Number(row.quantity_available ?? 0));
  }

  async findProductById(productId: string): Promise<{ product_id: string } | null> {
    const { data, error } = await supabaseServer
      .from("products")
      .select("product_id")
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as { product_id: string } | null) ?? null;
  }

  async findCartItemByProduct(cartId: string, productId: string): Promise<CartItemRow | null> {
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

  async findCartItemById(cartId: string, cartItemId: string): Promise<{ cart_item_id: string } | null> {
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

  async insertCartItem(input: { cartId: string; productId: string; quantity: number }): Promise<void> {
    const { error } = await supabaseServer.from("cart_items").insert({
      cart_id: input.cartId,
      product_id: input.productId,
      quantity: input.quantity,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateCartItemQuantity(cartItemId: string, quantity: number): Promise<void> {
    const { error } = await supabaseServer
      .from("cart_items")
      .update({ quantity })
      .eq("cart_item_id", cartItemId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async deleteCartItemByProduct(cartId: string, productId: string): Promise<void> {
    const { error } = await supabaseServer
      .from("cart_items")
      .delete()
      .eq("cart_id", cartId)
      .eq("product_id", productId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateCartItemNote(cartItemId: string, note: string | null): Promise<void> {
    const { error } = await supabaseServer.from("cart_items").update({ note }).eq("cart_item_id", cartItemId);

    if (error) {
      throw new Error(error.message);
    }
  }
}
