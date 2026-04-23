import { AppError } from "../../../core/errors";
import { OrderStatus } from "../order-tracking.types";
import { createOrderStatusState } from "../states/order-status.state";

export interface OrderStatusStrategy {
  normalizeStatus(value: string): OrderStatus;
  canTransition(current: OrderStatus, next: OrderStatus): boolean;
}

export class DefaultOrderStatusStrategy implements OrderStatusStrategy {
  normalizeStatus(value: string): OrderStatus {
    const normalized = value.trim().toLowerCase();
    if (
      normalized === "pending" ||
      normalized === "confirmed" ||
      normalized === "preparing" ||
      normalized === "delivering" ||
      normalized === "completed" ||
      normalized === "cancelled"
    ) {
      return normalized;
    }

    throw new AppError(`Unsupported order status: ${value}`, 400);
  }

  canTransition(current: OrderStatus, next: OrderStatus): boolean {
    if (current === next) {
      return false;
    }

    const state = createOrderStatusState(current);
    return state.canTransitionTo(next);
  }
}