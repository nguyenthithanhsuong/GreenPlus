import { createServiceRoleSupabaseClient } from "../../core/supabase";
import { CategoryRow, CreateCategoryInput, UpdateCategoryInput } from "./category-management.types";

type CategoryDbRow = {
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

type ProductCategoryRow = {
  category_id: string | null;
};

export class CategoryManagementRepository {
  private readonly supabase = createServiceRoleSupabaseClient();

  async listCategories(): Promise<CategoryRow[]> {
    const { data: categoryRows, error: categoryError } = await this.supabase
      .from("categories")
      .select("category_id,name,description,image_url,created_at")
      .order("name", { ascending: true });

    if (categoryError) {
      throw new Error(categoryError.message);
    }

    const { data: productRows, error: productError } = await this.supabase
      .from("products")
      .select("category_id");

    if (productError) {
      throw new Error(productError.message);
    }

    const productCounts = new Map<string, number>();
    for (const row of (productRows ?? []) as ProductCategoryRow[]) {
      if (!row.category_id) {
        continue;
      }

      productCounts.set(row.category_id, (productCounts.get(row.category_id) ?? 0) + 1);
    }

    return ((categoryRows ?? []) as CategoryDbRow[]).map((category) => ({
      category_id: category.category_id,
      name: category.name,
      description: category.description,
      image_url: category.image_url,
      created_at: category.created_at,
      product_count: productCounts.get(category.category_id) ?? 0,
    }));
  }

  async findById(categoryId: string): Promise<CategoryRow | null> {
    const categories = await this.listCategories();
    return categories.find((category) => category.category_id === categoryId) ?? null;
  }

  async findByName(name: string): Promise<CategoryRow | null> {
    const normalized = name.trim().toLowerCase();
    const categories = await this.listCategories();
    return categories.find((category) => category.name.trim().toLowerCase() === normalized) ?? null;
  }

  async createCategory(input: CreateCategoryInput): Promise<CategoryRow> {
    const { data, error } = await this.supabase
      .from("categories")
      .insert({
        name: input.name,
        description: input.description?.trim() || null,
        image_url: input.imageUrl?.trim() || null,
      })
      .select("category_id,name,description,image_url,created_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      category_id: data.category_id,
      name: data.name,
      description: data.description,
      image_url: data.image_url,
      created_at: data.created_at,
      product_count: 0,
    };
  }

  async updateCategory(input: UpdateCategoryInput): Promise<CategoryRow | null> {
    const payload: Record<string, string | null> = {};

    if (typeof input.name !== "undefined") payload.name = input.name.trim();
    if (typeof input.description !== "undefined") payload.description = input.description?.trim() || null;
    if (typeof input.imageUrl !== "undefined") payload.image_url = input.imageUrl?.trim() || null;

    const { data, error } = await this.supabase
      .from("categories")
      .update(payload)
      .eq("category_id", input.categoryId)
      .select("category_id,name,description,image_url,created_at")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return this.findById(data.category_id);
  }

  async deleteCategory(categoryId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("categories")
      .delete()
      .eq("category_id", categoryId)
      .select("category_id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data?.category_id);
  }
}
