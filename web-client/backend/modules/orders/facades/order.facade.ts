import {
  OrderAuditObserver,
  OrderChangeNotifier,
  OrderNotificationObserver,
} from "../observers/order.observer";
import { OrderService } from "../order.service";
import { CancelOrderInput, CreateOrderInput, OrderDetail, OrderSummary } from "../order.types";

export class OrderFacade {
  private readonly notifier: OrderChangeNotifier;
  private readonly service: OrderService;

  constructor() {
    this.service = new OrderService();
    this.notifier = new OrderChangeNotifier();
    this.notifier.attach(new OrderAuditObserver());
    this.notifier.attach(new OrderNotificationObserver());
  }

  async trackMyOrders(userId: string): Promise<OrderSummary[]> {
    return this.service.listMyOrders(userId);
  }

  async getOrderDetail(userId: string, orderId: string): Promise<OrderDetail> {
    return this.service.getOrderDetail(userId, orderId);
  }

  async createOrderFromCart(input: CreateOrderInput): Promise<{ order_id: string; status: "pending"; total_amount: number }> {
    const created = await this.service.createOrder(input);

    this.notifier.notify({
      orderId: created.order_id,
      event: "created",
      changedAt: new Date().toISOString(),
    });

    return created;
  }

  async cancelOrder(input: CancelOrderInput): Promise<{ order_id: string; status: "cancelled"; message: string }> {
    const result = await this.service.cancelOrder(input);

    this.notifier.notify({
      orderId: result.order_id,
      event: "cancelled",
      changedAt: new Date().toISOString(),
    });

    return result;
  }
}

export const orderFacade = new OrderFacade();
