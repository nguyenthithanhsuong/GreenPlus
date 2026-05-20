import { AppError } from "../../../core/errors";
import { InventoryTransactionType } from "../inventory-management.types";

export interface InventoryTransactionStrategy {
  normalize(
    type?: string | null
  ): InventoryTransactionType;

  derive(
    previousQuantity: number,
    nextQuantity: number
  ): InventoryTransactionType;
}

export class DefaultInventoryTransactionStrategy
  implements InventoryTransactionStrategy
{
  private readonly supportedTypes: InventoryTransactionType[] =
    ["stock_in", "stock_out", "adjust_in", "adjust_out", "adjustment"];

  normalize(
    type?: string | null
  ): InventoryTransactionType {
    if (!type) {
      return "adjustment";
    }

    const normalized = type.trim().toLowerCase();

    if (
      this.supportedTypes.includes(
        normalized as InventoryTransactionType
      )
    ) {
      return normalized as InventoryTransactionType;
    }

    throw new AppError(
      `Unsupported inventory transaction type: ${type}`,
      400
    );
  }

  derive(
    previousQuantity: number,
    nextQuantity: number
  ): InventoryTransactionType {
    if (
      previousQuantity < 0 ||
      nextQuantity < 0
    ) {
      throw new AppError(
        "Inventory quantities cannot be negative",
        400
      );
    }

    if (nextQuantity > previousQuantity) {
      return "adjust_in";
    }

    if (nextQuantity < previousQuantity) {
      return "adjust_out";
    }

    return "adjustment";
  }
}