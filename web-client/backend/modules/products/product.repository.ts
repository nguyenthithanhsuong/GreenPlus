import { supabaseServer } from "../../core/supabase";
import { BatchStatus, ProductStatus } from "./product.types";

type RelObj = Record<string, unknown> | Record<string, unknown>[] | null;

export type ProductRow = {
  product_id: string;
  category_id: string | null;
  supplier_id: string | null;
  name: string;
  description: string | null;
  unit: string;
  image_url: string | null;
  status: ProductStatus;
  created_at: string;
  categories: RelObj;
  suppliers: RelObj;
};

export type ProductBatchRow = {
  batch_id: string;
  status: BatchStatus;
  expire_date: string;
  quantity: number;
  inventory: RelObj;
};

export class ProductRepository {
  async listActiveProducts(): Promise<ProductRow[]> {
    const { data, error } = await supabaseServer
      .from("products")
      .select(
        "product_id,category_id,supplier_id,name,description,unit,image_url,status,created_at,categories(name),suppliers(certificate)"
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as ProductRow[];
  }

  async getProductById(productId: string): Promise<ProductRow | null> {
    const { data, error } = await supabaseServer
      .from("products")
      .select(
        "product_id,category_id,supplier_id,name,description,unit,image_url,status,created_at,categories(name),suppliers(certificate)"
      )
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as ProductRow | null) ?? null;
  }

  async getLatestPriceMap(productIds: string[]): Promise<Map<string, number>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabaseServer
      .from("prices")
      .select("product_id,price,date")
      .in("product_id", productIds)
      .order("date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const priceMap = new Map<string, number>();

    (data ?? []).forEach((row) => {
      const productId = String(row.product_id);
      // Du lieu da sort giam dan theo ngay, ghi lan dau tien se la gia moi nhat.
      if (!priceMap.has(productId)) {
        priceMap.set(productId, Number(row.price));
      }
    });

    return priceMap;
  }

  async getLatestPriceForProduct(productId: string): Promise<number | null> {
    const priceMap = await this.getLatestPriceMap([productId]);
    return priceMap.get(productId) ?? null;
  }

  async getBatchesWithInventoryByProduct(productId: string): Promise<ProductBatchRow[]> {
    const { data, error } = await supabaseServer
      .from("batches")
      .select("batch_id,status,expire_date,quantity,inventory(quantity_available,quantity_reserved)")
      .eq("product_id", productId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as ProductBatchRow[];
  }
}

// Ho tro doc relation an toan cho ca 2 truong hop: object don hoac mang object tu Supabase.
export function getRelationValue<T = string>(rel: RelObj, field: string): T | null {
  if (!rel) {
    return null;
  }

  if (Array.isArray(rel)) {
    const first = rel[0];
    if (!first) {
      return null;
    }

    return (first[field] as T) ?? null;
  }

  return (rel[field] as T) ?? null;
}
