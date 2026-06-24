import { AppError } from "../../../core/errors";

export interface CategoryState {
  readonly name: "available" | "in_use";
  canDelete(): boolean;
}

class AvailableCategoryState implements CategoryState {
  readonly name = "available" as const;

  canDelete(): boolean {
    return true;
  }
}

class InUseCategoryState implements CategoryState {
  readonly name = "in_use" as const;

  canDelete(): boolean {
    return false;
  }
}

export function createCategoryState(productCount: number): CategoryState {
  if (productCount > 0) {
    return new InUseCategoryState();
  }

  if (productCount < 0) {
    throw new AppError("Invalid category product count", 400);
  }

  return new AvailableCategoryState();
}