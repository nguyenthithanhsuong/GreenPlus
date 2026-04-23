import { AppError } from "../../../core/errors";
import { InventoryTransactionType } from "../inventory-management.types";

export interface InventoryTransactionStrategy {
  normalize(type?: string | null): InventoryTransactionType;
  derive(previousQuantity: number, nextQuantity: number): InventoryTransactionType;
}

export class DefaultInventoryTransactionStrategy implements InventoryTransactionStrategy {
  normalize(type?: string | null): InventoryTransactionType {
    if (!type) {
      return "adjustment";
    }

    const normalized = type.trim().toLowerCase();
    if (normalized === "stock_in" || normalized === "stock_out" || normalized === "adjustment") {
      return normalized;
    }

    throw new AppError(`Unsupported inventory transaction type: ${type}`, 400);
  }

  derive(previousQuantity: number, nextQuantity: number): InventoryTransactionType {
    if (nextQuantity > previousQuantity) {
      return "stock_in";
    }

    if (nextQuantity < previousQuantity) {
      return "stock_out";
    }

    return "adjustment";
  }
}