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
  store_id: string;
};

export type OrderItemRow = {
  order_item_id: string;
  order_id: string;
  product_id: string;
  batch_id: string;
  quantity: number;
  price: number;
  products: RelObj;
  note: string | null;
};

export type OrderItemImageRow = {
  order_id: string;
  products: RelObj;
};

export type PaymentHistoryRow = {
  payment_id: string;
  order_id: string;
  order_date: string;
  order_status: OrderStatus;
  method: PaymentMethod;
  status: string;
  amount: number;
  transaction_id: string | null;
  payment_date: string | null;
};

export class OrderRepository {
  async checkoutCart(input: {
    userId: string;
    storeId: string;
    idempotencyKey: string;
    deliveryAddress: string;
    deliveryFee: number;
    note: string | null;
    paymentMethod: PaymentMethod;
  }): Promise<{ order_id: string; status: "pending"; total_amount: number }> {
    const { data, error } = await supabaseServer.rpc("checkout_cart", {
      p_user_id: input.userId,
      p_store_id: input.storeId,
      p_idempotency_key: input.idempotencyKey,
      p_delivery_address: input.deliveryAddress,
      p_delivery_fee: input.deliveryFee,
      p_note: input.note,
      p_payment_method: input.paymentMethod,
    });

    if (error) {
      throw new Error(error.message);
    }

    const result = data as {
      order_id?: string;
      status?: "pending";
      total_amount?: number;
    } | null;
    if (!result?.order_id || result.status !== "pending") {
      throw new Error("Checkout RPC returned an invalid result");
    }
    return {
      order_id: result.order_id,
      status: "pending",
      total_amount: Number(result.total_amount ?? 0),
    };
  }

  async listOrdersByUser(userId: string, storeId: string): Promise<OrderRow[]> {
    const { data, error } = await supabaseServer
      .from("orders")
      .select(
        "order_id,user_id,store_id,order_date,status,total_amount,delivery_address,delivery_fee,note,created_at",
      )
      .eq("user_id", userId)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as OrderRow[];
  }

  async listPaymentHistoryByUser(
    userId: string,
    storeId: string,
  ): Promise<PaymentHistoryRow[]> {
    const { data: orders, error: ordersError } = await supabaseServer
      .from("orders")
      .select("order_id,order_date,status")
      .eq("user_id", userId)
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (ordersError) {
      throw new Error(ordersError.message);
    }

    const orderRows = (orders ?? []) as Array<{
      order_id: string;
      order_date: string;
      status: OrderStatus;
    }>;
    if (orderRows.length === 0) {
      return [];
    }

    const orderMap = new Map<
      string,
      { order_date: string; order_status: OrderStatus }
    >();
    const orderIds: string[] = [];
    orderRows.forEach((row) => {
      const orderId = String(row.order_id);
      orderIds.push(orderId);
      orderMap.set(orderId, {
        order_date: String(row.order_date),
        order_status: row.status,
      });
    });

    const { data: payments, error: paymentsError } = await supabaseServer
      .from("payments")
      .select(
        "payment_id,order_id,method,status,amount,transaction_id,payment_date",
      )
      .in("order_id", orderIds)
      .order("payment_date", { ascending: false, nullsFirst: false });

    if (paymentsError) {
      throw new Error(paymentsError.message);
    }

    return ((payments ?? []) as PaymentHistoryRow[]).map((row) => {
      const orderInfo = orderMap.get(String(row.order_id));
      return {
        payment_id: String(row.payment_id),
        order_id: String(row.order_id),
        order_date: orderInfo?.order_date ?? String(row.payment_date ?? ""),
        order_status: orderInfo?.order_status ?? "pending",
        method: row.method,
        status: row.status,
        amount: Number(row.amount),
        transaction_id: row.transaction_id,
        payment_date: row.payment_date,
      };
    });
  }

  async findOrderById(
    orderId: string,
    storeId: string,
  ): Promise<OrderRow | null> {
    const { data, error } = await supabaseServer
      .from("orders")
      .select(
        "order_id,user_id,store_id,order_date,status,total_amount,delivery_address,delivery_fee,note,created_at",
      )
      .eq("order_id", orderId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as OrderRow | null) ?? null;
  }

