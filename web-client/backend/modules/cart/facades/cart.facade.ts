import { CartService } from "../cart.service";
import { CartView } from "../cart.types";

// Facade gom use case 27 + 28: cart quantity, remove, va shopping note.
export class CartFacade {
  private readonly service = new CartService();

  async getCart(userId: string): Promise<CartView> {
    return this.service.getCartByUser(userId);
  }

  async addItem(userId: string, productId: string, quantity: number): Promise<CartView> {
    return this.service.addProduct(userId, productId, quantity);
  }

  async updateItemQuantity(userId: string, productId: string, quantity: number): Promise<CartView> {
    return this.service.updateQuantity(userId, productId, quantity);
  }

  async removeItem(userId: string, productId: string): Promise<CartView> {
    return this.service.removeItem(userId, productId);
  }

  async upsertItemNote(
    userId: string,
    note: string,
    target: { productId?: string; cartItemId?: string }
  ): Promise<CartView> {
    return this.service.updateNote(userId, note, target);
  }
}

export const cartFacade = new CartFacade();
