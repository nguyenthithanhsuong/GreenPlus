import { CartResponse, CartItemView } from "../services/CartService";

export interface CartItemUIModel {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  note: string | null;
  unitPrice: number | null;
  subtotal: number;
}

export interface CartUIModel {
  userId: string;
  items: CartItemUIModel[];
  total: number;
  itemCount: number;
}

class CartAdapter {
  static toUIModel(response: CartResponse): CartUIModel {
    return {
      userId: response.user_id,
      items: response.items.map((item) => this.toItemUIModel(item)),
      total: response.cart_total,
      itemCount: response.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  private static toItemUIModel(item: CartItemView): CartItemUIModel {
    return {
      id: item.cart_item_id,
      productId: item.product_id,
      productName: item.product_name,
      productImage: item.product_image_url,
      quantity: item.quantity,
      note: item.note,
      unitPrice: item.product_price,
      subtotal: item.subtotal,
    };
  }
}

export default CartAdapter;
