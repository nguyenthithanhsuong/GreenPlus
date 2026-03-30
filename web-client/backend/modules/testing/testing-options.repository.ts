import { supabaseServer } from "../../core/supabase";

export type UserOption = {
  user_id: string;
  name: string;
  email: string;
};

export type ProductOption = {
  product_id: string;
  name: string;
};

export type CategoryOption = {
  category_id: string;
  name: string;
};

export type BatchOption = {
  batch_id: string;
  product_id: string;
};

export class TestingOptionsRepository {
  async listUsers(limit = 100): Promise<UserOption[]> {
    const { data, error } = await supabaseServer
      .from("users")
      .select("user_id,name,email")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as UserOption[]).map((row) => ({
      user_id: String(row.user_id),
      name: String(row.name ?? "Unknown"),
      email: String(row.email ?? ""),
    }));
  }

  async listProducts(limit = 200): Promise<ProductOption[]> {
    const { data, error } = await supabaseServer
      .from("products")
      .select("product_id,name")
      .eq("status", "active")
      .order("name", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as ProductOption[]).map((row) => ({
      product_id: String(row.product_id),
      name: String(row.name ?? "Unknown"),
    }));
  }

  async listCategories(limit = 200): Promise<CategoryOption[]> {
    const { data, error } = await supabaseServer
      .from("categories")
      .select("category_id,name")
      .order("name", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as CategoryOption[]).map((row) => ({
      category_id: String(row.category_id),
      name: String(row.name ?? "Unknown"),
    }));
  }

  async listBatches(limit = 500): Promise<BatchOption[]> {
    const { data, error } = await supabaseServer
      .from("batches")
      .select("batch_id,product_id")
      .order("harvest_date", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as BatchOption[]).map((row) => ({
      batch_id: String(row.batch_id),
      product_id: String(row.product_id),
    }));
  }
}
