import apiService from "./ApiService";
import { UrlBuilder, UrlDirector } from "../builder";

export interface CartItemView {
  cart_item_id: string;
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
  note: string | null;
  product_price: number | null;
  subtotal: number;
}

export interface CartResponse {
  user_id: string;
  cart_id: string;
  items: CartItemView[];
  cart_total: number;
}

class CartService {
  private static instance: CartService;

  private constructor() {}

  static getInstance(): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService();
    }
    return CartService.instance;
  }

  async getCart(userId: string): Promise<CartResponse> {
    return apiService.get<CartResponse>(
      UrlDirector.create("/api/cart").query("userId", userId).build(),
    );
  }

  async addToCart(params: {
    userId: string;
    productId: string;
    quantity: number;
  }): Promise<CartResponse> {
    return apiService.post<CartResponse>("/api/cart", params);
  }

  async updateQuantity(params: {
    userId: string;
    productId: string;
    quantity: number;
  }): Promise<CartResponse> {
    return apiService.put<CartResponse>("/api/cart", params);
  }

  async removeFromCart(params: {
    userId: string;
    productId: string;
  }): Promise<CartResponse> {
    return apiService.delete<CartResponse>("/api/cart", params);
  }

  async updateNote(params: {
    userId: string;
    cartItemId: string;
    note: string;
  }): Promise<CartResponse> {
    return apiService.put<CartResponse>("/api/cart/note", params);
  }
}

export default CartService.getInstance();
