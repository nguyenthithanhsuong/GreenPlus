import { AppError } from "../../../core/errors";

export interface PriceState {
  readonly name: "future" | "effective";
  canDelete(): boolean;
}

class FuturePriceState implements PriceState {
  readonly name = "future" as const;

  canDelete(): boolean {
    return true;
  }
}

class EffectivePriceState implements PriceState {
  readonly name = "effective" as const;

  canDelete(): boolean {
    return false;
  }
}

export function createPriceState(dateValue: string): PriceState {
  const timestamp = Date.parse(`${dateValue}T00:00:00Z`);
  if (Number.isNaN(timestamp)) {
    throw new AppError("Invalid price date", 400);
  }

  const target = new Date(timestamp);
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  if (target.getTime() > todayUtc.getTime()) {
    return new FuturePriceState();
  }

  return new EffectivePriceState();
}