  async listOrderItems(
    orderId: string,
    storeId: string,
  ): Promise<OrderItemRow[]> {
    const { data, error } = await supabaseServer
      .from("order_items")
      .select(
        "order_item_id,order_id,store_id,product_id,batch_id,quantity,price,products(name,image_url),note",
      )
      .eq("order_id", orderId)
      .eq("store_id", storeId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as OrderItemRow[];
  }

  async listOrderItemImages(
    orderIds: string[],
    storeId: string,
  ): Promise<OrderItemImageRow[]> {
    if (orderIds.length === 0) {
      return [];
    }

    const { data, error } = await supabaseServer
      .from("order_items")
      .select("order_id,products(image_url)")
      .in("order_id", orderIds)
      .eq("store_id", storeId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as OrderItemImageRow[];
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

  async findPaymentInfo(
    orderId: string,
    storeId: string,
  ): Promise<{ status: string | null; method: string | null }> {
    const { data, error } = await supabaseServer
      .from("payments")
      .select("status,method")
      .eq("order_id", orderId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return {
      status: data?.status ? String(data.status) : null,
      method: data?.method ? String(data.method) : null,
    };
  }

  async findDeliveryStatus(
    orderId: string,
    storeId: string,
  ): Promise<string | null> {
    const { data, error } = await supabaseServer
      .from("deliveries")
      .select("status")
      .eq("order_id", orderId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.status) {
      return null;
    }

    return String(data.status);
  }

  async findCartByUserId(
    userId: string,
    storeId: string,
  ): Promise<{ cart_id: string; user_id: string; store_id: string } | null> {
    const { data, error } = await supabaseServer
      .from("carts")
      .select("cart_id,user_id,store_id")
      .eq("user_id", userId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (
      (data as { cart_id: string; user_id: string; store_id: string } | null) ??
      null
    );
  }

  async listCartItems(
    cartId: string,
    storeId: string,
  ): Promise<
    Array<{
      cart_item_id: string;
      product_id: string;
      quantity: number;
      note: string | null;
    }>
  > {
    const { data, error } = await supabaseServer
      .from("cart_items")
      .select("cart_item_id,product_id,quantity,note")
      .eq("cart_id", cartId)
      .eq("store_id", storeId);

    if (error) {
      throw new Error(error.message);
    }

    return (
      (data ?? []) as Array<{
        cart_item_id: string;
        product_id: string;
        quantity: number;
        note: string | null;
      }>
    ).map((row) => ({
      cart_item_id: String(row.cart_item_id),
      product_id: String(row.product_id),
      quantity: Number(row.quantity),
      note: row.note ?? null,
    }));
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

  async listBatchRows(
    productId: string,
    storeId: string,
  ): Promise<Array<{ batch_id: string; expire_date: string; status: string }>> {
    const { data, error } = await supabaseServer
      .from("batches")
      .select("batch_id,expire_date,status")
      .eq("product_id", productId)
      .eq("store_id", storeId)
      .order("expire_date", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (
      (data ?? []) as Array<{
        batch_id: string;
        expire_date: string;
        status: string;
      }>
    ).map((row) => ({
      batch_id: String(row.batch_id),
      expire_date: String(row.expire_date),
      status: String(row.status),
    }));
  }

  async getInventoryByBatchId(
    batchId: string,
    storeId: string,
  ): Promise<number> {
    const { data, error } = await supabaseServer
      .from("inventory")
      .select("quantity_available")
      .eq("batch_id", batchId)
      .eq("store_id", storeId)
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
    note: string | null | undefined;
  }): Promise<void> {
    const { error } = await supabaseServer.from("order_items").insert({
      order_id: input.orderId,
      product_id: input.productId,
      batch_id: input.batchId,
      quantity: input.quantity,
      price: input.price,
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
    const { error } = await supabaseServer
      .from("cart_items")
      .delete()
      .eq("cart_id", cartId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateOrderStatus(
    orderId: string,
    storeId: string,
    status: OrderStatus,
  ): Promise<void> {
    const { error } = await supabaseServer
      .from("orders")
      .update({ status })
      .eq("order_id", orderId)
      .eq("store_id", storeId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async updatePaymentStatus(input: {
    orderId: string;
    storeId: string;
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

    const { error } = await supabaseServer
      .from("payments")
      .update(payload)
      .eq("order_id", input.orderId)
      .eq("store_id", input.storeId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateOrderFields(input: {
    orderId: string;
    storeId: string;
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

    const { error } = await supabaseServer
      .from("orders")
      .update(payload)
      .eq("order_id", input.orderId)
      .eq("store_id", input.storeId);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export function readRelationValue<T = string>(
  rel: RelObj,
  field: string,
): T | null {
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
