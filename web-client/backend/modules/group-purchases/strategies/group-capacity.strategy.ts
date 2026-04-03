import { AppError } from "../../../core/errors";

export interface GroupCapacityStrategy {
  ensureCanJoin(currentQuantity: number, targetQuantity: number, requestedQuantity: number): void;
}

class DefaultGroupCapacityStrategy implements GroupCapacityStrategy {
  ensureCanJoin(currentQuantity: number, targetQuantity: number, requestedQuantity: number): void {
    if (requestedQuantity <= 0) {
      throw new AppError("quantity must be greater than 0", 400);
    }

    if (currentQuantity >= targetQuantity) {
      throw new AppError("Group is full", 400);
    }

    if (currentQuantity + requestedQuantity > targetQuantity) {
      throw new AppError("Requested quantity exceeds remaining group capacity", 400);
    }
  }
}

export function createGroupCapacityStrategy(): GroupCapacityStrategy {
  return new DefaultGroupCapacityStrategy();
}
