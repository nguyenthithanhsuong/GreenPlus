export interface CategoryState {
  canDisplay(): boolean;
}

export class ValidCategoryState implements CategoryState {
  canDisplay(): boolean {
    return true;
  }
}

export class InvalidCategoryState implements CategoryState {
  canDisplay(): boolean {
    return false;
  }
}

export function createCategoryState(name: string): CategoryState {
  if (name.trim().length > 0) {
    return new ValidCategoryState();
  }

  return new InvalidCategoryState();
}
