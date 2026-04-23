import { AppError } from "../../../core/errors";
import { DeliveryStatus } from "../delivery-tracking.types";

export interface DeliveryStatusStrategy {
  normalizeStatus(value: string): DeliveryStatus;
  canTransition(current: DeliveryStatus, next: DeliveryStatus): boolean;
}

export class DefaultDeliveryStatusStrategy implements DeliveryStatusStrategy {
  normalizeStatus(value: string): DeliveryStatus {
    const normalized = value.trim().toLowerCase();

    if (
      normalized === "assigned" ||
      normalized === "picked_up" ||
      normalized === "delivering" ||
      normalized === "delivered"
    ) {
      return normalized as DeliveryStatus;
    }

    throw new AppError(`Unsupported delivery status: ${value}`, 400);
  }

  canTransition(current: DeliveryStatus, next: DeliveryStatus): boolean {
    if (current === next) {
      return false;
    }

    const validNext: Record<DeliveryStatus, DeliveryStatus[]> = {
      assigned: ["picked_up", "delivering"],
      picked_up: ["delivering", "delivered"],
      delivering: ["delivered"],
      delivered: [],
    };

    return validNext[current].includes(next);
  }
}