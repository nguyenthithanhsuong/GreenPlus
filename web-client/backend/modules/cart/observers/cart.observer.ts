export type CartChangedEvent = {
  userId: string;
  event: "item_added" | "item_quantity_updated" | "item_removed" | "note_updated";
  changedAt: string;
};

export interface CartObserver {
  update(event: CartChangedEvent): void;
}

export class CartSubject {
  private readonly observers = new Set<CartObserver>();

  attach(observer: CartObserver): void {
    this.observers.add(observer);
  }

  notify(event: CartChangedEvent): void {
    this.observers.forEach((observer) => observer.update(event));
  }
}

export class CartAuditObserver implements CartObserver {
  update(event: CartChangedEvent): void {
    const userId = event.userId;
    const eventName = event.event;
    void userId;
    void eventName;
  }
}
