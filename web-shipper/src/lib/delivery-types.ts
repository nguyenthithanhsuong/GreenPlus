export type DeliveryStatus =
  "assigned" | "picked_up" | "delivering" | "delivered";
export type Delivery = {
  order_id: string;
  delivery_id: string;
  customer_name: string;
  delivery_address: string;
  total_amount: number;
  status: DeliveryStatus;
  pickup_time: string | null;
};
