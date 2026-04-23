import { AppError } from "../../../core/errors";
import { DeliveryStatus } from "../delivery-tracking.types";

export interface DeliveryStatusState {
  readonly name: DeliveryStatus;
  canTransitionTo(next: DeliveryStatus): boolean;
}

class PendingDeliveryState implements DeliveryStatusState {
  readonly name = "pending" as const;
  canTransitionTo(next: DeliveryStatus): boolean {
    return next === "assigned" || next === "cancelled";
  }
}

class AssignedDeliveryState implements DeliveryStatusState {
  readonly name = "assigned" as const;
  canTransitionTo(next: DeliveryStatus): boolean {
    return next === "picked_up" || next === "delivering" || next === "cancelled" || next === "failed";
  }
}

class PickedUpDeliveryState implements DeliveryStatusState {
  readonly name = "picked_up" as const;
  canTransitionTo(next: DeliveryStatus): boolean {
    return next === "delivering" || next === "delivered" || next === "cancelled" || next === "failed";
  }
}

class DeliveringDeliveryState implements DeliveryStatusState {
  readonly name = "delivering" as const;
  canTransitionTo(next: DeliveryStatus): boolean {
    return next === "delivered" || next === "failed" || next === "cancelled";
  }
}

class DeliveredDeliveryState implements DeliveryStatusState {
  readonly name = "delivered" as const;
  canTransitionTo(): boolean {
    return false;
  }
}

class FailedDeliveryState implements DeliveryStatusState {
  readonly name = "failed" as const;
  canTransitionTo(): boolean {
    return false;
  }
}

class CancelledDeliveryState implements DeliveryStatusState {
  readonly name = "cancelled" as const;
  canTransitionTo(): boolean {
    return false;
  }
}

export function createDeliveryStatusState(status: DeliveryStatus): DeliveryStatusState {
  switch (status) {
    case "pending":
      return new PendingDeliveryState();
    case "assigned":
      return new AssignedDeliveryState();
    case "picked_up":
      return new PickedUpDeliveryState();
    case "delivering":
      return new DeliveringDeliveryState();
    case "delivered":
      return new DeliveredDeliveryState();
    case "failed":
      return new FailedDeliveryState();
    case "cancelled":
      return new CancelledDeliveryState();
    default:
      throw new AppError("Invalid delivery status", 400);
  }
}