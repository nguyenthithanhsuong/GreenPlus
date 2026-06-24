import { AppError } from "../../../core/errors";
import { ProductStatus } from "../product-management.types";
import { createProductStatusState } from "../states/product-status.state";

export interface ProductStatusStrategy {
  normalize(value?: string | null): ProductStatus;
  transition(current: ProductStatus, next: ProductStatus): ProductStatus;
}

export class DefaultProductStatusStrategy implements ProductStatusStrategy {
  normalize(value?: string | null): ProductStatus {
    const normalized = (value ?? "active").trim().toLowerCase();

    if (normalized === "active" || normalized === "inactive") {
      return normalized;
    }

    throw new AppError(`Unsupported product status: ${value}`, 400);
  }

  transition(current: ProductStatus, next: ProductStatus): ProductStatus {
    const state = createProductStatusState(current);

    if (!state.canTransitionTo(next)) {
      throw new AppError(`Cannot transition product status from ${current} to ${next}`, 400);
    }

    return next;
  }
}
