export type ProductStatus = "active" | "inactive";

export type ProductRow = {
  product_id: string;
  category_id: string | null;
  category_name: string | null;
  name: string;
  description: string | null;
  unit: string;
  image_url: string | null;
  status: ProductStatus;
  created_at: string;
  nutrition: string | null;
};

export type CategoryRow = {
  category_id: string;
  name: string;
  description: string | null;
  created_at: string;
  product_count: number;
};

export type CreateProductInput = {
  categoryId?: string | null;
  name: string;
  description?: string;
  unit: string;
  imageUrl?: string;
  nutrition?: string;
  status?: ProductStatus;
};

export type UpdateProductInput = {
  productId: string;
  categoryId?: string | null;
  name?: string;
  description?: string | null;
  unit?: string;
  imageUrl?: string | null;
  nutrition?: string | null;
  status?: ProductStatus;
};
