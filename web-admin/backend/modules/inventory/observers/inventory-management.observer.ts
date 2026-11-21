import { InventoryTransactionType } from "../inventory-management.types";
import { logger } from "@/lib/logger";

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
      batchId: string | null;
      actor: "manager";
      transactionType: InventoryTransactionType;
      quantity: number;
      note?: string | null;
    };

export interface InventoryManagementObserver {
  update(event: InventoryManagementEvent): Promise<void>;
}

export class InventoryManagementSubject {
  private readonly observers = new Set<InventoryManagementObserver>();

  attach(observer: InventoryManagementObserver): void {
    this.observers.add(observer);
  }

  detach(observer: InventoryManagementObserver): void {
    this.observers.delete(observer);
  }

  async notify(event: InventoryManagementEvent): Promise<void> {
    await Promise.all(
      Array.from(this.observers).map((observer) => observer.update(event)),
    );
  }
}

export class InventoryManagementAuditObserver implements InventoryManagementObserver {
  async update(event: InventoryManagementEvent): Promise<void> {
    // Keep free-text notes, identity and business identifiers out of log transport.
    logger.info("Inventory event", { kind: event.type });
  }
}
