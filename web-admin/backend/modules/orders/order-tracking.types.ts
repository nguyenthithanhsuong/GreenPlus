export type OrderStatus = "pending" | "confirmed" | "preparing" | "delivering" | "completed" | "cancelled";

export type PaymentMethod = "cod" | "momo" | "vnpay" | "bank_transfer";
export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";

export type OrderListRow = {
  order_id: string;
  user_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  order_date: string | null;
  status: OrderStatus;
  total_amount: number;
  delivery_address: string;
  delivery_fee: number;
  note: string | null;
  created_at: string | null;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus | null;
  item_count: number;
};

export type OrderItemRow = {
  order_item_id: string;
  order_id: string | null;
  product_id: string | null;
  product_name: string | null;
  batch_id: string | null;
  quantity: number;
  price: number;
  line_total: number;
};

export type OrderDetailRow = OrderListRow & {
  items: OrderItemRow[];
};

export type OrderFilterInput = {
  status?: string;
  fromDate?: string;
  toDate?: string;
};

export type UpdateOrderStatusInput = {
  orderId: string;
  status: string;
  note?: string;
  employeeId?: string;
};