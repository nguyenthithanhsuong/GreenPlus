import { createServiceRoleSupabaseClient } from "../../core/supabase";
import {
  OrderDetailRow,
  OrderFilterInput,
  OrderItemRow,
  OrderListRow,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "./order-tracking.types";

type UserJoin = {
  name?: string | null;
  phone?: string | null;
} | null;

type PaymentJoin =
  | {
      method?: string | null;
      status?: string | null;
    }
  | Array<{
      method?: string | null;
      status?: string | null;
    }>
  | null;

type OrderItemJoin = Array<{
  quantity?: number | null;
  order_item_id?: string;
  order_id?: string;
  product_id?: string;
  batch_id?: string;
  price?: number | string;
  products?: {
    name?: string | null;
  } | null;
}>;

type OrderDbRow = {
  order_id: string;
  user_id: string | null;
  order_date: string | null;
  status: string;
  total_amount: number | string;
  delivery_address: string;
  delivery_fee: number | string | null;
  note: string | null;
  created_at: string | null;
  users?: UserJoin;
  payments?: PaymentJoin;
  order_items?: OrderItemJoin;
};

export class OrderTrackingRepository {
  private readonly supabase = createServiceRoleSupabaseClient();

  async listOrders(filters: {
    status?: OrderStatus;
    fromDate?: string;
    toDate?: string;
  }): Promise<OrderListRow[]> {
    let query = this.supabase
      .from("orders")
      .select("order_id,user_id,order_date,status,total_amount,delivery_address,delivery_fee,note,created_at,users(name,phone),payments(method,status),order_items(quantity)")
      .order("order_date", { ascending: false, nullsFirst: false });

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.fromDate) {
      query = query.gte("order_date", `${filters.fromDate}T00:00:00.000Z`);
    }

    if (filters.toDate) {
      query = query.lte("order_date", `${filters.toDate}T23:59:59.999Z`);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as OrderDbRow[]).map((row) => this.toOrderListRow(row));
  }

  async findOrderById(orderId: string): Promise<OrderDetailRow | null> {
    const { data, error } = await this.supabase
      .from("orders")
      .select("order_id,user_id,order_date,status,total_amount,delivery_address,delivery_fee,note,created_at,users(name,phone),payments(method,status),order_items(order_item_id,order_id,product_id,batch_id,quantity,price,products(name))")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.toOrderDetailRow(data as OrderDbRow) : null;
  }

  async updateOrderStatus(input: {
    orderId: string;
    status: OrderStatus;
  }): Promise<OrderDetailRow | null> {
    const { data, error } = await this.supabase
      .from("orders")
      .update({
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", input.orderId)
      .select("order_id,user_id,order_date,status,total_amount,delivery_address,delivery_fee,note,created_at,users(name,phone),payments(method,status),order_items(order_item_id,order_id,product_id,batch_id,quantity,price,products(name))")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.toOrderDetailRow(data as OrderDbRow) : null;
  }

  async appendTracking(input: {
    orderId: string;
    status: OrderStatus;
    note?: string;
  }): Promise<void> {
    const { error } = await this.supabase
      .from("orders")
      .update({
        status: input.status,
        note: input.note?.trim() || null,
      })
      .eq("order_id", input.orderId);

    if (error) {
      throw new Error(error.message);
    }
  }

  private toOrderListRow(row: OrderDbRow): OrderListRow {
    const payment = this.pickPayment(row.payments);
    const itemCount = (row.order_items ?? []).reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);

    return {
      order_id: row.order_id,
      user_id: row.user_id,
      customer_name: row.users?.name ?? null,
      customer_phone: row.users?.phone ?? null,
      order_date: row.order_date,
      status: this.normalizeOrderStatus(row.status),
      total_amount: Number(row.total_amount),
      delivery_address: row.delivery_address,
      delivery_fee: Number(row.delivery_fee ?? 0),
      note: row.note,
      created_at: row.created_at,
      payment_method: this.normalizePaymentMethod(payment?.method),
      payment_status: this.normalizePaymentStatus(payment?.status),
      item_count: itemCount,
    };
  }

  private toOrderDetailRow(row: OrderDbRow): OrderDetailRow {
    const base = this.toOrderListRow(row);
    const items = (row.order_items ?? []).map((item) => this.toOrderItemRow(item));

    return {
      ...base,
      items,
    };
  }

  private toOrderItemRow(item: NonNullable<OrderDbRow["order_items"]>[number]): OrderItemRow {
    const price = Number(item.price ?? 0);
    const quantity = Number(item.quantity ?? 0);

    return {
      order_item_id: item.order_item_id ?? "",
      order_id: item.order_id ?? null,
      product_id: item.product_id ?? null,
      product_name: item.products?.name ?? null,
      batch_id: item.batch_id ?? null,
      quantity,
      price,
      line_total: quantity * price,
    };
  }

  private pickPayment(payment: PaymentJoin): { method?: string | null; status?: string | null } | null {
    if (!payment) {
      return null;
    }

    if (Array.isArray(payment)) {
      return payment[0] ?? null;
    }

    return payment;
  }

  private normalizeOrderStatus(value: string): OrderStatus {
    if (
      value === "pending" ||
      value === "confirmed" ||
      value === "preparing" ||
      value === "delivering" ||
      value === "completed" ||
      value === "cancelled"
    ) {
      return value;
    }

    return "pending";
  }

  private normalizePaymentMethod(value?: string | null): PaymentMethod | null {
    if (value === "cod" || value === "momo" || value === "vnpay" || value === "bank_transfer") {
      return value;
    }

    return null;
  }

  private normalizePaymentStatus(value?: string | null): PaymentStatus | null {
    if (value === "pending" || value === "paid" || value === "failed" || value === "cancelled") {
      return value;
    }

    return null;
  }
}