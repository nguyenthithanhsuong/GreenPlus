import { AppError } from "../../core/errors";
import { createProductState } from "./states/product.state";
import { ProductRepository, getRelationValue } from "./product.repository";
import { BrowseResult, ProductBrowseItem, ProductSort } from "./product.types";
import { createSortStrategy } from "./strategies/product-query.strategy";

const DEFAULT_LIMIT = 20;

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async getActiveBrowseItems(): Promise<ProductBrowseItem[]> {
    // Lay danh sach active + map gia moi nhat + map thong tin category/chung nhan.
    const products = await this.repository.listActiveProducts();
    const productIds = products.map((product) => product.product_id);
    const latestPriceMap = await this.repository.getLatestPriceMap(productIds);

    return products
      .filter((product) => createProductState(product.status).canView())
      .map((product) => ({
        productId: product.product_id,
        name: product.name,
        imageUrl: product.image_url,
        categoryId: product.category_id,
        categoryName: getRelationValue<string>(product.categories, "name"),
        supplierId: product.supplier_id,
        certification: getRelationValue<string>(product.suppliers, "certificate"),
        price: latestPriceMap.get(product.product_id) ?? null,
        isAvailable: true,
        createdAt: product.created_at,
      }));
  }

  async browseProducts(page: number, limit: number = DEFAULT_LIMIT, sort: ProductSort = "newest"): Promise<BrowseResult> {
    if (page < 1) {
      throw new AppError("page must be at least 1");
    }

    if (limit < 1 || limit > 100) {
      throw new AppError("limit must be between 1 and 100");
    }

    const items = await this.getActiveBrowseItems();
    const sorted = createSortStrategy(sort).apply(items);

    // Pagination theo offset: start = (page - 1) * limit.
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
