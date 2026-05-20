import { ProductDetailService } from "../product-detail.service";
import { ProductRepository } from "../product.repository";
import { ProductService } from "../product.service";
import { SearchService } from "../search.service";
import {
  CacheUpdaterObserver,
  ProductChangeNotifier,
  SearchIndexUpdaterObserver,
} from "../observers/product.observer";
import { BrowseResult, ProductChangedEvent, ProductDetail, SearchCriteria } from "../product.types";

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
  async browseProducts(page: number, sort?: SearchCriteria["sort"], limit?: number): Promise<BrowseResult> {
    return this.productService.browseProducts(page, limit, sort ?? "newest");
  }

  async searchProducts(criteria: SearchCriteria): Promise<BrowseResult> {
    return this.searchService.search(criteria);
  }

  async getProductDetail(productId: string): Promise<ProductDetail> {
    return this.productDetailService.getDetail(productId);
  }

  notifyProductChanged(productId: string, event: ProductChangedEvent["event"]): void {
    this.notifier.notify({
      productId,
      event,
      changedAt: new Date().toISOString(),
    });
  }
}

export const productFacade = new ProductFacade();