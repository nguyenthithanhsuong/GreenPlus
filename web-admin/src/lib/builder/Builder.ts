export interface Builder<TProduct> {
  reset(): this;
  getProduct(): TProduct;
}
