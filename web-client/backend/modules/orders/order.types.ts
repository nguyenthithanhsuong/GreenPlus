export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "delivering"
  | "completed"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "unknown";

export type PaymentMethod = "cod" | "momo" | "vnpay" | "bank_transfer";

export type ShippingStatus = "assigned" | "picked_up" | "delivering" | "delivered" | "unknown";

export type OrderSummary = {
  order_id: string;
  order_date: string;
  status: OrderStatus;
  status_label: "Pending" | "Confirmed" | "Processing" | "Shipping" | "Delivered" | "Cancelled";
  total_amount: number;
  delivery_address: string;
  delivery_fee: number;
  note: string | null;
  created_at: string;
  preview_images: string[];
};

export type OrderTrackingEntry = {
  tracking_id: string;
  status: string;
  note: string | null;
  created_at: string;
};

export type OrderItemDetail = {
  order_item_id: string;
  product_id: string;
  batch_id: string;
  quantity: number;
  price: number;
  product_name: string | null;
  product_image_url: string | null;
};

export type OrderDetail = {
  order_id: string;
  user_id: string;
  order_date: string;
  order_status: OrderStatus;
  order_status_label: "Pending" | "Confirmed" | "Processing" | "Shipping" | "Delivered" | "Cancelled";
  shipping_status: ShippingStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | "unknown";
  tracking_history: OrderTrackingEntry[];
  items: OrderItemDetail[];
  total_amount: number;
  delivery_address: string;
  delivery_fee: number;
  note: string | null;
};

export type CreateOrderInput = {
  userId: string;
  deliveryAddress: string;
  deliveryFee?: number;
  note?: string;
  paymentMethod?: PaymentMethod;
};

export type CancelOrderInput = {
  userId: string;
  orderId: string;
  note?: string;
};

export type ConfirmPaymentInput = {
  userId: string;
  orderId: string;
};

export type UpdateOrderInput = {
  userId: string;
  orderId: string;
  deliveryAddress?: string;
  deliveryFee?: number;
  note?: string;
};

export type OrderChangedEvent = {
  orderId: string;
  event: "created" | "updated" | "cancelled";
  changedAt: string;
};
