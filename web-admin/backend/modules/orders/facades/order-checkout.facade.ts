export class OrderCheckoutFacade {
  async checkout(cartId: string): Promise<{ orderId: string }> {
    if (!cartId) {
      throw new Error("cartId is required");
    }

    return { orderId: `order-${cartId}` };
  }
}
