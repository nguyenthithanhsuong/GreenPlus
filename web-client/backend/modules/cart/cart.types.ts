export type CartItemView = {
  cart_item_id: string;
  cart_id: string;
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
  note: string | null;
  product_price: number | null;
  subtotal: number;
};

export type CartView = {
  user_id: string;
  cart_id: string;
  items: CartItemView[];
  cart_total: number;
};
