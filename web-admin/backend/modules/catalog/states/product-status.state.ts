import { AppError } from "../../../core/errors";
import { ProductStatus } from "../product-management.types";

export interface ProductStatusState {
  readonly name: ProductStatus;
  canTransitionTo(next: ProductStatus): boolean;
}

class ActiveProductState implements ProductStatusState {
  readonly name: ProductStatus = "active";

  canTransitionTo(next: ProductStatus): boolean {
    return next === "active" || next === "inactive";
  }
}

class InactiveProductState implements ProductStatusState {
  readonly name: ProductStatus = "inactive";

  canTransitionTo(next: ProductStatus): boolean {
    return next === "inactive" || next === "active";
  }
}

export function createProductStatusState(status: string): ProductStatusState {
  const normalized = status.trim().toLowerCase();

  if (normalized === "active") {
    return new ActiveProductState();
  }

  if (normalized === "inactive") {
    return new InactiveProductState();
  }

  throw new AppError(`Unsupported product status: ${status}`, 400);
}
