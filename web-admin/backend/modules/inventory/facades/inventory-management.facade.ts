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
  private readonly repository =
    new InventoryManagementRepository();

  private readonly service =
    new InventoryManagementService(
      this.repository
    );

  private readonly subject =
    new InventoryManagementSubject();

  constructor() {
    this.subject.attach(
      new InventoryManagementAuditObserver()
    );
  }

  async listInventories(): Promise<InventoryRow[]> {
    return this.service.listInventories();
  }

  async updateInventory(
    input: UpdateInventoryInput
  ): Promise<InventoryRow> {
    const previousInventory =
      await this.repository.findInventoryById(
        input.inventoryId
      );

    const updated =
      await this.service.updateInventory(input);

    await this.subject.notify({
      type: "inventory_updated",
      inventoryId: updated.inventory_id,
      actor: "manager",
    });

    if (updated.batch_id) {
      const previousQuantity =
        previousInventory?.quantity_available ?? 0;

      const nextQuantity =
        updated.quantity_available;

      const quantity = Math.abs(
        nextQuantity - previousQuantity
      );

      if (quantity > 0) {
        const transactionType =
          typeof input.type !== "undefined" && input.type !== "adjustment"
            ? input.type
            : nextQuantity > previousQuantity
            ? "adjust_in"
            : "adjust_out";

        await this.subject.notify({
          type: "inventory_transaction_created",
          inventoryId: updated.inventory_id,
          batchId: updated.batch_id,
          actor: "manager",
          transactionType,
          quantity,
          note: input.note ?? null,
        });
      }
    }

    return updated;
  }

  async deleteInventory(
    inventoryId: string
  ): Promise<void> {
    await this.service.deleteInventory(
      inventoryId
    );

    await this.subject.notify({
      type: "inventory_deleted",
      inventoryId,
      actor: "manager",
    });
  }
  async listTransactions(): Promise<InventoryTransactionRow[]> {
    return this.repository.listTransactions();
  }
  async listTransactionsByBatchId(
    batchId: string
  ): Promise<InventoryTransactionRow[]> {
    return this.service.listTransactionsByBatchId(
      batchId
    );
  }

  async updateInventoryForDelivery(input: {
    orderId: string;
    orderItems: Array<{
      batchId: string | null;
      quantity: number;
    }>;
    note?: string;
  }): Promise<void> {
    await this.service.updateInventoryForDelivery(
      input
    );

    for (const item of input.orderItems) {
      if (!item.batchId) {
        continue;
      }

      const inventory =
        await this.repository.findInventoryByBatchId(
          item.batchId
        );

      if (!inventory) {
        continue;
      }

      await this.subject.notify({
        type: "inventory_transaction_created",
        inventoryId: inventory.inventory_id,
        batchId: item.batchId,
        actor: "manager",
        transactionType: "stock_out",
        quantity: item.quantity,
        note: input.note
          ? `Order ${input.orderId}: ${input.note}`
          : `Order ${input.orderId} delivery`,
      });
    }
  }
}

export const inventoryManagementFacade =
  new InventoryManagementFacade();