import { ProductBrowseItem, ProductSort, SearchCriteria } from "../product.types";

export interface ProductFilterStrategy {
  apply(items: ProductBrowseItem[], criteria: SearchCriteria): ProductBrowseItem[];
}

export class NameFilterStrategy implements ProductFilterStrategy {
  apply(items: ProductBrowseItem[], criteria: SearchCriteria): ProductBrowseItem[] {
    const keyword = criteria.keyword?.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => item.name.toLowerCase().includes(keyword));
  }
}

export class CategoryFilterStrategy implements ProductFilterStrategy {
  apply(items: ProductBrowseItem[], criteria: SearchCriteria): ProductBrowseItem[] {
    if (!criteria.categoryId) return items;
    return items.filter((item) => item.categoryId === criteria.categoryId);
  }
}
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

export interface ProductSortStrategy {
  apply(items: ProductBrowseItem[]): ProductBrowseItem[];
}

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

export function createSortStrategy(sort: ProductSort | undefined): ProductSortStrategy {
  switch (sort) {
    case "price_asc": return new PriceAscendingSortStrategy();
    case "price_desc": return new PriceDescendingSortStrategy();
    case "newest":
    default: return new NewestSortStrategy();
  }
}