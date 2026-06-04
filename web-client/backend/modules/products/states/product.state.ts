import { ProductStatus } from "../product.types";

export interface ProductState {
  canView(): boolean;
}

export class ActiveProductState implements ProductState {
  canView(): boolean {
    return true;
  }
}

export class InactiveProductState implements ProductState {
  canView(): boolean {
    return false;
  }
}

export function createProductState(status: ProductStatus): ProductState {
  if (status === "active") {
    return new ActiveProductState();
  }

  return new InactiveProductState();
}