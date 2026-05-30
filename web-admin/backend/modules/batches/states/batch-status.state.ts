import { AppError } from "../../../core/errors";
import { BatchStatus } from "../batch-management.types";

export interface BatchStatusState {
  readonly name: BatchStatus;
  canTransitionTo(next: BatchStatus): boolean;
}

class PendingBatchState implements BatchStatusState {
  readonly name: BatchStatus = "pending";

  canTransitionTo(next: BatchStatus): boolean {
    return next === "pending" || next === "available" || next === "expired" || next === "sold_out";
  }
}

class AvailableBatchState implements BatchStatusState {
  readonly name: BatchStatus = "available";

  canTransitionTo(next: BatchStatus): boolean {
    return next === "available" || next === "pending" || next === "expired" || next === "sold_out";
  }
}

class ExpiredBatchState implements BatchStatusState {
  readonly name: BatchStatus = "expired";

  canTransitionTo(next: BatchStatus): boolean {
    return next === "expired" || next === "pending" || next === "sold_out" || next === "available";
  }
}

class SoldOutBatchState implements BatchStatusState {
  readonly name: BatchStatus = "sold_out";

  canTransitionTo(next: BatchStatus): boolean {
    return next === "sold_out" || next === "pending" || next === "available" || next === "expired";
  }
}

export function createBatchStatusState(status: string): BatchStatusState {
  const normalized = status.trim().toLowerCase();

  if (normalized === "pending") {
    return new PendingBatchState();
  }

  if (normalized === "available") {
    return new AvailableBatchState();
  }

  if (normalized === "expired") {
    return new ExpiredBatchState();
  }

  if (normalized === "sold_out") {
    return new SoldOutBatchState();
  }

  throw new AppError(`Unsupported batch status: ${status}`, 400);
}