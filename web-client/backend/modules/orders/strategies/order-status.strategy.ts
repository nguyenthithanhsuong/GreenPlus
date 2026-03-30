import { OrderStatus } from "../order.types";

export interface OrderStatusStrategy {
  toLabel(status: OrderStatus): "Pending" | "Confirmed" | "Processing" | "Shipping" | "Delivered" | "Cancelled";
}

class DefaultOrderStatusStrategy implements OrderStatusStrategy {
  toLabel(status: OrderStatus): "Pending" | "Confirmed" | "Processing" | "Shipping" | "Delivered" | "Cancelled" {
    switch (status) {
      case "pending":
        return "Pending";
      case "confirmed":
        return "Confirmed";
      case "preparing":
        return "Processing";
      case "delivering":
        return "Shipping";
      case "completed":
        return "Delivered";
      case "cancelled":
      default:
        return "Cancelled";
    }
  }
}

export function createOrderStatusStrategy(): OrderStatusStrategy {
  return new DefaultOrderStatusStrategy();
}
