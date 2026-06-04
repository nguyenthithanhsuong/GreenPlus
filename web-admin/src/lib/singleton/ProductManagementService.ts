import type {
  CategoryRow,
  ProductRow,
  ProductStatus,
} from "../../../backend/modules/catalog/product-management.types";
import { UrlBuilder, UrlDirector } from "../builder";
import apiService from "./ApiService";

export type ProductListResponse = {
  items?: ProductRow[];
};

export type CategoryListResponse = {
  items?: CategoryRow[];
};

export type ProductMutationPayload = {
  categoryId: string | null;
  name: string;
  description: string;
  unit: string;
  imageUrl: string;
  nutrition: string;
  status: ProductStatus;
};

export type ImageUploadResponse = {
  publicUrl?: string;
};

class ProductManagementService {
  getProducts(): Promise<ProductListResponse> {
    return apiService.get<ProductListResponse>("/api/products");
  }

  getCategories(): Promise<CategoryListResponse> {
    return apiService.get<CategoryListResponse>("/api/categories");
  }

  saveProduct(
    productId: string | null,
    payload: ProductMutationPayload,
  ): Promise<unknown> {
    if (productId) {
      return apiService.put(
        UrlDirector.create("/api/products").segment(productId).build(),
        payload,
      );
    }

    return apiService.post("/api/products", payload);
  }

  deleteProduct(productId: string): Promise<unknown> {
    return apiService.delete(
      UrlDirector.create("/api/products").segment(productId).build(),
    );
  }

  updateStatus(productId: string, status: ProductStatus): Promise<unknown> {
    return apiService.patch(
      UrlDirector.create("/api/products").segment(productId).build(),
      { status },
    );
  }

  uploadImage(file: File): Promise<ImageUploadResponse> {
    const body = new FormData();
    body.append("file", file);

    return apiService.upload<ImageUploadResponse>("/api/products/image", body);
  }
}

const productManagementService = new ProductManagementService();

export default productManagementService;
