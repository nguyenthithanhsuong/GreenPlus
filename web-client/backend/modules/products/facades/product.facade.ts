import { ProductDetailService } from "../product-detail.service";
import { ProductRepository } from "../product.repository";
import { ProductService } from "../product.service";
import { SearchService } from "../search.service";
import {
  CacheUpdaterObserver,
  ProductChangeNotifier,
  SearchIndexUpdaterObserver,
} from "../observers/product.observer";
import {
  BrowseResult,
  ProductChangedEvent,
  ProductDetail,
  SearchCriteria,
} from "../product.types";

export class ProductFacade {
  private readonly notifier: ProductChangeNotifier;
  private readonly productService: ProductService;
  private readonly searchService: SearchService;
  private readonly productDetailService: ProductDetailService;

  constructor() {
    const repository = new ProductRepository();
    this.productService = new ProductService(repository);
    this.searchService = new SearchService(this.productService);
    this.productDetailService = new ProductDetailService(repository);

    this.notifier = new ProductChangeNotifier();
    this.notifier.attach(new SearchIndexUpdaterObserver());
    this.notifier.attach(new CacheUpdaterObserver());
  }
  async browseProducts(
    page: number,
    storeId: string,
    sort?: SearchCriteria["sort"],
    limit?: number,
  ): Promise<BrowseResult> {
    return this.productService.browseProducts(
      page,
      limit,
      sort ?? "newest",
      storeId,
    );
  }

  async searchProducts(
    criteria: SearchCriteria,
    storeId: string,
  ): Promise<BrowseResult> {
    return this.searchService.search(criteria, storeId);
  }

  async getProductDetail(
    productId: string,
    storeId: string,
  ): Promise<ProductDetail> {
    return this.productDetailService.getDetail(productId, storeId);
  }

  notifyProductChanged(
    productId: string,
    event: ProductChangedEvent["event"],
  ): void {
    this.notifier.notify({
      productId,
      event,
      changedAt: new Date().toISOString(),
    });
  }
}

export const productFacade = new ProductFacade();
