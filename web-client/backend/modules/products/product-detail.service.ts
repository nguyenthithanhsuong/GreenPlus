import { AppError } from "../../core/errors";
import { ProductBatchRow, ProductRepository, getRelationValue } from "./product.repository";
import { createBatchState } from "./states/batch.state";
import { createProductState } from "./states/product.state";
import { ProductDetail } from "./product.types";

type InventoryRow = {
  quantity_available: number;
  quantity_reserved: number;
};

// Supabase relation co the tra object hoac array, ham nay chuan hoa ve array de tinh toan on dinh.
function toInventoryRows(input: ProductBatchRow["inventory"]): InventoryRow[] {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input as InventoryRow[];
  }

  return [input as InventoryRow];
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
    // State pattern xu ly quy tac hien thi san pham theo trang thai.
    if (!state.canView()) {
      throw new AppError("MSG1: Product is not available", 400);
    }

    // Chay song song de giam do tre khi load trang chi tiet.
    const [latestPrice, batches] = await Promise.all([
      this.repository.getLatestPriceForProduct(productId),
      this.repository.getBatchesWithInventoryByProduct(productId),
    ]);

    let totalAvailable = 0;
    let totalReserved = 0;
    let hasSellableBatch = false;
    let hasAnyExpiredBatch = false;

    batches.forEach((batch) => {
      const inventoryRows = toInventoryRows(batch.inventory);
      const availableInBatch = inventoryRows.reduce((sum, row) => sum + Number(row.quantity_available ?? 0), 0);
      const reservedInBatch = inventoryRows.reduce((sum, row) => sum + Number(row.quantity_reserved ?? 0), 0);

      totalAvailable += availableInBatch;
      totalReserved += reservedInBatch;

      // Batch state quyet dinh kha nang ban theo status + ton kho + han su dung.
      const isSellable = createBatchState(batch.status).isSellable(availableInBatch, batch.expire_date);
      if (isSellable) {
        hasSellableBatch = true;
      }

      if (batch.status === "expired") {
        hasAnyExpiredBatch = true;
      }
    });

    // Uu tien in_stock, neu khong co lo ban duoc thi phan loai expired/out_of_stock.
    const inventoryStatus = hasSellableBatch ? "in_stock" : hasAnyExpiredBatch ? "expired" : "out_of_stock";

    return {
      productId: product.product_id,
      name: product.name,
      description: product.description,
      images: product.image_url ? [product.image_url] : [],
      availablePrice: latestPrice,
      category: {
        id: product.category_id,
        name: getRelationValue<string>(product.categories, "name"),
      },
      inventory: {
        status: inventoryStatus,
        totalAvailable,
        totalReserved,
        hasSellableBatch,
      },
      supplier: {
        id: product.supplier_id,
        certification: getRelationValue<string>(product.suppliers, "certificate"),
      },
    };
  }
}
