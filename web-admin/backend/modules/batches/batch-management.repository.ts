import { createServiceRoleSupabaseClient } from "../../core/supabase";
import { BatchRow, BatchStatus, CreateBatchInput, UpdateBatchInput } from "./batch-management.types";

type BatchDbRow = {
  batch_id: string;
  product_id: string;
  supplier_id: string;
  harvest_date: string;
  expire_date: string;
  quantity: number;
  qr_code: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  products?: {
    name?: string | null;
  } | null;
  suppliers?: {
    name?: string | null;
  } | null;
};

type IdRow = {
  product_id?: string;
  supplier_id?: string;
};

type InventoryIdRow = {
  inventory_id?: string;
};

export class BatchManagementRepository {
  private readonly supabase = createServiceRoleSupabaseClient();

  async listBatches(): Promise<BatchRow[]> {
    const { data, error } = await this.supabase
      .from("batches")
      .select("batch_id,product_id,supplier_id,harvest_date,expire_date,quantity,qr_code,status,created_at,updated_at,products(name),suppliers(name)")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as BatchDbRow[]).map((batch) => this.toRow(batch));
  }

  async findById(batchId: string): Promise<BatchRow | null> {
    const { data, error } = await this.supabase
      .from("batches")
      .select("batch_id,product_id,supplier_id,harvest_date,expire_date,quantity,qr_code,status,created_at,updated_at,products(name),suppliers(name)")
      .eq("batch_id", batchId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.toRow(data as BatchDbRow) : null;
  }

  async findProductById(productId: string): Promise<boolean> {
    const { data, error } = await this.supabase.from("products").select("product_id").eq("product_id", productId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean((data as IdRow | null)?.product_id);
  }

  async findSupplierById(supplierId: string): Promise<boolean> {
    const { data, error } = await this.supabase.from("suppliers").select("supplier_id").eq("supplier_id", supplierId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean((data as IdRow | null)?.supplier_id);
  }

  async createBatch(input: CreateBatchInput & { status: BatchStatus }): Promise<BatchRow> {
    const { data, error } = await this.supabase
      .from("batches")
      .insert({
        product_id: input.productId,
        supplier_id: input.supplierId,
        harvest_date: input.harvestDate,
        expire_date: input.expireDate,
        quantity: input.quantity,
        qr_code: input.qrCode?.trim() || null,
        status: input.status,
      })
      .select("batch_id,product_id,supplier_id,harvest_date,expire_date,quantity,qr_code,status,created_at,updated_at,products(name),suppliers(name)")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.toRow(data as BatchDbRow);
  }

  async updateBatch(input: UpdateBatchInput): Promise<BatchRow | null> {
    const payload: Record<string, string | number | null> = {};

    if (typeof input.productId !== "undefined") payload.product_id = input.productId;
    if (typeof input.supplierId !== "undefined") payload.supplier_id = input.supplierId;
    if (typeof input.harvestDate !== "undefined") payload.harvest_date = input.harvestDate;
    if (typeof input.expireDate !== "undefined") payload.expire_date = input.expireDate;
    if (typeof input.quantity !== "undefined") payload.quantity = input.quantity;
    if (typeof input.qrCode !== "undefined") payload.qr_code = input.qrCode?.trim() || null;
    if (typeof input.status !== "undefined") payload.status = input.status;

    const { data, error } = await this.supabase
      .from("batches")
      .update(payload)
      .eq("batch_id", input.batchId)
      .select("batch_id,product_id,supplier_id,harvest_date,expire_date,quantity,qr_code,status,created_at,updated_at,products(name),suppliers(name)")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.toRow(data as BatchDbRow) : null;
  }

  async deleteBatch(batchId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("batches")
      .delete()
      .eq("batch_id", batchId)
      .select("batch_id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean((data as { batch_id?: string } | null)?.batch_id);
  }

  async hasInventoryByBatchId(batchId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("inventory")
      .select("inventory_id")
      .eq("batch_id", batchId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean((data as InventoryIdRow | null)?.inventory_id);
  }

  async createInventoryForBatch(input: { batchId: string; quantityAvailable: number }): Promise<void> {
    const { error } = await this.supabase
      .from("inventory")
      .insert({
        batch_id: input.batchId,
        quantity_available: input.quantityAvailable,
        quantity_reserved: 0,
        last_updated: new Date().toISOString(),
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  async createInventoryInitializationTransaction(input: {
    batchId: string;
    quantity: number;
    note?: string;
  }): Promise<void> {
    const { error } = await this.supabase
      .from("inventory_transactions")
      .insert({
        batch_id: input.batchId,
        type: "adjustment",
        quantity: input.quantity,
        note: input.note?.trim() || "Init inventory when batch moved from pending to available",
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  private toRow(batch: BatchDbRow): BatchRow {
    const normalizedStatus: BatchStatus =
      batch.status === "pending" || batch.status === "available" || batch.status === "expired" || batch.status === "sold_out"
        ? batch.status
        : "available";

    return {
      batch_id: batch.batch_id,
      product_id: batch.product_id,
      product_name: batch.products?.name ?? null,
      supplier_id: batch.supplier_id,
      supplier_name: batch.suppliers?.name ?? null,
      harvest_date: batch.harvest_date,
      expire_date: batch.expire_date,
      quantity: batch.quantity,
      qr_code: batch.qr_code,
      status: normalizedStatus,
      created_at: batch.created_at,
      updated_at: batch.updated_at,
    };
  }
}