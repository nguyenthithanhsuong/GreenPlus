import { AppError } from "../../../core/errors";
import { DeliveryStatus } from "../delivery-tracking.types";

export interface DeliveryStatusState {
  readonly name: DeliveryStatus;
  canTransitionTo(next: DeliveryStatus): boolean;
}

class AssignedDeliveryState implements DeliveryStatusState {
  readonly name = "assigned" as const;
  canTransitionTo(next: DeliveryStatus): boolean {
    return next === "picked_up" || next === "delivering";
  }
}

class PickedUpDeliveryState implements DeliveryStatusState {
  readonly name = "picked_up" as const;
  canTransitionTo(next: DeliveryStatus): boolean {
    return next === "delivering" || next === "delivered";
  }
}

class DeliveringDeliveryState implements DeliveryStatusState {
  readonly name = "delivering" as const;
  canTransitionTo(next: DeliveryStatus): boolean {
    return next === "delivered";
  }
}

class DeliveredDeliveryState implements DeliveryStatusState {
  readonly name = "delivered" as const;
  canTransitionTo(): boolean {
    return false;
  }
}

export function createDeliveryStatusState(status: DeliveryStatus): DeliveryStatusState {
  switch (status) {
    case "assigned":
      return new AssignedDeliveryState();
    case "picked_up":
      return new PickedUpDeliveryState();
    case "delivering":
      return new DeliveringDeliveryState();
    case "delivered":
      return new DeliveredDeliveryState();
    default:
      throw new AppError("Invalid delivery status", 400);
  }
}