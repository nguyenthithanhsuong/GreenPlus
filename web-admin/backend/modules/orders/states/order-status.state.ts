import { AppError } from "../../../core/errors";
import { OrderStatus } from "../order-tracking.types";

export interface OrderStatusState {
  readonly name: OrderStatus;
  canTransitionTo(next: OrderStatus): boolean;
}

class PendingOrderState implements OrderStatusState {
  readonly name = "pending" as const;
  canTransitionTo(next: OrderStatus): boolean {
    return next === "confirmed" || next === "cancelled";
  }
}

class ConfirmedOrderState implements OrderStatusState {
  readonly name = "confirmed" as const;
  canTransitionTo(next: OrderStatus): boolean {
    return next === "preparing" || next === "cancelled";
  }
}

class PreparingOrderState implements OrderStatusState {
  readonly name = "preparing" as const;
  canTransitionTo(next: OrderStatus): boolean {
    return next === "delivering" || next === "cancelled";
  }
}

class DeliveringOrderState implements OrderStatusState {
  readonly name = "delivering" as const;
  canTransitionTo(next: OrderStatus): boolean {
    return next === "completed" || next === "cancelled";
  }
}

class CompletedOrderState implements OrderStatusState {
  readonly name = "completed" as const;
  canTransitionTo(_next: OrderStatus): boolean {
    return false;
  }
}

class CancelledOrderState implements OrderStatusState {
  readonly name = "cancelled" as const;
  canTransitionTo(_next: OrderStatus): boolean {
    return false;
  }
}

export function createOrderStatusState(status: OrderStatus): OrderStatusState {
  switch (status) {
    case "pending":
      return new PendingOrderState();
    case "confirmed":
      return new ConfirmedOrderState();
    case "preparing":
      return new PreparingOrderState();
    case "delivering":
      return new DeliveringOrderState();
    case "completed":
      return new CompletedOrderState();
    case "cancelled":
      return new CancelledOrderState();
    default:
      throw new AppError("Unsupported order status", 400);
  }
}