import { supabaseServer } from "../../core/supabase";
import { OrderStatus, PaymentMethod } from "./order.types";

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

export type OrderItemImageRow = {
  order_id: string;
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
      .select("order_item_id,order_id,product_id,batch_id,quantity,price,products(name,image_url)")
      .eq("order_id", orderId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as OrderItemRow[];
  }

  async listOrderItemImages(orderIds: string[]): Promise<OrderItemImageRow[]> {
    if (orderIds.length === 0) {
      return [];
    }

    const { data, error } = await supabaseServer
      .from("order_items")
      .select("order_id,products(image_url)")
      .in("order_id", orderIds);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as OrderItemImageRow[];
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

  async findPaymentInfo(orderId: string): Promise<{ status: string | null; method: string | null }> {
    const { data, error } = await supabaseServer
      .from("payments")
      .select("status,method")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return {
      status: data?.status ? String(data.status) : null,
      method: data?.method ? String(data.method) : null,
    };
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

    const { data: batchData, error: batchError } = await supabaseServer
      .from("batches")
      .select("batch_id,product_id")
      .in("product_id", productIds);

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

  async insertPayment(input: {
    orderId: string;
    method: PaymentMethod;
    status: "pending" | "paid" | "failed" | "cancelled";
    amount: number;
    transactionId?: string | null;
    paymentDate?: string | null;
  }): Promise<void> {
    const { error } = await supabaseServer.from("payments").insert({
      order_id: input.orderId,
      method: input.method,
      status: input.status,
      amount: input.amount,
      transaction_id: input.transactionId ?? null,
      payment_date: input.paymentDate ?? null,
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

  async updatePaymentStatus(input: {
    orderId: string;
    status: "pending" | "paid" | "failed" | "cancelled";
    transactionId?: string | null;
    paymentDate?: string | null;
  }): Promise<void> {
    const payload: Record<string, unknown> = {
      status: input.status,
    };

    if (typeof input.transactionId !== "undefined") {
      payload.transaction_id = input.transactionId;
    }

    if (typeof input.paymentDate !== "undefined") {
      payload.payment_date = input.paymentDate;
    }

    const { error } = await supabaseServer.from("payments").update(payload).eq("order_id", input.orderId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateOrderFields(input: {
    orderId: string;
    deliveryAddress?: string;
    deliveryFee?: number;
    note?: string | null;
  }): Promise<void> {
    const payload: Record<string, unknown> = {};

    if (typeof input.deliveryAddress === "string") {
      payload.delivery_address = input.deliveryAddress;
    }

    if (typeof input.deliveryFee === "number") {
      payload.delivery_fee = input.deliveryFee;
    }

    if (typeof input.note !== "undefined") {
      payload.note = input.note;
    }

    const { error } = await supabaseServer.from("orders").update(payload).eq("order_id", input.orderId);

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
