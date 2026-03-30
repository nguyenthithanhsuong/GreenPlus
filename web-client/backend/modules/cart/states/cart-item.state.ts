export interface CartItemState {
  canApplyQuantity(quantity: number, availableStock: number): boolean;
}

class ValidCartItemState implements CartItemState {
  canApplyQuantity(quantity: number, availableStock: number): boolean {
    return quantity > 0 && quantity <= availableStock;
  }
}

class InvalidCartItemState implements CartItemState {
  canApplyQuantity(): boolean {
    return false;
  }
}

export function createCartItemState(quantity: number): CartItemState {
  if (quantity > 0) {
    return new ValidCartItemState();
  }

  return new InvalidCartItemState();
}
