export type CategoryRow = {
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  product_count: number;
};

export type CreateCategoryInput = {
  name: string;
  description?: string;
  imageUrl?: string;
};

export type UpdateCategoryInput = {
  categoryId: string;
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
};
