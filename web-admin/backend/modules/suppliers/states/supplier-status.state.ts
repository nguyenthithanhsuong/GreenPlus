import { AppError } from "../../../core/errors";
import { SupplierStatus } from "../supplier-management.types";

export interface SupplierStatusState {
  readonly name: SupplierStatus;
  canTransitionTo(next: SupplierStatus): boolean;
}

class PendingSupplierState implements SupplierStatusState {
  readonly name: SupplierStatus = "pending";

  canTransitionTo(next: SupplierStatus): boolean {
    return next === "pending" || next === "approved" || next === "rejected";
  }
}

class ApprovedSupplierState implements SupplierStatusState {
  readonly name: SupplierStatus = "approved";

  canTransitionTo(next: SupplierStatus): boolean {
    return next === "approved" || next === "rejected" || next === "pending";
  }
}

class RejectedSupplierState implements SupplierStatusState {
  readonly name: SupplierStatus = "rejected";

  canTransitionTo(next: SupplierStatus): boolean {
    return next === "rejected" || next === "pending" || next === "approved";
  }
}

export function createSupplierStatusState(status: string): SupplierStatusState {
  const normalized = status.trim().toLowerCase();

  if (normalized === "pending") {
    return new PendingSupplierState();
  }

  if (normalized === "approved") {
    return new ApprovedSupplierState();
  }

  if (normalized === "rejected") {
    return new RejectedSupplierState();
  }

  throw new AppError(`Unsupported supplier status: ${status}`, 400);
}
