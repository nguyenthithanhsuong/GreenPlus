import { DeliveryStatus } from "../delivery-tracking.types";

export type DeliveryTrackingEvent =
  | {
      type: "delivery_created";
      orderId: string;
      actor: "manager" | "employee";
    }
  | {
      type: "delivery_status_updated";
      orderId: string;
      actor: "manager" | "employee";
      from: DeliveryStatus;
      to: DeliveryStatus;
    }
  | {
      type: "delivery_detail_viewed";
      orderId: string;
      actor: "manager" | "employee";
    };

export interface DeliveryTrackingObserver {
  update(event: DeliveryTrackingEvent): Promise<void>;
}

export class DeliveryTrackingSubject {
  private readonly observers = new Set<DeliveryTrackingObserver>();

  attach(observer: DeliveryTrackingObserver): void {
    this.observers.add(observer);
  }

  async notify(event: DeliveryTrackingEvent): Promise<void> {
    await Promise.all(Array.from(this.observers).map((observer) => observer.update(event)));
  }
}

export class DeliveryTrackingAuditObserver implements DeliveryTrackingObserver {
  async update(event: DeliveryTrackingEvent): Promise<void> {
    void event;
    return Promise.resolve();
  }
}