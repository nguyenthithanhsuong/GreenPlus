import { AppError } from "../../../core/errors";
import { BatchStatus } from "../batch-management.types";
import { createBatchStatusState } from "../states/batch-status.state";

export interface BatchStatusStrategy {
  normalize(value?: string | null): BatchStatus;
  derive(input: { quantity: number; expireDate: string }): BatchStatus;
  transition(current: BatchStatus, next: BatchStatus): BatchStatus;
}

const toMidnight = (value: string): number => new Date(`${value}T00:00:00`).getTime();

const todayAtMidnight = (): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
};

export class DefaultBatchStatusStrategy implements BatchStatusStrategy {
  normalize(value?: string | null): BatchStatus {
    const normalized = (value ?? "available").trim().toLowerCase();

    if (normalized === "pending" || normalized === "available" || normalized === "expired" || normalized === "sold_out") {
      return normalized;
    }

    throw new AppError(`Unsupported batch status: ${value}`, 400);
  }

  derive(input: { quantity: number; expireDate: string }): BatchStatus {
    if (input.quantity <= 0) {
      return "sold_out";
    }

    if (toMidnight(input.expireDate) < todayAtMidnight()) {
      return "expired";
    }

    return "available";
  }

  transition(current: BatchStatus, next: BatchStatus): BatchStatus {
    const state = createBatchStatusState(current);

    if (!state.canTransitionTo(next)) {
      throw new AppError(`Cannot transition batch status from ${current} to ${next}`, 400);
    }

    return next;
  }
}