import apiService from "./ApiService";

export interface ProductBrowseItem {
  productId: string;
  name: string;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  price: number | null;
  isAvailable: boolean;
}

export interface ProductsResponse {
  page: number;
  limit: number;
  total: number;
  items: ProductBrowseItem[];
}

export interface ProductDetailData {
  productId: string;
  name: string;
  description: string | null;
  nutrition: string | null;
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
    totalQuantity: number;
  };
  batches: Array<{
    batchId: string;
    status: "available" | "expired" | "sold_out";
    expireDate: string;
    quantity: number;
    available: number;
    reserved: number;
    isSellable: boolean;
  }>;
  supplier: {
    id: string | null;
    certification: string | null;
  };
}

export interface ReviewItem {
  reviewId: string;
  userId: string;
  userName: string;
  userImageUrl: string | null;
  productId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ReviewsResponse {
  total: number;
  items: ReviewItem[];
}

class ProductService {
  private static instance: ProductService;

  private constructor() {}

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  async getProductDetail(productId: string): Promise<ProductDetailData> {
    return apiService.get<ProductDetailData>(
      `/api/products/${encodeURIComponent(productId)}`,
    );
  }

  async getProducts(params: {
    categoryId?: string;
    keyword?: string;
    sort?: string;
    limit?: number;
    page?: number;
  }): Promise<ProductsResponse> {
    const query = new URLSearchParams();
    if (params.categoryId) query.append("categoryId", params.categoryId);
    if (params.keyword) query.append("keyword", params.keyword);
    if (params.sort) query.append("sort", params.sort);
    if (params.limit) query.append("limit", String(params.limit));
    if (params.page) query.append("page", String(params.page));

    const response = await apiService.get<Partial<ProductsResponse>>(
      `/api/products?${query.toString()}`,
    );

    return {
      page: response.page ?? params.page ?? 1,
      limit: response.limit ?? params.limit ?? 20,
      total: response.total ?? 0,
      items: Array.isArray(response.items) ? response.items : [],
    };
  }

  async getReviews(productId: string, limit = 10): Promise<ReviewsResponse> {
    const response = await apiService.get<Partial<ReviewsResponse>>(
      `/api/reviews?productId=${encodeURIComponent(productId)}&limit=${limit}`,
    );

    return {
      total: response.total ?? 0,
      items: Array.isArray(response.items) ? response.items : [],
    };
  }
}

export default ProductService.getInstance();
