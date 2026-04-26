import { InventoryManagementRepository } from "../inventory-management.repository";
import { InventoryManagementService } from "../inventory-management.service";
import {
  InventoryManagementAuditObserver,
  InventoryManagementSubject,
} from "../observers/inventory-management.observer";
import {
  InventoryRow,
  InventoryTransactionRow,
  UpdateInventoryInput,
} from "../inventory-management.types";

export class InventoryManagementFacade {
  private readonly repository = new InventoryManagementRepository();
  private readonly service = new InventoryManagementService(this.repository);
  private readonly subject = new InventoryManagementSubject();

  constructor() {
    this.subject.attach(new InventoryManagementAuditObserver());
  }

  async listInventories(): Promise<InventoryRow[]> {
    return this.service.listInventories();
  }

  async updateInventory(input: UpdateInventoryInput): Promise<InventoryRow> {
    const updated = await this.service.updateInventory(input);
    await this.subject.notify({
      type: "inventory_updated",
      inventoryId: updated.inventory_id,
      actor: "manager",
    });

    if (updated.batch_id) {
      const transactionType = input.type ?? "adjustment";
      await this.subject.notify({
        type: "inventory_transaction_created",
        inventoryId: updated.inventory_id,
        actor: "manager",
        transactionType,
      });
    }

    return updated;
  }

  async deleteInventory(inventoryId: string): Promise<void> {
    await this.service.deleteInventory(inventoryId);
    await this.subject.notify({
      type: "inventory_deleted",
      inventoryId,
      actor: "manager",
    });
  }

  async listTransactionsByBatchId(batchId: string): Promise<InventoryTransactionRow[]> {
    return this.service.listTransactionsByBatchId(batchId);
  }

  async updateInventoryForDelivery(input: {
    orderId: string;
    orderItems: Array<{
      batchId: string | null;
      quantity: number;
    }>;
    note?: string;
  }): Promise<void> {
    await this.service.updateInventoryForDelivery(input);
    await this.subject.notify({
      type: "inventory_transaction_created",
      inventoryId: input.orderId,
      actor: "system",
      transactionType: "stock_out",
    });
  }
}

export const inventoryManagementFacade = new InventoryManagementFacade();
