import { CartService } from "../cart.service";
import { CartView } from "../cart.types";

export class CartFacade {
  private readonly service = new CartService();

  async getCart(userId: string, storeId: string): Promise<CartView> {
    return this.service.getCartByUser(userId, storeId);
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
    storeId: string,
  ): Promise<CartView> {
    return this.service.addProduct(userId, productId, quantity, storeId);
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
    storeId: string,
  ): Promise<CartView> {
    return this.service.updateQuantity(userId, productId, quantity, storeId);
  }

  async removeItem(
    userId: string,
    productId: string,
    storeId: string,
  ): Promise<CartView> {
    return this.service.removeItem(userId, productId, storeId);
  }

  async upsertItemNote(
    userId: string,
    note: string,
    target: { productId?: string; cartItemId?: string },
    storeId: string,
  ): Promise<CartView> {
    return this.service.updateNote(userId, note, target, storeId);
  }
}

export const cartFacade = new CartFacade();
