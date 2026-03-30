import { OrderStatus } from "../order.types";

export interface OrderState {
  canCancel(): boolean;
}

class PendingOrderState implements OrderState {
  canCancel(): boolean {
    return true;
  }
}

class ConfirmedOrderState implements OrderState {
  canCancel(): boolean {
    return true;
  }
}

class PreparingOrderState implements OrderState {
  canCancel(): boolean {
    return false;
  }
}

class DeliveringOrderState implements OrderState {
  canCancel(): boolean {
    return false;
  }
}

class CompletedOrderState implements OrderState {
  canCancel(): boolean {
    return false;
  }
}

class CancelledOrderState implements OrderState {
  canCancel(): boolean {
    return false;
  }
}

export function createOrderState(status: OrderStatus): OrderState {
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
    default:
      return new CancelledOrderState();
  }
}
