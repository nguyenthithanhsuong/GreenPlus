import { AppError } from "../../core/errors";
import { CartRepository, CartRow, CartItemWithProductRow } from "./cart.repository";
import { CartItemView, CartView } from "./cart.types";

const NOTE_PROHIBITED_REGEX = /[<>$`]/;

function readRelValue<T = string>(
  rel: Record<string, unknown> | Record<string, unknown>[] | null,
  field: string
): T | null {
  if (!rel) {
    return null;
  }

  if (Array.isArray(rel)) {
    const first = rel[0];
    if (!first) {
      return null;
    }

    return (first[field] as T) ?? null;
  }

  return (rel[field] as T) ?? null;
}

export class CartService {
  private readonly repository = new CartRepository();

  private async getOrCreateCart(userId: string): Promise<CartRow> {
    if (!userId) {
      throw new AppError("userId is required", 400);
    }

    let existing: CartRow | null = null;
    try {
      existing = await this.repository.findCartByUserId(userId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load cart", 500);
    }

    if (existing) {
      return existing;
    }

    try {
      return await this.repository.createCart(userId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to create cart", 500);
    }
  }

  private async getLatestPriceMap(productIds: string[]): Promise<Map<string, number>> {
    if (productIds.length === 0) {
      return new Map();
    }

    let data: Array<{ product_id: string; price: number }> = [];
    try {
      data = await this.repository.listLatestPriceRows(productIds);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load prices", 500);
    }

    const map = new Map<string, number>();
    (data ?? []).forEach((row) => {
      const productId = String(row.product_id);
      if (!map.has(productId)) {
        map.set(productId, Number(row.price));
      }
    });

    return map;
  }

  private async getAvailableStock(productId: string): Promise<number> {
    let batchIds: string[] = [];
    try {
      batchIds = await this.repository.listBatchIdsByProduct(productId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load batches", 500);
    }

    if (batchIds.length === 0) {
      return 0;
    }

    try {
      const quantities = await this.repository.listInventoryByBatchIds(batchIds);
      return quantities.reduce((sum, value) => sum + value, 0);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load inventory", 500);
    }
  }

  private async ensureProductExists(productId: string): Promise<void> {
    let data: { product_id: string } | null = null;
    try {
      data = await this.repository.findProductById(productId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to verify product", 500);
    }

    if (!data) {
      throw new AppError("Product does not exist", 404);
    }
  }

  private validateQuantity(quantity: number, availableStock: number): void {
    if (quantity <= 0) {
      throw new AppError("MSG1: quantity must be greater than 0", 400);
    }

    if (quantity > availableStock) {
      throw new AppError("MSG2: quantity exceeds available stock", 400);
    }
  }

  validateNote(note: string): void {
    if (note.length > 255) {
      throw new AppError("MSG1: note must not exceed 255 characters", 400);
    }

    if (NOTE_PROHIBITED_REGEX.test(note)) {
      throw new AppError("MSG2: note contains prohibited characters", 400);
    }
  }

  async getCartByUser(userId: string): Promise<CartView> {
    const cart = await this.getOrCreateCart(userId);

    let items: CartItemWithProductRow[] = [];
    try {
      items = await this.repository.listCartItemsWithProduct(cart.cart_id);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load cart items", 500);
    }

    const productIds = items.map((item) => item.product_id);
    const latestPriceMap = await this.getLatestPriceMap(productIds);

    const viewItems: CartItemView[] = items.map((item) => {
      const price = latestPriceMap.get(item.product_id) ?? null;
      const subtotal = price === null ? 0 : price * Number(item.quantity);

      return {
        cart_item_id: item.cart_item_id,
        cart_id: item.cart_id,
        product_id: item.product_id,
        product_name: readRelValue<string>(item.products, "name") ?? "Unknown product",
        quantity: Number(item.quantity),
        note: item.note,
        product_price: price,
        subtotal,
      };
    });

    const cartTotal = viewItems.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      user_id: cart.user_id,
      cart_id: cart.cart_id,
      items: viewItems,
      cart_total: cartTotal,
    };
  }

  async addProduct(userId: string, productId: string, quantity: number): Promise<CartView> {
    const cart = await this.getOrCreateCart(userId);
    await this.ensureProductExists(productId);

    const stock = await this.getAvailableStock(productId);
    this.validateQuantity(quantity, stock);

    let existingItem: { cart_item_id: string; quantity: number } | null = null;
    try {
      existingItem = await this.repository.findCartItemByProduct(cart.cart_id, productId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load cart item", 500);
    }

    if (!existingItem) {
      try {
        await this.repository.insertCartItem({
          cartId: cart.cart_id,
          productId,
          quantity,
        });
      } catch (error) {
        throw new AppError(error instanceof Error ? error.message : "Failed to insert cart item", 500);
      }

      return this.getCartByUser(userId);
    }

    const nextQuantity = Number(existingItem.quantity) + quantity;
    this.validateQuantity(nextQuantity, stock);

    try {
      await this.repository.updateCartItemQuantity(existingItem.cart_item_id, nextQuantity);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to update cart quantity", 500);
    }

    return this.getCartByUser(userId);
  }

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<CartView> {
    const cart = await this.getOrCreateCart(userId);
    await this.ensureProductExists(productId);

    const stock = await this.getAvailableStock(productId);
    this.validateQuantity(quantity, stock);

    let existingItem: { cart_item_id: string } | null = null;
    try {
      existingItem = await this.repository.findCartItemByProduct(cart.cart_id, productId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load cart item", 500);
    }

    if (!existingItem) {
      throw new AppError("Cart item not found", 404);
    }

    try {
      await this.repository.updateCartItemQuantity(existingItem.cart_item_id, quantity);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to update cart quantity", 500);
    }

    return this.getCartByUser(userId);
  }

  async removeItem(userId: string, productId: string): Promise<CartView> {
    const cart = await this.getOrCreateCart(userId);

    try {
      await this.repository.deleteCartItemByProduct(cart.cart_id, productId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to remove cart item", 500);
    }

    return this.getCartByUser(userId);
  }

  async updateNote(
    userId: string,
    note: string,
    target: { productId?: string; cartItemId?: string }
  ): Promise<CartView> {
    const cart = await this.getOrCreateCart(userId);

    if (note) {
      this.validateNote(note);
    }

    let existingItem: { cart_item_id: string } | null = null;

    if (!target.cartItemId && !target.productId) {
      throw new AppError("MSG3: productId or cartItemId is required", 400);
    }

    try {
      if (target.cartItemId) {
        existingItem = await this.repository.findCartItemById(cart.cart_id, target.cartItemId);
      } else if (target.productId) {
        existingItem = await this.repository.findCartItemByProduct(cart.cart_id, target.productId);
      }
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load cart item", 500);
    }

    if (!existingItem) {
      throw new AppError("MSG3: cart item not found", 404);
    }

    const nextNote = note.trim().length === 0 ? null : note;

    try {
      await this.repository.updateCartItemNote(existingItem.cart_item_id, nextNote);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to update note", 500);
    }

    return this.getCartByUser(userId);
  }
}
