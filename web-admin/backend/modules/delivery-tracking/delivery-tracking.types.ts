export type DeliveryStatus = "assigned" | "picked_up" | "delivering" | "delivered";

export type DeliveryTrackingRow = {
  delivery_id: string;
  order_id: string;
  employee_id: string | null;
  shipper_name: string | null;
  shipper_phone: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  order_date: string | null;
  delivery_address: string;
  total_amount: number;
  status: DeliveryStatus;
  note: string | null;
  pickup_time: string | null;
  delivery_time: string | null;
};

export type DeliveryTrackingDetailRow = DeliveryTrackingRow;

export type DeliveryTrackingFilterInput = {
  status?: DeliveryStatus;
  fromDate?: string;
  toDate?: string;
  employeeId?: string;
  search?: string;
};

export type UpdateDeliveryStatusInput = {
  orderId: string;
  status: DeliveryStatus;
  employeeId?: string;
  note?: string;
};

export type AssignShipperInput = {
  orderId: string;
  employeeId: string;
  note?: string;
};

export type DeliveryShipperOption = {
  user_id: string;
  name: string;
  phone: string | null;
  role_name: string | null;
  status: string | null;
};