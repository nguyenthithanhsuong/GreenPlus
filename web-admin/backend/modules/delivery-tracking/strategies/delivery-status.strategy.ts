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
      normalized === "pending" ||
      normalized === "assigned" ||
      normalized === "picked_up" ||
      normalized === "delivering" ||
      normalized === "delivered" ||
      normalized === "failed" ||
      normalized === "cancelled"
    ) {
      return normalized;
    }

    throw new AppError(`Unsupported delivery status: ${value}`, 400);
  }

  canTransition(current: DeliveryStatus, next: DeliveryStatus): boolean {
    if (current === next) {
      return false;
    }

    if (current === "delivered" || current === "cancelled") {
      return false;
    }

    if (next === "cancelled" || next === "failed") {
      return true;
    }

    const validNext: Record<DeliveryStatus, DeliveryStatus[]> = {
      pending: ["assigned", "cancelled"],
      assigned: ["picked_up", "delivering", "cancelled", "failed"],
      picked_up: ["delivering", "delivered", "cancelled", "failed"],
      delivering: ["delivered", "failed", "cancelled"],
      delivered: [],
      failed: [],
      cancelled: [],
    };

    return validNext[current].includes(next);
  }
}