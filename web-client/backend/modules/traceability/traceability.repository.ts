import { supabaseServer } from "../../core/supabase";

type RelObj = Record<string, unknown> | Record<string, unknown>[] | null;

export type BatchRow = {
  batch_id: string;
  product_id: string;
  supplier_id: string;
  harvest_date: string;
  expire_date: string;
};

export type ProductRow = {
  product_id: string;
  name: string;
  status: "active" | "inactive";
};

export type SupplierRow = {
  supplier_id: string;
  name: string;
  address: string;
  certificate: string | null;
};

export class TraceabilityRepository {
  async findBatchById(batchId: string): Promise<BatchRow | null> {
    const { data, error } = await supabaseServer
      .from("batches")
      .select("batch_id,product_id,supplier_id,harvest_date,expire_date")
      .eq("batch_id", batchId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as BatchRow | null) ?? null;
  }

  async findProductById(productId: string): Promise<ProductRow | null> {
    const { data, error } = await supabaseServer
      .from("products")
      .select("product_id,name,status")
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as ProductRow | null) ?? null;
  }

  async findSupplierById(supplierId: string): Promise<SupplierRow | null> {
    const { data, error } = await supabaseServer
      .from("suppliers")
      .select("supplier_id,name,address,certificate")
      .eq("supplier_id", supplierId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as SupplierRow | null) ?? null;
  }
}

export function readRelValue<T = string>(rel: RelObj, field: string): T | null {
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
