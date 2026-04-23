import { OrderStatus } from "../order-tracking.types";

export type OrderTrackingEvent =
  | {
      type: "order_status_updated";
      orderId: string;
      actor: "manager";
      from: OrderStatus;
      to: OrderStatus;
    }
  | {
      type: "order_detail_viewed";
      orderId: string;
      actor: "manager";
    };

export interface OrderTrackingObserver {
  update(event: OrderTrackingEvent): Promise<void>;
}

export class OrderTrackingSubject {
  private readonly observers = new Set<OrderTrackingObserver>();

  attach(observer: OrderTrackingObserver): void {
    this.observers.add(observer);
  }

  async notify(event: OrderTrackingEvent): Promise<void> {
    await Promise.all(Array.from(this.observers).map((observer) => observer.update(event)));
  }
}

export class OrderTrackingAuditObserver implements OrderTrackingObserver {
  async update(event: OrderTrackingEvent): Promise<void> {
    void event;
    return Promise.resolve();
  }
}