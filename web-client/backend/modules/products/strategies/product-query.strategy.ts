import { ProductBrowseItem, ProductSort, SearchCriteria } from "../product.types";

/**
 * PHẦN 1: STRATEGY CHO BỘ LỌC (FILTER)
 */

/**
 * [STRATEGY INTERFACE - Giao diện Chiến lược Lọc]
 * Hợp đồng chung cho mọi bộ lọc. Bất kỳ bộ lọc nào cũng phải nhận vào 
 * danh sách sản phẩm (items) + tiêu chí (criteria), và trả về danh sách đã lọc.
 */
export interface ProductFilterStrategy {
  apply(items: ProductBrowseItem[], criteria: SearchCriteria): ProductBrowseItem[];
}

/**
 * [CONCRETE STRATEGY 1 - Chiến lược lọc theo Tên]
 * Chỉ quan tâm đến `keyword`. Nếu không có keyword, nó bỏ qua và trả về mảng gốc.
 */
export class NameFilterStrategy implements ProductFilterStrategy {
  apply(items: ProductBrowseItem[], criteria: SearchCriteria): ProductBrowseItem[] {
    const keyword = criteria.keyword?.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => item.name.toLowerCase().includes(keyword));
  }
}

/**
 * [CONCRETE STRATEGY 2 - Chiến lược lọc theo Danh mục]
 */
export class CategoryFilterStrategy implements ProductFilterStrategy {
  apply(items: ProductBrowseItem[], criteria: SearchCriteria): ProductBrowseItem[] {
    if (!criteria.categoryId) return items;
    return items.filter((item) => item.categoryId === criteria.categoryId);
  }
}

/**
 * [CONCRETE STRATEGY 3 & 4 - Chứng chỉ và Giá]
 * Tương tự, mỗi class tự lo logic nghiệp vụ phức tạp của riêng nó (như xử lý giá min/max, 
 * loại bỏ sản phẩm không có giá, v.v.) mà không làm phiền đến các class khác.
 */
export class CertificationFilterStrategy implements ProductFilterStrategy {
  apply(items: ProductBrowseItem[], criteria: SearchCriteria): ProductBrowseItem[] {
    const certification = criteria.certification?.trim().toLowerCase();
    if (!certification) return items;
    return items.filter((item) => (item.certification ?? "").toLowerCase() === certification);
  }
}

export class PriceRangeFilterStrategy implements ProductFilterStrategy {
  apply(items: ProductBrowseItem[], criteria: SearchCriteria): ProductBrowseItem[] {
    const minPrice = criteria.minPrice;
    const maxPrice = criteria.maxPrice;

    if (typeof minPrice !== "number" && typeof maxPrice !== "number") return items;

    return items.filter((item) => {
      if (item.price === null) return false;
      if (typeof minPrice === "number" && item.price < minPrice) return false;
      if (typeof maxPrice === "number" && item.price > maxPrice) return false;
      return true;
    });
  }
}


/**
 * PHẦN 2: STRATEGY CHO SẮP XẾP (SORT)
 */

/**
 * [STRATEGY INTERFACE - Giao diện Chiến lược Sắp xếp]
 * Chỉ nhận vào mảng và trả về mảng đã sắp xếp. Đơn giản, rõ ràng.
 */
export interface ProductSortStrategy {
  apply(items: ProductBrowseItem[]): ProductBrowseItem[];
}

/**
 * [CONCRETE STRATEGIES - Các thuật toán sắp xếp cụ thể]
 * Mỗi class đóng gói một thuật toán sort khác nhau (Mới nhất, Giá tăng, Giá giảm).
 * Việc clone mảng `[...items]` giúp tránh side-effect (thay đổi mảng gốc).
 */
class NewestSortStrategy implements ProductSortStrategy {
  apply(items: ProductBrowseItem[]): ProductBrowseItem[] {
    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

class PriceAscendingSortStrategy implements ProductSortStrategy {
  apply(items: ProductBrowseItem[]): ProductBrowseItem[] {
    return [...items].sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY));
  }
}

class PriceDescendingSortStrategy implements ProductSortStrategy {
  apply(items: ProductBrowseItem[]): ProductBrowseItem[] {
    return [...items].sort((a, b) => (b.price ?? Number.NEGATIVE_INFINITY) - (a.price ?? Number.NEGATIVE_INFINITY));
  }
}

/**
 * [STRATEGY SELECTOR / FACTORY]
 * Hàm này quyết định xem thuật toán nào sẽ được chọn lúc Runtime dựa vào input của user.
 */
export function createSortStrategy(sort: ProductSort | undefined): ProductSortStrategy {
  switch (sort) {
    case "price_asc": return new PriceAscendingSortStrategy();
    case "price_desc": return new PriceDescendingSortStrategy();
    case "newest":
    default: return new NewestSortStrategy();
  }
}