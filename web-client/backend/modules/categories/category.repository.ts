import { supabaseServer } from "../../core/supabase";
import { CategoryRow } from "./category.types";

export class CategoryRepository {
  async listCategories(): Promise<CategoryRow[]> {
    const { data, error } = await supabaseServer
      .from("categories")
      .select("category_id,name,description,image_url");

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as CategoryRow[]).map((row) => ({
      category_id: String(row.category_id),
      name: String(row.name ?? ""),
      description: row.description ? String(row.description) : null,
      image_url: row.image_url ? String(row.image_url) : null,
    }));
  }
}
