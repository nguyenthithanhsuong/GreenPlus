import { OrderTrackingRepository } from "../order-tracking.repository";
import { OrderTrackingService } from "../order-tracking.service";
import {
  OrderTrackingAuditObserver,
  OrderTrackingSubject,
} from "../observers/order-tracking.observer";
import {
  OrderDetailRow,
  OrderFilterInput,
  OrderListRow,
  UpdateOrderStatusInput,
} from "../order-tracking.types";

export class OrderTrackingFacade {
  private readonly repository = new OrderTrackingRepository();
  private readonly service = new OrderTrackingService(this.repository);
  private readonly subject = new OrderTrackingSubject();

  constructor() {
    this.subject.attach(new OrderTrackingAuditObserver());
  }

  async listOrders(filters: OrderFilterInput): Promise<OrderListRow[]> {
    return this.service.listOrders(filters);
  }

  async getOrderDetail(orderId: string): Promise<OrderDetailRow> {
    const detail = await this.service.getOrderDetail(orderId);
    await this.subject.notify({
      type: "order_detail_viewed",
      orderId: detail.order_id,
      actor: "manager",
    });

    return detail;
  }

  async updateOrderStatus(input: UpdateOrderStatusInput): Promise<OrderDetailRow> {
    const previous = await this.service.getOrderDetail(input.orderId);
    const updated = await this.service.updateOrderStatus(input);

    await this.subject.notify({
      type: "order_status_updated",
      orderId: updated.order_id,
      actor: "manager",
      from: previous.status,
      to: updated.status,
    });

    return updated;
  }
}

export const orderTrackingFacade = new OrderTrackingFacade();