import { AppError } from "../../../core/errors";

export interface InventoryState {
  readonly name: "clear" | "in_use";
  canDelete(): boolean;
}

class ClearInventoryState implements InventoryState {
  readonly name = "clear" as const;

  canDelete(): boolean {
    return true;
  }
}

class InUseInventoryState implements InventoryState {
  readonly name = "in_use" as const;

  canDelete(): boolean {
    return false;
  }
}

export function createInventoryState(quantityAvailable: number, quantityReserved: number): InventoryState {
  if (quantityAvailable < 0 || quantityReserved < 0) {
    throw new AppError("Invalid inventory quantities", 400);
  }

  if (quantityAvailable === 0 && quantityReserved === 0) {
    return new ClearInventoryState();
  }

  return new InUseInventoryState();
}