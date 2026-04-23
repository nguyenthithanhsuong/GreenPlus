export type ProductManagementEvent =
  | {
      type: "product_created";
      productId: string;
      actor: "admin";
    }
  | {
      type: "product_updated";
      productId: string;
      actor: "admin";
    }
  | {
      type: "product_status_changed";
      productId: string;
      actor: "admin";
      status: "active" | "inactive";
    }
  | {
      type: "product_deleted";
      productId: string;
      actor: "admin";
    };

export interface ProductManagementObserver {
  update(event: ProductManagementEvent): Promise<void>;
}

export class ProductManagementSubject {
  private readonly observers = new Set<ProductManagementObserver>();

  attach(observer: ProductManagementObserver): void {
    this.observers.add(observer);
  }

  async notify(event: ProductManagementEvent): Promise<void> {
    await Promise.all(Array.from(this.observers).map((observer) => observer.update(event)));
  }
}

export class ProductManagementAuditObserver implements ProductManagementObserver {
  async update(event: ProductManagementEvent): Promise<void> {
    void event;
    return Promise.resolve();
  }
}
