export type SupplierManagementEvent =
  | {
      type: "supplier_created";
      supplierId: string;
      actor: "admin";
    }
  | {
      type: "supplier_updated";
      supplierId: string;
      actor: "admin";
    }
  | {
      type: "supplier_status_changed";
      supplierId: string;
      actor: "admin";
      status: "pending" | "approved" | "rejected";
    }
  | {
      type: "supplier_deleted";
      supplierId: string;
      actor: "admin";
    };

export interface SupplierManagementObserver {
  update(event: SupplierManagementEvent): Promise<void>;
}

export class SupplierManagementSubject {
  private readonly observers = new Set<SupplierManagementObserver>();

  attach(observer: SupplierManagementObserver): void {
    this.observers.add(observer);
  }

  async notify(event: SupplierManagementEvent): Promise<void> {
    await Promise.all(Array.from(this.observers).map((observer) => observer.update(event)));
  }
}

export class SupplierManagementAuditObserver implements SupplierManagementObserver {
  async update(event: SupplierManagementEvent): Promise<void> {
    void event;
    return Promise.resolve();
  }
}
