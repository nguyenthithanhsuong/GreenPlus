import { AppError } from "../../../core/errors";
import { SupplierStatus } from "../supplier-management.types";
import { createSupplierStatusState } from "../states/supplier-status.state";

export interface SupplierStatusStrategy {
  normalize(input?: string | null): SupplierStatus;
  transition(current: SupplierStatus, next: SupplierStatus): SupplierStatus;
}

export class DefaultSupplierStatusStrategy implements SupplierStatusStrategy {
  normalize(input?: string | null): SupplierStatus {
    if (!input) {
      return "pending";
    }

    const normalized = input.trim().toLowerCase();
    if (normalized === "pending" || normalized === "approved" || normalized === "rejected") {
      return normalized;
    }

    throw new AppError(`Unsupported supplier status: ${input}`, 400);
  }

  transition(current: SupplierStatus, next: SupplierStatus): SupplierStatus {
    const state = createSupplierStatusState(current);

    if (!state.canTransitionTo(next)) {
      throw new AppError(`Cannot transition supplier status from ${current} to ${next}`, 400);
    }

    return next;
  }
}
