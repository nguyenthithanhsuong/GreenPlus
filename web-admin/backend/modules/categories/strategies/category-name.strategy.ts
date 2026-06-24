import { AppError } from "../../../core/errors";

export interface CategoryNameStrategy {
  normalize(value: string): string;
  display(value: string): string;
}

export class DefaultCategoryNameStrategy implements CategoryNameStrategy {
  normalize(value: string): string {
    const normalized = value.trim();

    if (!normalized) {
      throw new AppError("category name is required", 400);
    }

    if (normalized.length > 100) {
      throw new AppError("category name must be at most 100 characters", 400);
    }

    return normalized;
  }

  display(value: string): string {
    return value.trim();
  }
}