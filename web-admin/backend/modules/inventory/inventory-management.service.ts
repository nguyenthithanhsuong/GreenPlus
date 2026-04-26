import { AppError } from "../../core/errors";
import { InventoryManagementRepository } from "./inventory-management.repository";
import {
  InventoryRow,
  InventoryTransactionRow,
  UpdateInventoryInput,
} from "./inventory-management.types";
import { createInventoryState } from "./states/inventory-state";
import { DefaultInventoryTransactionStrategy } from "./strategies/inventory-transaction.strategy";

export class InventoryManagementService {
  private readonly transactionStrategy = new DefaultInventoryTransactionStrategy();

  constructor(private readonly repository: InventoryManagementRepository) {}

  async listInventories(): Promise<InventoryRow[]> {
    return this.repository.listInventories();
  }

  async updateInventory(input: UpdateInventoryInput): Promise<InventoryRow> {
    if (!input.inventoryId.trim()) {
      throw new AppError("inventoryId is required", 400);
    }

    if (!Number.isInteger(input.quantityAvailable) || input.quantityAvailable < 0) {
      throw new AppError("quantityAvailable must be a non-negative integer", 400);
    }

    const quantityReserved = typeof input.quantityReserved === "number" ? input.quantityReserved : 0;
    if (!Number.isInteger(quantityReserved) || quantityReserved < 0) {
      throw new AppError("quantityReserved must be a non-negative integer", 400);
    }

    if (quantityReserved > input.quantityAvailable) {
      throw new AppError("quantityReserved cannot exceed quantityAvailable", 400);
    }

    const existing = await this.repository.findInventoryById(input.inventoryId);
    if (!existing) {
      throw new AppError("inventory not found", 404);
    }

    const updated = await this.repository.updateInventory({
      inventoryId: input.inventoryId,
      quantityAvailable: input.quantityAvailable,
      quantityReserved,
      lastUpdated: new Date().toISOString(),
    });

    if (!updated) {
      throw new AppError("inventory not found", 404);
    }

    if (updated.batch_id) {
      const transactionType = typeof input.type !== "undefined"
        ? this.transactionStrategy.normalize(input.type)
        : this.transactionStrategy.derive(existing.quantity_available, updated.quantity_available);

      const delta = Math.abs(updated.quantity_available - existing.quantity_available);
      const quantity = delta === 0 ? updated.quantity_available : delta;

      await this.repository.createTransaction({
        batchId: updated.batch_id,
        type: transactionType,
        quantity,
        note: input.note,
      });
    }

    return updated;
  }

  async deleteInventory(inventoryId: string): Promise<void> {
    const normalizedId = inventoryId.trim();
    if (!normalizedId) {
      throw new AppError("inventoryId is required", 400);
    }

    const existing = await this.repository.findInventoryById(normalizedId);
    if (!existing) {
      throw new AppError("inventory not found", 404);
    }

    const state = createInventoryState(existing.quantity_available, existing.quantity_reserved);
    if (!state.canDelete()) {
      throw new AppError("inventory cannot be deleted while quantities remain", 400);
    }

    const deleted = await this.repository.deleteInventory(normalizedId);
    if (!deleted) {
      throw new AppError("inventory not found", 404);
    }
  }

  async listTransactionsByBatchId(batchId: string): Promise<InventoryTransactionRow[]> {
    const normalizedBatchId = batchId.trim();
    if (!normalizedBatchId) {
      throw new AppError("batchId is required", 400);
    }

    return this.repository.listTransactionsByBatchId(normalizedBatchId);
  }

  async updateInventoryForDelivery(input: {
    orderId: string;
    orderItems: Array<{
      batchId: string | null;
      quantity: number;
    }>;
    note?: string;
  }): Promise<void> {
    const normalizedOrderId = input.orderId.trim();
    if (!normalizedOrderId) {
      throw new AppError("orderId is required", 400);
    }

    for (const item of input.orderItems) {
      if (!item.batchId || item.quantity <= 0) {
        continue;
      }

      const inventory = await this.repository.findInventoryByBatchId(item.batchId);
      if (!inventory) {
        continue;
      }

      const newQuantityAvailable = Math.max(0, inventory.quantity_available - item.quantity);
      const newQuantityReserved = Math.max(0, (inventory.quantity_reserved ?? 0) - item.quantity);

      await this.repository.updateInventory({
        inventoryId: inventory.inventory_id,
        quantityAvailable: newQuantityAvailable,
        quantityReserved: newQuantityReserved,
        type: "stock_out",
        note: input.note ? `Order ${normalizedOrderId}: ${input.note}` : `Order ${normalizedOrderId} delivery`,
      });
    }
  }
}