import { AppError } from "../../core/errors";
import { ProductBatchRow, ProductRepository, getRelationValue } from "./product.repository";
import { createBatchState } from "./states/batch.state";
import { createProductState } from "./states/product.state";
import { ProductDetail } from "./product.types";

type InventoryRow = {
  quantity_available: number;
  quantity_reserved: number;
};

function toInventoryRows(input: ProductBatchRow["inventory"]): InventoryRow[] {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input as InventoryRow[];
  }

  return [input as InventoryRow];
}

function normalizeBatchStatus(status: ProductBatchRow["status"]): "available" | "expired" | "sold_out" {
  if (status === "available" || status === "expired" || status === "sold_out") {
    return status;
  }

  return "sold_out";
}

export class ProductDetailService {
  constructor(private readonly repository: ProductRepository) {}

  async getDetail(productId: string): Promise<ProductDetail> {
    if (!productId) {
      throw new AppError("productId is required");
    }

    const product = await this.repository.getProductById(productId);

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const state = createProductState(product.status);
    if (!state.canView()) {
      throw new AppError("MSG1: Product is not available", 400);
    }

    const [latestPrice, batches, supplierMap] = await Promise.all([
      this.repository.getLatestPriceForProduct(productId),
      this.repository.getBatchesWithInventoryByProduct(productId),
      this.repository.getProductSupplierMap([productId]),
    ]);

    let totalAvailable = 0;
    let totalReserved = 0;
    let totalQuantity = 0;
    let hasSellableBatch = false;
    let hasAnyExpiredBatch = false;
    const batchDetails: ProductDetail["batches"] = [];

    batches.forEach((batch) => {
      const inventoryRows = toInventoryRows(batch.inventory);
      const resolvedStatus = normalizeBatchStatus(batch.status);
      const availableInBatch = inventoryRows.reduce((sum, row) => sum + Number(row.quantity_available ?? 0), 0);
      const reservedInBatch = inventoryRows.reduce((sum, row) => sum + Number(row.quantity_reserved ?? 0), 0);
      const quantityInBatch = Number(batch.quantity ?? 0);

      totalAvailable += availableInBatch;
      totalReserved += reservedInBatch;
      totalQuantity += quantityInBatch;

      const isSellable = createBatchState(resolvedStatus).isSellable(availableInBatch, batch.expire_date);
      if (isSellable) {
        hasSellableBatch = true;
      }

      batchDetails.push({
        batchId: batch.batch_id,
        status: resolvedStatus,
        expireDate: batch.expire_date,
        quantity: quantityInBatch,
        available: availableInBatch,
        reserved: reservedInBatch,
        isSellable,
      });

      if (resolvedStatus === "expired") {
        hasAnyExpiredBatch = true;
      }
    });

    const inventoryStatus = hasSellableBatch ? "in_stock" : hasAnyExpiredBatch ? "expired" : "out_of_stock";

    return {
      productId: product.product_id,
      name: product.name,
      description: product.description,
      nutrition: product.nutrition,
      images: product.image_url ? [product.image_url] : [],
      availablePrice: latestPrice,
      category: {
        id: product.category_id,
        name: getRelationValue<string>(product.categories, "name"),
      },
      inventory: {
        status: inventoryStatus,
        totalQuantity,
        totalAvailable,
        totalReserved,
        hasSellableBatch,
      },
      batches: batchDetails,
      supplier: {
        id: supplierMap.get(product.product_id)?.supplierId ?? null,
        certification: supplierMap.get(product.product_id)?.certification ?? null,
      },
    };
  }
}
