export class OrderRepository {
  async createOrder(userId: string): Promise<{ id: string; userId: string }> {
    return { id: "new-order", userId };
  }
}
