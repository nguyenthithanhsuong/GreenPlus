import { AppError } from "../../../core/errors";

export interface PriceValidationStrategy {
  normalizePrice(value: number): number;
  normalizeDate(value: string): string;
}

export class DefaultPriceValidationStrategy implements PriceValidationStrategy {
  normalizePrice(value: number): number {
    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new AppError("price must be a valid number", 400);
    }

    if (value < 0) {
      throw new AppError("price must be greater than or equal to 0", 400);
    }

    return Number(value.toFixed(2));
  }

  normalizeDate(value: string): string {
    const normalized = value.trim();
    if (!normalized) {
      throw new AppError("date is required", 400);
    }

    const timestamp = Date.parse(`${normalized}T00:00:00Z`);
    if (Number.isNaN(timestamp)) {
      throw new AppError("date must be a valid ISO date (YYYY-MM-DD)", 400);
    }

    return new Date(timestamp).toISOString().slice(0, 10);
  }
}