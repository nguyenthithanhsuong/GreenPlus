import { OrderChangedEvent } from "../order.types";

export interface OrderObserver {
  update(event: OrderChangedEvent): void;
}

export interface OrderSubject {
  attach(observer: OrderObserver): void;
  detach(observer: OrderObserver): void;
  notify(event: OrderChangedEvent): void;
}

export class OrderChangeNotifier implements OrderSubject {
  private readonly observers = new Set<OrderObserver>();

  attach(observer: OrderObserver): void {
    this.observers.add(observer);
  }

  detach(observer: OrderObserver): void {
    this.observers.delete(observer);
  }

  notify(event: OrderChangedEvent): void {
    this.observers.forEach((observer) => observer.update(event));
  }
}

export class OrderAuditObserver implements OrderObserver {
  update(event: OrderChangedEvent): void {
    const eventName = event.event;
    const orderId = event.orderId;
    void eventName;
    void orderId;
  }
}

export class OrderNotificationObserver implements OrderObserver {
  update(event: OrderChangedEvent): void {
    const orderId = event.orderId;
    void orderId;
  }
}
