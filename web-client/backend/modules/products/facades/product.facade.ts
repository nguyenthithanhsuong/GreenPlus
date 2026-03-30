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

/**
 * [FACADE COMPONENT]
 * Lớp ProductFacade đóng vai trò là "mặt tiền". Nó che giấu đi sự phức tạp của việc 
 * khởi tạo và kết nối hàng loạt các Service và Repository bên dưới.
 */
export class ProductFacade {
  // Khai báo các Subsystem (hệ thống con) là private để ngăn Client chọc trực tiếp vào chúng
  private readonly notifier: ProductChangeNotifier;
  private readonly productService: ProductService;
  private readonly searchService: SearchService;
  private readonly productDetailService: ProductDetailService;

  constructor() {
    // 1. CHUẨN BỊ DEPENDENCIES: 
    // Khởi tạo Repository chung để các Service dùng chung một nguồn tương tác DB.
    const repository = new ProductRepository();

    // 2. KHỞI TẠO SUBSYSTEMS:
    // Bơm (Inject) dependencies vào các Service. Nếu không có Facade, 
    // các file Route/Controller sẽ phải tự viết lại đoạn code khởi tạo loằng ngoằng này.
    this.productService = new ProductService(repository);
    this.searchService = new SearchService(this.productService);
    this.productDetailService = new ProductDetailService(repository);

    // 3. THIẾT LẬP OBSERVER PATTERN:
    // Tạo Subject (người phát tin) và gắn (attach) các Observers (người nghe tin) vào nó.
    // Việc setup này được gom gọn vào constructor của Facade để đảm bảo chỉ chạy 1 lần.
    this.notifier = new ProductChangeNotifier();
    this.notifier.attach(new SearchIndexUpdaterObserver());
    this.notifier.attach(new CacheUpdaterObserver());
  }

  // --- CÁC HÀM GIAO DIỆN (INTERFACE) DÀNH CHO CLIENT ---

  // Thay vì Client phải tự gọi productService, Facade bọc nó lại thành một hàm đơn giản.
  async browseProducts(page: number, sort?: SearchCriteria["sort"], limit?: number): Promise<BrowseResult> {
    return this.productService.browseProducts(page, limit, sort ?? "newest");
  }

  // Tương tự, điều phối request tìm kiếm sang SearchService.
  async searchProducts(criteria: SearchCriteria): Promise<BrowseResult> {
    return this.searchService.search(criteria);
  }

  // Điều phối request lấy chi tiết sang ProductDetailService.
  async getProductDetail(productId: string): Promise<ProductDetail> {
    return this.productDetailService.getDetail(productId);
  }

  /**
   * ĐIỂM SÁNG CỦA KIẾN TRÚC:
   * Khi một Product bị thay đổi (sửa/xóa ở một API khác), gọi hàm này.
   * Facade sẽ báo cho Notifier (Subject). Notifier sẽ tự động báo cho CacheUpdater 
   * và SearchIndexUpdater chạy ngầm. ProductService không hề bị phình to vì phải 
   * chứa code xóa cache hay update elasticsearch.
   */
  notifyProductChanged(productId: string, event: ProductChangedEvent["event"]): void {
    this.notifier.notify({
      productId,
      event,
      changedAt: new Date().toISOString(),
    });
  }
}

// Xuất ra một instance duy nhất (giống kiểu Singleton đơn giản) 
// để mọi Route/Controller trong app đều dùng chung một bộ Facade này.
export const productFacade = new ProductFacade();