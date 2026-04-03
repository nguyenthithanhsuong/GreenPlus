import { GroupPurchaseChangedEvent } from "../group-purchase.types";

export interface GroupPurchaseObserver {
  update(event: GroupPurchaseChangedEvent): void;
}

export class GroupPurchaseSubject {
  private readonly observers = new Set<GroupPurchaseObserver>();

  attach(observer: GroupPurchaseObserver): void {
    this.observers.add(observer);
  }

  notify(event: GroupPurchaseChangedEvent): void {
    this.observers.forEach((observer) => observer.update(event));
  }
}

export class GroupPurchaseAuditObserver implements GroupPurchaseObserver {
  update(event: GroupPurchaseChangedEvent): void {
    const eventType = event.event;
    const groupId = event.groupId;
    void eventType;
    void groupId;
  }
}
