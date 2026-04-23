import { AppError } from "../../core/errors";
import { BatchManagementRepository } from "./batch-management.repository";
import { BatchRow, CreateBatchInput, UpdateBatchInput } from "./batch-management.types";
import { DefaultBatchStatusStrategy } from "./strategies/batch-status.strategy";

const parseDate = (value: string): number => {
  const timestamp = new Date(`${value}T00:00:00`).getTime();

  if (Number.isNaN(timestamp)) {
    throw new AppError(`Invalid date: ${value}`, 400);
  }

  return timestamp;
};

export class BatchManagementService {
  private readonly statusStrategy = new DefaultBatchStatusStrategy();

  constructor(private readonly repository: BatchManagementRepository) {}

  async listBatches(): Promise<BatchRow[]> {
    return this.repository.listBatches();
  }

  private async ensureProductAndSupplier(input: { productId: string; supplierId: string }): Promise<void> {
    const [hasProduct, hasSupplier] = await Promise.all([
      this.repository.findProductById(input.productId),
      this.repository.findSupplierById(input.supplierId),
    ]);

    if (!hasProduct) {
      throw new AppError("Product not found", 404);
    }

    if (!hasSupplier) {
      throw new AppError("Supplier not found", 404);
    }
  }

  private ensureDates(harvestDate: string, expireDate: string): void {
    const harvestTimestamp = parseDate(harvestDate);
    const expireTimestamp = parseDate(expireDate);

    if (expireTimestamp < harvestTimestamp) {
      throw new AppError("Expire date must be on or after harvest date", 400);
    }
  }

  private ensureQuantity(quantity: number): void {
    if (!Number.isInteger(quantity)) {
      throw new AppError("Quantity must be an integer", 400);
    }

    if (quantity < 0) {
      throw new AppError("Quantity must be greater than or equal to zero", 400);
    }
  }

  async createBatch(input: CreateBatchInput): Promise<BatchRow> {
    const productId = input.productId.trim();
    const supplierId = input.supplierId.trim();
    const harvestDate = input.harvestDate.trim();
    const expireDate = input.expireDate.trim();

    if (!productId) {
      throw new AppError("Product is required", 400);
    }

    if (!supplierId) {
      throw new AppError("Supplier is required", 400);
    }

    if (!harvestDate) {
      throw new AppError("Harvest date is required", 400);
    }

    if (!expireDate) {
      throw new AppError("Expire date is required", 400);
    }

    this.ensureQuantity(input.quantity);
    this.ensureDates(harvestDate, expireDate);
    await this.ensureProductAndSupplier({ productId, supplierId });

    return this.repository.createBatch({
      productId,
      supplierId,
      harvestDate,
      expireDate,
      quantity: input.quantity,
      qrCode: input.qrCode?.trim() || null,
      status: input.status ?? this.statusStrategy.derive({ quantity: input.quantity, expireDate }),
    });
  }

  async updateBatch(input: UpdateBatchInput): Promise<BatchRow> {
    const existing = await this.repository.findById(input.batchId);
    if (!existing) {
      throw new AppError("Batch not found", 404);
    }

    const nextProductId = typeof input.productId !== "undefined" ? input.productId.trim() : existing.product_id;
    const nextSupplierId = typeof input.supplierId !== "undefined" ? input.supplierId.trim() : existing.supplier_id;
    const nextHarvestDate = typeof input.harvestDate !== "undefined" ? input.harvestDate.trim() : existing.harvest_date;
    const nextExpireDate = typeof input.expireDate !== "undefined" ? input.expireDate.trim() : existing.expire_date;
    const nextQuantity = typeof input.quantity !== "undefined" ? input.quantity : existing.quantity;

    if (!nextProductId) {
      throw new AppError("Product is required", 400);
    }

    if (!nextSupplierId) {
      throw new AppError("Supplier is required", 400);
    }

    if (!nextHarvestDate) {
      throw new AppError("Harvest date is required", 400);
    }

    if (!nextExpireDate) {
      throw new AppError("Expire date is required", 400);
    }

    this.ensureQuantity(nextQuantity);
    this.ensureDates(nextHarvestDate, nextExpireDate);

    if (typeof input.productId !== "undefined" || typeof input.supplierId !== "undefined") {
      await this.ensureProductAndSupplier({ productId: nextProductId, supplierId: nextSupplierId });
    }

    let nextStatus = existing.status;
    if (typeof input.status !== "undefined") {
      nextStatus = this.statusStrategy.transition(existing.status, this.statusStrategy.normalize(input.status));
    } else {
      nextStatus = this.statusStrategy.transition(existing.status, this.statusStrategy.derive({ quantity: nextQuantity, expireDate: nextExpireDate }));
    }

    const updated = await this.repository.updateBatch({
      batchId: input.batchId,
      productId: typeof input.productId !== "undefined" ? nextProductId : undefined,
      supplierId: typeof input.supplierId !== "undefined" ? nextSupplierId : undefined,
      harvestDate: typeof input.harvestDate !== "undefined" ? nextHarvestDate : undefined,
      expireDate: typeof input.expireDate !== "undefined" ? nextExpireDate : undefined,
      quantity: typeof input.quantity !== "undefined" ? nextQuantity : undefined,
      qrCode: input.qrCode,
      status: nextStatus,
    });

    if (!updated) {
      throw new AppError("Batch not found", 404);
    }

    return updated;
  }

  async changeStatus(batchId: string, status: string): Promise<BatchRow> {
    const existing = await this.repository.findById(batchId);
    if (!existing) {
      throw new AppError("Batch not found", 404);
    }

    const nextStatus = this.statusStrategy.transition(existing.status, this.statusStrategy.normalize(status));
    const updated = await this.repository.updateBatch({ batchId, status: nextStatus });

    if (!updated) {
      throw new AppError("Batch not found", 404);
    }

    return updated;
  }

  async deleteBatch(batchId: string): Promise<void> {
    if (!batchId.trim()) {
      throw new AppError("batchId is required", 400);
    }

    const deleted = await this.repository.deleteBatch(batchId);
    if (!deleted) {
      throw new AppError("Batch not found", 404);
    }
  }
}