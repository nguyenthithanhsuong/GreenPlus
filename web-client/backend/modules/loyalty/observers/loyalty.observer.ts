import { LoyaltyChangedEvent } from "../loyalty.types";

export interface LoyaltyObserver {
  update(event: LoyaltyChangedEvent): void;
}

export class LoyaltySubject {
  private readonly observers = new Set<LoyaltyObserver>();

  attach(observer: LoyaltyObserver): void {
    this.observers.add(observer);
  }

  notify(event: LoyaltyChangedEvent): void {
    this.observers.forEach((observer) => observer.update(event));
  }
}

export class LoyaltyNotificationObserver implements LoyaltyObserver {
  update(event: LoyaltyChangedEvent): void {
    const userId = event.userId;
    const points = event.points;
    void userId;
    void points;
  }
}
