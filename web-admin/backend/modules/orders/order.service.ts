import { OrderRepository } from "./order.repository";

export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async create(userId: string): Promise<{ id: string; userId: string }> {
    return this.orderRepository.createOrder(userId);
  }
}
