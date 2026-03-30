export type ProductStatus = "active" | "inactive";

export type BatchStatus = "available" | "expired" | "sold_out";

export type ProductSort = "price_asc" | "price_desc" | "newest";

export type SearchCriteria = {
  keyword?: string;
  categoryId?: string;
  certification?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  page?: number;
  limit?: number;
};

export type ProductBrowseItem = {
  productId: string;
  name: string;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  supplierId: string | null;
  certification: string | null;
  price: number | null;
  isAvailable: boolean;
  createdAt: string;
};

export type ProductDetail = {
  productId: string;
  name: string;
  description: string | null;
  images: string[];
  availablePrice: number | null;
  category: {
    id: string | null;
    name: string | null;
  };
  inventory: {
    status: "in_stock" | "out_of_stock" | "expired";
    totalAvailable: number;
    totalReserved: number;
    hasSellableBatch: boolean;
  };
  supplier: {
    id: string | null;
    certification: string | null;
  };
};

export type BrowseResult = {
  page: number;
  limit: number;
  total: number;
  items: ProductBrowseItem[];
};

export type ProductChangedEvent = {
  productId: string;
  event: "price.changed" | "inventory.changed" | "product.updated";
  changedAt: string;
};
