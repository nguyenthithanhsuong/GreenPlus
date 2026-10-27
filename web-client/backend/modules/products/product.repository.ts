import { isSellableBatch } from "./product-stock";
import { supabaseServer } from "../../core/supabase";
import { BatchStatus, ProductStatus } from "./product.types";

type RelObj = Record<string, unknown> | Record<string, unknown>[] | null;

export type ProductRow = {
  product_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  nutrition: string | null;
  unit: string;
  image_url: string | null;
  status: ProductStatus;
  created_at: string;
  categories: RelObj;
};

type ProductSupplierRow = {
  product_id: string;
  supplier_id: string | null;
  harvest_date: string;
  suppliers: RelObj;
};

export type ProductBatchRow = {
  batch_id: string;
  status: BatchStatus | null;
  expire_date: string;
  quantity: number;
  inventory: RelObj;
};

export class ProductRepository {
  async listActiveProducts(storeId: string): Promise<ProductRow[]> {
    const { data, error } = await supabaseServer
      .from("products")
      .select(
        "product_id,category_id,name,description,nutrition,unit,image_url,status,created_at,categories(name)",
      )
      .eq("status", "active")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as ProductRow[];
  }

  async getProductById(
    productId: string,
    storeId: string,
  ): Promise<ProductRow | null> {
    const { data, error } = await supabaseServer
      .from("products")
      .select(
        "product_id,category_id,name,description,nutrition,unit,image_url,status,created_at,categories(name)",
      )
      .eq("product_id", productId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as ProductRow | null) ?? null;
  }

  /** Sellable stock in this store only; never include expired or sold-out batches. */
  async getSellableStockMap(
    productIds: string[],
    storeId: string,
  ): Promise<Map<string, number>> {
    if (productIds.length === 0) return new Map();

    const result = new Map<string, number>();
    // Same embedded inventory source and store filter as the product-detail API.
    // Paging avoids silently treating products beyond PostgREST's row cap as sold out.
    for (let i = 0; i < productIds.length; i += 50) {
      const chunk = productIds.slice(i, i + 50);
      let offset = 0;
      while (true) {
        const { data, error } = await supabaseServer
          .from("batches")
          .select("product_id,status,expire_date,inventory(quantity_available)")
          .in("product_id", chunk)
          .eq("store_id", storeId)
          .eq("inventory.store_id", storeId)
          .range(offset, offset + 999);
        if (error) throw new Error(error.message);

        const batches = data ?? [];
        for (const batch of batches) {
          const productId = batch.product_id ? String(batch.product_id) : "";
          if (!productId) continue;
          const entries = Array.isArray(batch.inventory)
            ? batch.inventory
            : batch.inventory ? [batch.inventory] : [];
          const available = entries.reduce((total: number, row) => {
            const quantity = Number(row.quantity_available ?? 0);
            return total + (Number.isFinite(quantity) ? Math.max(0, quantity) : 0);
          }, 0);
          if (!isSellableBatch(batch.status, batch.expire_date, available)) continue;
          result.set(productId, (result.get(productId) ?? 0) + available);
        }
        if (batches.length < 1000) break;
        offset += 1000;
      }
    }
    return result;
  }

  async getLatestPriceMap(
    productIds: string[],
    storeId: string,
  ): Promise<Map<string, number>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const { data: batchData, error: batchError } = await supabaseServer
      .from("batches")
      .select("batch_id,product_id")
      .in("product_id", productIds)
      .eq("store_id", storeId);

    if (batchError) {
      throw new Error(batchError.message);
    }

    const batchToProductMap = new Map<string, string>();
    const batchIds = Array.from(
      new Set(
        (batchData ?? [])
          .map((row) => {
            const batchId = String(row.batch_id);
            const productId = row.product_id ? String(row.product_id) : "";
            if (!productId) {
              return "";
            }

            batchToProductMap.set(batchId, productId);
            return batchId;
          })
          .filter(Boolean),
      ),
    );

    if (batchIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabaseServer
      .from("prices")
      .select("batch_id,price,date")
      .in("batch_id", batchIds)
      .eq("store_id", storeId)
      .order("date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const priceMap = new Map<string, number>();

    (data ?? []).forEach((row) => {
      const productId = batchToProductMap.get(String(row.batch_id));
      if (!productId) {
        return;
      }

      if (!priceMap.has(productId)) {
        priceMap.set(productId, Number(row.price));
      }
    });

    return priceMap;
  }

  async getProductSupplierMap(
    productIds: string[],
    storeId: string,
  ): Promise<
    Map<string, { supplierId: string | null; certification: string | null }>
  > {
    if (productIds.length === 0) {
      return new Map();
    }

    const { data, error } = await supabaseServer
      .from("batches")
      .select("product_id,supplier_id,harvest_date,suppliers(certificate)")
      .in("product_id", productIds)
      .eq("store_id", storeId)
      .order("harvest_date", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const supplierMap = new Map<
      string,
      { supplierId: string | null; certification: string | null }
    >();

    (data ?? []).forEach((row) => {
      const productId = row.product_id ? String(row.product_id) : "";
      if (!productId) {
        return;
      }

      if (supplierMap.has(productId)) {
        return;
      }

      const supplierRow = row as ProductSupplierRow;
      supplierMap.set(productId, {
        supplierId: supplierRow.supplier_id
          ? String(supplierRow.supplier_id)
          : null,
        certification: getRelationValue<string>(
          supplierRow.suppliers,
          "certificate",
        ),
      });
    });

    return supplierMap;
  }

  async getLatestPriceForProduct(
    productId: string,
    storeId: string,
  ): Promise<number | null> {
    const priceMap = await this.getLatestPriceMap([productId], storeId);
    return priceMap.get(productId) ?? null;
  }

  async getBatchesWithInventoryByProduct(
    productId: string,
    storeId: string,
  ): Promise<ProductBatchRow[]> {
    const { data, error } = await supabaseServer
      .from("batches")
      .select(
        "batch_id,status,expire_date,quantity,inventory(quantity_available,quantity_reserved)",
      )
      .eq("product_id", productId)
      .eq("store_id", storeId)
      .eq("inventory.store_id", storeId);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as ProductBatchRow[];
  }
}

export function getRelationValue<T = string>(
  rel: RelObj,
  field: string,
): T | null {
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
