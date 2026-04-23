export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "delivering"
  | "delivered"
  | "failed"
  | "cancelled";

export type DeliveryTrackingHistoryRow = {
  tracking_id: string;
  order_id: string | null;
  status: DeliveryStatus;
  note: string | null;
  created_at: string | null;
};

export type DeliveryTrackingRow = {
  order_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  order_date: string | null;
  delivery_address: string;
  total_amount: number;
  latest_status: DeliveryStatus;
  latest_note: string | null;
  latest_tracking_at: string | null;
  tracking_count: number;
};

export type DeliveryTrackingDetailRow = DeliveryTrackingRow & {
  history: DeliveryTrackingHistoryRow[];
};

export type DeliveryTrackingFilterInput = {
  status?: string;
  fromDate?: string;
  toDate?: string;
};

export type UpdateDeliveryStatusInput = {
  orderId: string;
  status: string;
  note?: string;
};