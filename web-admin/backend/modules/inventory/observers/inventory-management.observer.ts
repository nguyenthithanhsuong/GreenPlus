import { InventoryTransactionType } from "../inventory-management.types";

export type InventoryManagementEvent =
  | {
      type: "inventory_updated";
      inventoryId: string;
      actor: "manager";
    }
  | {
      type: "inventory_deleted";
      inventoryId: string;
      actor: "manager";
    }
  | {
      type: "inventory_transaction_created";
      inventoryId: string;
      actor: "manager";
      transactionType: InventoryTransactionType;
    };

export interface InventoryManagementObserver {
  update(event: InventoryManagementEvent): Promise<void>;
}

export class InventoryManagementSubject {
  private readonly observers = new Set<InventoryManagementObserver>();

  attach(observer: InventoryManagementObserver): void {
    this.observers.add(observer);
  }

  async notify(event: InventoryManagementEvent): Promise<void> {
    await Promise.all(Array.from(this.observers).map((observer) => observer.update(event)));
  }
}

export class InventoryManagementAuditObserver implements InventoryManagementObserver {
  async update(event: InventoryManagementEvent): Promise<void> {
    void event;
    return Promise.resolve();
  }
}