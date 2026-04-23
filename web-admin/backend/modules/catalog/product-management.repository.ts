import { createServiceRoleSupabaseClient } from "../../core/supabase";
import { CreateProductInput, ProductRow, ProductStatus, UpdateProductInput } from "./product-management.types";

type ProductDbRow = {
  product_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  unit: string;
  image_url: string | null;
  status: string;
  created_at: string;
  nutrition: string | null;
  categories?: {
    name?: string | null;
  } | null;
};

export class ProductManagementRepository {
  private readonly supabase = createServiceRoleSupabaseClient();

  async listProducts(): Promise<ProductRow[]> {
    const { data, error } = await this.supabase
      .from("products")
      .select("product_id,category_id,name,description,unit,image_url,status,created_at,nutrition,categories(name)")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as ProductDbRow[]).map((product) => this.toRow(product));
  }

  async findById(productId: string): Promise<ProductRow | null> {
    const { data, error } = await this.supabase
      .from("products")
      .select("product_id,category_id,name,description,unit,image_url,status,created_at,nutrition,categories(name)")
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.toRow(data as ProductDbRow) : null;
  }

  async createProduct(input: CreateProductInput & { status: ProductStatus }): Promise<ProductRow> {
    const { data, error } = await this.supabase
      .from("products")
      .insert({
        category_id: input.categoryId ?? null,
        name: input.name,
        description: input.description?.trim() || null,
        unit: input.unit,
        image_url: input.imageUrl?.trim() || null,
        nutrition: input.nutrition?.trim() || null,
        status: input.status,
      })
      .select("product_id,category_id,name,description,unit,image_url,status,created_at,nutrition,categories(name)")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.toRow(data as ProductDbRow);
  }

  async updateProduct(input: UpdateProductInput): Promise<ProductRow | null> {
    const payload: Record<string, string | null> = {};

    if (typeof input.categoryId !== "undefined") payload.category_id = input.categoryId;
    if (typeof input.name !== "undefined") payload.name = input.name.trim();
    if (typeof input.description !== "undefined") payload.description = input.description?.trim() || null;
    if (typeof input.unit !== "undefined") payload.unit = input.unit.trim();
    if (typeof input.imageUrl !== "undefined") payload.image_url = input.imageUrl?.trim() || null;
    if (typeof input.nutrition !== "undefined") payload.nutrition = input.nutrition?.trim() || null;
    if (typeof input.status !== "undefined") payload.status = input.status;

    const { data, error } = await this.supabase
      .from("products")
      .update(payload)
      .eq("product_id", input.productId)
      .select("product_id,category_id,name,description,unit,image_url,status,created_at,nutrition,categories(name)")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.toRow(data as ProductDbRow) : null;
  }

  async deleteProduct(productId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("products")
      .delete()
      .eq("product_id", productId)
      .select("product_id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data?.product_id);
  }

  private toRow(product: ProductDbRow): ProductRow {
    return {
      product_id: product.product_id,
      category_id: product.category_id,
      category_name: product.categories?.name ?? null,
      name: product.name,
      description: product.description,
      unit: product.unit,
      image_url: product.image_url,
      status: product.status === "inactive" ? "inactive" : "active",
      created_at: product.created_at,
      nutrition: product.nutrition,
    };
  }
}
