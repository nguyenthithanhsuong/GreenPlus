import { AppError } from "../../core/errors";
import { createProductState } from "./states/product.state";
import { ProductRepository, getRelationValue } from "./product.repository";
import { BrowseResult, ProductBrowseItem, ProductSort } from "./product.types";
import { createSortStrategy } from "./strategies/product-query.strategy";

const DEFAULT_LIMIT = 20;

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async getActiveBrowseItems(storeId: string): Promise<ProductBrowseItem[]> {
    const products = await this.repository.listActiveProducts(storeId);
    const productIds = products.map((product) => product.product_id);
    const [latestPriceMap, supplierMap, sellableStockMap] = await Promise.all([
      this.repository.getLatestPriceMap(productIds, storeId),
      this.repository.getProductSupplierMap(productIds, storeId),
      this.repository.getSellableStockMap(productIds, storeId),
    ]);

    return products
      .filter((product) => createProductState(product.status).canView())
      .map((product) => {
        const availableQuantity = sellableStockMap.get(product.product_id) ?? 0;
        const price = latestPriceMap.get(product.product_id) ?? null;
        const isAvailable = availableQuantity > 0;
        const canPurchase = isAvailable && price !== null && Number.isFinite(price) && price > 0;

        return {
          productId: product.product_id,
          name: product.name,
          imageUrl: product.image_url,
          categoryId: product.category_id,
          categoryName: getRelationValue<string>(product.categories, "name"),
          certification: supplierMap.get(product.product_id)?.certification ?? null,
          price,
          availableQuantity,
          // Stock and pricing are different facts. Never label stocked items "Tạm hết" just because pricing is missing.
          isAvailable,
          canPurchase,
          createdAt: product.created_at,
        };
      });
  }

  async browseProducts(
    page: number,
    limit: number = DEFAULT_LIMIT,
    sort: ProductSort = "newest",
    storeId: string,
  ): Promise<BrowseResult> {
    if (page < 1) {
      throw new AppError("page must be at least 1");
    }

    if (limit < 1 || limit > 100) {
      throw new AppError("limit must be between 1 and 100");
    }

    const items = await this.getActiveBrowseItems(storeId);
    const sorted = createSortStrategy(sort).apply(items);

    const startIndex = (page - 1) * limit;
    const paged = sorted.slice(startIndex, startIndex + limit);

    return {
      page,
      limit,
      total: sorted.length,
      items: paged,
    };
  }
}
