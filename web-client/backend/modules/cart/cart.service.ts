import { AppError } from "../../core/errors";
import { CartAuditObserver, CartSubject } from "./observers/cart.observer";
import {
  CartRepository,
  CartRow,
  CartItemWithProductRow,
} from "./cart.repository";
import { createCartItemState } from "./states/cart-item.state";
import { createCartNoteValidationStrategy } from "./strategies/cart-note.strategy";
import { CartItemView, CartView } from "./cart.types";

function readRelValue<T = string>(
  rel: Record<string, unknown> | Record<string, unknown>[] | null,
  field: string,
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
  private readonly noteValidator = createCartNoteValidationStrategy();
  private readonly subject = new CartSubject();

  constructor() {
    this.subject.attach(new CartAuditObserver());
  }

  private async getOrCreateCart(
    userId: string,
    storeId: string,
  ): Promise<CartRow> {
    if (!userId) {
      throw new AppError("userId is required", 400);
    }

    let existing: CartRow | null = null;
    try {
      existing = await this.repository.findCartByUserId(userId, storeId);
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Failed to load cart",
        500,
      );
    }

    if (existing) {
      return existing;
    }

    try {
      return await this.repository.createCart(userId, storeId);
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Failed to create cart",
        500,
      );
    }
  }

  private async getLatestPriceMap(
    productIds: string[],
    storeId: string,
  ): Promise<Map<string, number>> {
    if (productIds.length === 0) {
      return new Map();
    }

    let data: Array<{ product_id: string; price: number }> = [];
    try {
      data = await this.repository.listLatestPriceRows(productIds, storeId);
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Failed to load prices",
        500,
      );
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

  private async getAvailableStock(
    productId: string,
    storeId: string,
  ): Promise<number> {
    let batchIds: string[] = [];
    try {
      batchIds = await this.repository.listBatchIdsByProduct(
        productId,
        storeId,
      );
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Failed to load batches",
        500,
      );
    }

    if (batchIds.length === 0) {
      return 0;
    }

    try {
      const quantities = await this.repository.listInventoryByBatchIds(
        batchIds,
        storeId,
      );
      return quantities.reduce((sum, value) => sum + value, 0);
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Failed to load inventory",
        500,
      );
    }
  }

  private async ensureProductExists(
    productId: string,
    storeId: string,
  ): Promise<void> {
    let data: { product_id: string } | null = null;
    try {
      data = await this.repository.findProductById(productId, storeId);
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Failed to verify product",
        500,
      );
    }

    if (!data) {
      throw new AppError("Product does not exist", 404);
    }
  }

  private validateQuantity(quantity: number, availableStock: number): void {
    const state = createCartItemState(quantity);
    if (!state.canApplyQuantity(quantity, availableStock)) {
      if (quantity <= 0) {
        throw new AppError("Quantity must be greater than 0", 400);
      }

      throw new AppError("Quantity exceeds available stock", 400);
    }

    if (quantity <= 0) {
      throw new AppError("Quantity must be greater than 0", 400);
    }

    if (quantity > availableStock) {
      throw new AppError("Quantity exceeds available stock", 400);
    }
  }

  validateNote(note: string): void {
    this.noteValidator.validate(note);
  }

  async getCartByUser(userId: string, storeId: string): Promise<CartView> {
    const cart = await this.getOrCreateCart(userId, storeId);

    let items: CartItemWithProductRow[] = [];
    try {
      items = await this.repository.listCartItemsWithProduct(
        cart.cart_id,
        storeId,
      );
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Failed to load cart items",
        500,
      );
    }

    const productIds = items.map((item) => item.product_id);
    const latestPriceMap = await this.getLatestPriceMap(productIds, storeId);

    const viewItems: CartItemView[] = items.map((item) => {
      const price = latestPriceMap.get(item.product_id) ?? null;
      const subtotal = price === null ? 0 : price * Number(item.quantity);

      return {
        cart_item_id: item.cart_item_id,
        cart_id: item.cart_id,
        product_id: item.product_id,
        product_name:
          readRelValue<string>(item.products, "name") ?? "Unknown product",
        product_image_url: readRelValue<string>(item.products, "image_url"),
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

  async addProduct(
    userId: string,
    productId: string,
    quantity: number,
    storeId: string,
  ): Promise<CartView> {
    const cart = await this.getOrCreateCart(userId, storeId);
    await this.ensureProductExists(productId, storeId);

    const stock = await this.getAvailableStock(productId, storeId);
    if (stock === 0) {
      throw new AppError("Sản phẩm đã hết hàng tại cửa hàng đang chọn", 400);
    }
    this.validateQuantity(quantity, stock);

    let existingItem: { cart_item_id: string; quantity: number } | null = null;
    try {
      existingItem = await this.repository.findCartItemByProduct(
        cart.cart_id,
        productId,
      );
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Failed to load cart item",
        500,
      );
    }

    if (!existingItem) {
      try {
        await this.repository.insertCartItem({
          cartId: cart.cart_id,
          productId,
          quantity,
          storeId,
        });

        this.subject.notify({
          userId,
          event: "item_added",
          changedAt: new Date().toISOString(),
        });
      } catch (error) {
        throw new AppError(
          error instanceof Error ? error.message : "Failed to insert cart item",
          500,
        );
      }

      return this.getCartByUser(userId, storeId);
    }

    const nextQuantity = Number(existingItem.quantity) + quantity;
    if (nextQuantity > stock) {
      throw new AppError(
        `Trong giỏ đã có ${existingItem.quantity}; cửa hàng chỉ còn ${stock} sản phẩm khả dụng.`,
        400,
      );
    }
    this.validateQuantity(nextQuantity, stock);

    try {
      await this.repository.updateCartItemQuantity(
        existingItem.cart_item_id,
        nextQuantity,
      );

      this.subject.notify({
        userId,
        event: "item_quantity_updated",
        changedAt: new Date().toISOString(),
      });
    } catch (error) {
      throw new AppError(
        error instanceof Error
          ? error.message
          : "Failed to update cart quantity",
        500,
      );
    }

    return this.getCartByUser(userId, storeId);
  }

  async updateQuantity(
    userId: string,
    productId: string,
    quantity: number,
    storeId: string,
  ): Promise<CartView> {
    const cart = await this.getOrCreateCart(userId, storeId);
    await this.ensureProductExists(productId, storeId);

    const stock = await this.getAvailableStock(productId, storeId);
    if (stock === 0) {
      throw new AppError("Sản phẩm đã hết hàng tại cửa hàng đang chọn", 400);
    }
    this.validateQuantity(quantity, stock);

    let existingItem: { cart_item_id: string } | null = null;
    try {
      existingItem = await this.repository.findCartItemByProduct(
        cart.cart_id,
        productId,
      );
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Failed to load cart item",
        500,
      );
    }

    if (!existingItem) {
      throw new AppError("Cart item not found", 404);
    }

    try {
      await this.repository.updateCartItemQuantity(
        existingItem.cart_item_id,
        quantity,
      );

      this.subject.notify({
        userId,
        event: "item_quantity_updated",
        changedAt: new Date().toISOString(),
      });
    } catch (error) {
      throw new AppError(
        error instanceof Error
          ? error.message
          : "Failed to update cart quantity",
        500,
      );
    }

    return this.getCartByUser(userId, storeId);
  }

  async removeItem(
    userId: string,
    productId: string,
    storeId: string,
  ): Promise<CartView> {
    const cart = await this.getOrCreateCart(userId, storeId);

    try {
      await this.repository.deleteCartItemByProduct(cart.cart_id, productId);

      this.subject.notify({
        userId,
        event: "item_removed",
        changedAt: new Date().toISOString(),
      });
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Failed to remove cart item",
        500,
      );
    }

    return this.getCartByUser(userId, storeId);
  }

  async updateNote(
    userId: string,
    note: string,
    target: { productId?: string; cartItemId?: string },
    storeId: string,
  ): Promise<CartView> {
    const cart = await this.getOrCreateCart(userId, storeId);

    if (note) {
      this.validateNote(note);
    }

    let existingItem: { cart_item_id: string } | null = null;

    if (!target.cartItemId && !target.productId) {
      throw new AppError("ProductId or CartItemId is required", 400);
    }

    try {
      if (target.cartItemId) {
        existingItem = await this.repository.findCartItemById(
          cart.cart_id,
          target.cartItemId,
        );
      } else if (target.productId) {
        existingItem = await this.repository.findCartItemByProduct(
          cart.cart_id,
          target.productId,
        );
      }
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Failed to load cart item",
        500,
      );
    }

    if (!existingItem) {
      throw new AppError("Cart item not found", 404);
    }

    const nextNote = note.trim().length === 0 ? null : note;

    try {
      await this.repository.updateCartItemNote(
        existingItem.cart_item_id,
        nextNote,
      );

      this.subject.notify({
        userId,
        event: "note_updated",
        changedAt: new Date().toISOString(),
      });
    } catch (error) {
      throw new AppError(
        error instanceof Error ? error.message : "Failed to update note",
        500,
      );
    }

    return this.getCartByUser(userId, storeId);
  }
}
