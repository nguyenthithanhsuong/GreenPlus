import { createServiceRoleSupabaseClient } from "../../core/supabase";
import {
  InventoryRow,
  InventoryTransactionRow,
  InventoryTransactionType,
} from "./inventory-management.types";

type InventoryDbRow = {
  inventory_id: string;
  batch_id: string | null;
  quantity_available: number;
  quantity_reserved: number | null;
  last_updated: string | null;
  batches?: {
    batch_id?: string | null;
    status?: string | null;
    products?: {
      name?: string | null;
    } | null;
    suppliers?: {
      name?: string | null;
    } | null;
  } | null;
};

type InventoryTransactionDbRow = {
  transaction_id: string;
  batch_id: string | null;
  type: string;
  quantity: number;
  note: string | null;
  created_at: string | null;
};

export class InventoryManagementRepository {
  private readonly supabase = createServiceRoleSupabaseClient();

  async listInventories(): Promise<InventoryRow[]> {
    const { data, error } = await this.supabase
      .from("inventory")
      .select("inventory_id,batch_id,quantity_available,quantity_reserved,last_updated,batches(batch_id,status,products(name),suppliers(name))")
      .order("last_updated", { ascending: false, nullsFirst: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as InventoryDbRow[]).map((row) => this.toInventoryRow(row));
  }

  async findInventoryById(inventoryId: string): Promise<InventoryRow | null> {
    const { data, error } = await this.supabase
      .from("inventory")
      .select("inventory_id,batch_id,quantity_available,quantity_reserved,last_updated,batches(batch_id,status,products(name),suppliers(name))")
      .eq("inventory_id", inventoryId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.toInventoryRow(data as InventoryDbRow) : null;
  }

  async updateInventory(input: {
    inventoryId: string;
    quantityAvailable: number;
    quantityReserved: number;
    lastUpdated: string;
  }): Promise<InventoryRow | null> {
    const { data, error } = await this.supabase
      .from("inventory")
      .update({
        quantity_available: input.quantityAvailable,
        quantity_reserved: input.quantityReserved,
        last_updated: input.lastUpdated,
      })
      .eq("inventory_id", input.inventoryId)
      .select("inventory_id,batch_id,quantity_available,quantity_reserved,last_updated,batches(batch_id,status,products(name),suppliers(name))")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.toInventoryRow(data as InventoryDbRow) : null;
  }

  async deleteInventory(inventoryId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("inventory")
      .delete()
      .eq("inventory_id", inventoryId)
      .select("inventory_id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean((data as { inventory_id?: string } | null)?.inventory_id);
  }

  async createTransaction(input: {
    batchId: string;
    type: InventoryTransactionType;
    quantity: number;
    note?: string;
  }): Promise<InventoryTransactionRow> {
    const { data, error } = await this.supabase
      .from("inventory_transactions")
      .insert({
        batch_id: input.batchId,
        type: input.type,
        quantity: input.quantity,
        note: input.note?.trim() || null,
      })
      .select("transaction_id,batch_id,type,quantity,note,created_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.toTransactionRow(data as InventoryTransactionDbRow);
  }

  async listTransactionsByBatchId(batchId: string): Promise<InventoryTransactionRow[]> {
    const { data, error } = await this.supabase
      .from("inventory_transactions")
      .select("transaction_id,batch_id,type,quantity,note,created_at")
      .eq("batch_id", batchId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as InventoryTransactionDbRow[]).map((row) => this.toTransactionRow(row));
  }

  private toInventoryRow(row: InventoryDbRow): InventoryRow {
    return {
      inventory_id: row.inventory_id,
      batch_id: row.batch_id,
      product_name: row.batches?.products?.name ?? null,
      supplier_name: row.batches?.suppliers?.name ?? null,
      batch_status: row.batches?.status ?? null,
      quantity_available: row.quantity_available,
      quantity_reserved: row.quantity_reserved ?? 0,
      last_updated: row.last_updated,
    };
  }

  private toTransactionRow(row: InventoryTransactionDbRow): InventoryTransactionRow {
    const normalizedType: InventoryTransactionType =
      row.type === "stock_in" || row.type === "stock_out" || row.type === "adjustment"
        ? row.type
        : "adjustment";

    return {
      transaction_id: row.transaction_id,
      batch_id: row.batch_id,
      type: normalizedType,
      quantity: row.quantity,
      note: row.note,
      created_at: row.created_at,
    };
  }
}