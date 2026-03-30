import { supabaseServer } from "../../core/supabase";
import { OrderStatus } from "./order.types";

type RelObj = Record<string, unknown> | Record<string, unknown>[] | null;

export type OrderRow = {
  order_id: string;
  user_id: string;
  order_date: string;
  status: OrderStatus;
  total_amount: number;
  delivery_address: string;
  delivery_fee: number;
  note: string | null;
  created_at: string;
};

export type OrderItemRow = {
  order_item_id: string;
  order_id: string;
  product_id: string;
  batch_id: string;
  quantity: number;
  price: number;
  products: RelObj;
};

export type TrackingRow = {
  tracking_id: string;
  order_id: string;
  status: string;
  note: string | null;
  created_at: string;
};

export class OrderRepository {
  async listOrdersByUser(userId: string): Promise<OrderRow[]> {
    const { data, error } = await supabaseServer
      .from("orders")
      .select("order_id,user_id,order_date,status,total_amount,delivery_address,delivery_fee,note,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as OrderRow[];
  }

  async findOrderById(orderId: string): Promise<OrderRow | null> {
    const { data, error } = await supabaseServer
      .from("orders")
      .select("order_id,user_id,order_date,status,total_amount,delivery_address,delivery_fee,note,created_at")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as OrderRow | null) ?? null;
  }

  async listOrderItems(orderId: string): Promise<OrderItemRow[]> {
    const { data, error } = await supabaseServer
      .from("order_items")
      .select("order_item_id,order_id,product_id,batch_id,quantity,price,products(name)")
      .eq("order_id", orderId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as OrderItemRow[];
  }

  async listTracking(orderId: string): Promise<TrackingRow[]> {
    const { data, error } = await supabaseServer
      .from("order_tracking")
      .select("tracking_id,order_id,status,note,created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as TrackingRow[];
  }

  async findPaymentStatus(orderId: string): Promise<string | null> {
    const { data, error } = await supabaseServer
      .from("payments")
      .select("status")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.status) {
      return null;
    }

    return String(data.status);
  }

  async findDeliveryStatus(orderId: string): Promise<string | null> {
    const { data, error } = await supabaseServer
      .from("deliveries")
      .select("status")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.status) {
      return null;
    }

    return String(data.status);
  }

  async findCartByUserId(userId: string): Promise<{ cart_id: string; user_id: string } | null> {
    const { data, error } = await supabaseServer
      .from("carts")
      .select("cart_id,user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as { cart_id: string; user_id: string } | null) ?? null;
  }

  async listCartItems(cartId: string): Promise<Array<{ cart_item_id: string; product_id: string; quantity: number }>> {
    const { data, error } = await supabaseServer
      .from("cart_items")
      .select("cart_item_id,product_id,quantity")
      .eq("cart_id", cartId);

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Array<{ cart_item_id: string; product_id: string; quantity: number }>).map((row) => ({
      cart_item_id: String(row.cart_item_id),
      product_id: String(row.product_id),
      quantity: Number(row.quantity),
    }));
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

  async listBatchRows(productId: string): Promise<Array<{ batch_id: string; expire_date: string; status: string }>> {
    const { data, error } = await supabaseServer
      .from("batches")
      .select("batch_id,expire_date,status")
      .eq("product_id", productId)
      .order("expire_date", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Array<{ batch_id: string; expire_date: string; status: string }>).map((row) => ({
      batch_id: String(row.batch_id),
      expire_date: String(row.expire_date),
      status: String(row.status),
    }));
  }

  async getInventoryByBatchId(batchId: string): Promise<number> {
    const { data, error } = await supabaseServer
      .from("inventory")
      .select("quantity_available")
      .eq("batch_id", batchId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Number(data?.quantity_available ?? 0);
  }

  async createOrder(input: {
    userId: string;
    totalAmount: number;
    deliveryAddress: string;
    deliveryFee: number;
    note: string | null;
  }): Promise<{ order_id: string }> {
    const { data, error } = await supabaseServer
      .from("orders")
      .insert({
        user_id: input.userId,
        total_amount: input.totalAmount,
        delivery_address: input.deliveryAddress,
        delivery_fee: input.deliveryFee,
        note: input.note,
        status: "pending",
      })
      .select("order_id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { order_id: String(data.order_id) };
  }

  async insertOrderItem(input: {
    orderId: string;
    productId: string;
    batchId: string;
    quantity: number;
    price: number;
  }): Promise<void> {
    const { error } = await supabaseServer.from("order_items").insert({
      order_id: input.orderId,
      product_id: input.productId,
      batch_id: input.batchId,
      quantity: input.quantity,
      price: input.price,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async insertTracking(input: { orderId: string; status: string; note: string | null }): Promise<void> {
    const { error } = await supabaseServer.from("order_tracking").insert({
      order_id: input.orderId,
      status: input.status,
      note: input.note,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async clearCart(cartId: string): Promise<void> {
    const { error } = await supabaseServer.from("cart_items").delete().eq("cart_id", cartId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const { error } = await supabaseServer.from("orders").update({ status }).eq("order_id", orderId);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export function readRelationValue<T = string>(rel: RelObj, field: string): T | null {
  if (!rel) {
    return null;
  }

  if (Array.isArray(rel)) {
    const first = rel[0];
    if (!first) {
      return null;
    }

    return (first[field] as T) ?? null;
  }

  return (rel[field] as T) ?? null;
}
