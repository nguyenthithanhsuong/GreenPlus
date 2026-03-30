import { ProductChangedEvent } from "../product.types";

/**
 * [OBSERVER INTERFACE - Người lắng nghe]
 * Bất kỳ class nào muốn nhận thông báo khi có sản phẩm thay đổi
 * thì bắt buộc phải implements interface này và viết code cho hàm `update()`.
 */
export interface ProductObserver {
  update(event: ProductChangedEvent): void;
}

/**
 * [SUBJECT INTERFACE - Đài phát thanh]
 * Giao diện chuẩn mực của một Subject. Nó phải có 3 chức năng cốt lõi:
 * 1. attach: Thêm một người nghe (đăng ký).
 * 2. detach: Xóa một người nghe (hủy đăng ký).
 * 3. notify: Phát thông báo cho toàn bộ người nghe.
 */
export interface ProductSubject {
  attach(observer: ProductObserver): void;
  detach(observer: ProductObserver): void;
  notify(event: ProductChangedEvent): void;
}

/**
 * [CONCRETE SUBJECT - Trạm phát sóng thực tế]
 * Lớp này quản lý danh sách các Observers và bắn thông báo cho chúng.
 */
export class ProductChangeNotifier implements ProductSubject {
  // Dùng `Set` thay vì mảng `Array` để đảm bảo mỗi observer chỉ được đăng ký 1 lần (không bị trùng lặp).
  private observers = new Set<ProductObserver>();

  attach(observer: ProductObserver): void {
    this.observers.add(observer);
  }

  detach(observer: ProductObserver): void {
    this.observers.delete(observer);
  }

  notify(event: ProductChangedEvent): void {
    // Kịch bản Fan-out: 1 sự kiện nổ ra, lặp qua danh sách và báo cho N người nghe.
    // Các observer sẽ tự động chạy hàm update() của riêng chúng với cùng 1 data (event).
    this.observers.forEach((observer) => observer.update(event));
  }
}

/**
 * [CONCRETE OBSERVER 1 - Người nghe số 1: Xử lý Cache]
 * Nhiệm vụ duy nhất của nó là hóng sự kiện ProductChangedEvent 
 * để đi đánh dấu các Product ID cần xóa/cập nhật Cache (VD: Redis).
 */
export class CacheUpdaterObserver implements ProductObserver {
  private recentlyTouchedProductIds = new Set<string>();

  // Hàm này sẽ tự động được Subject gọi khi có biến.
  update(event: ProductChangedEvent): void {
    this.recentlyTouchedProductIds.add(event.productId);
    // Trong thực tế, ở đây bạn sẽ gọi: redisClient.del(`product:${event.productId}`)
  }

  getTouchedProductIds(): string[] {
    return Array.from(this.recentlyTouchedProductIds);
  }
}

/**
 * [CONCRETE OBSERVER 2 - Người nghe số 2: Xử lý Search Index]
 * Nhiệm vụ duy nhất của nó là hóng sự kiện để đồng bộ dữ liệu
 * sang engine tìm kiếm (VD: Elasticsearch hoặc Algolia).
 * Việc thêm Observer mới này KHÔNG hề đụng chạm gì đến logic của file Service hay Facade cũ.
 */
export class SearchIndexUpdaterObserver implements ProductObserver {
  private updatedIndexProductIds = new Set<string>();

  update(event: ProductChangedEvent): void {
    this.updatedIndexProductIds.add(event.productId);
    // Trong thực tế, ở đây bạn sẽ gọi: elasticsearchClient.update({ id: event.productId, ... })
  }

  getUpdatedProductIds(): string[] {
    return Array.from(this.updatedIndexProductIds);
  }
}