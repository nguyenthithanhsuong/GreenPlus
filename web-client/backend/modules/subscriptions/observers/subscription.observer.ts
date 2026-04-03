export type SubscriptionChangedEvent = {
  subscriptionId: string;
  userId: string;
  productId?: string;
  event: "created" | "cancelled";
  changedAt: string;
};

export interface SubscriptionObserver {
  update(event: SubscriptionChangedEvent): void;
}

export class SubscriptionSubject {
  private readonly observers = new Set<SubscriptionObserver>();

  attach(observer: SubscriptionObserver): void {
    this.observers.add(observer);
  }

  notify(event: SubscriptionChangedEvent): void {
    this.observers.forEach((observer) => observer.update(event));
  }
}

export class SubscriptionAuditObserver implements SubscriptionObserver {
  update(event: SubscriptionChangedEvent): void {
    const eventName = event.event;
    const subscriptionId = event.subscriptionId;
    void eventName;
    void subscriptionId;
  }
}
