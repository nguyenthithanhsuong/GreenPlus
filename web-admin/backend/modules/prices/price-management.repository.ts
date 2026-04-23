import { createServiceRoleSupabaseClient } from "../../core/supabase";
import { PriceRow } from "./price-management.types";

type PriceDbRow = {
  price_id: string;
  batch_id: string | null;
  price: number | string;
  date: string;
  created_at: string | null;
  batches?: {
    batch_id?: string | null;
    products?: {
      name?: string | null;
    } | null;
    suppliers?: {
      name?: string | null;
    } | null;
  } | null;
};

export class PriceManagementRepository {
  private readonly supabase = createServiceRoleSupabaseClient();

  async listPrices(): Promise<PriceRow[]> {
    const { data, error } = await this.supabase
      .from("prices")
      .select("price_id,batch_id,price,date,created_at,batches(batch_id,products(name),suppliers(name))")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false, nullsFirst: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as PriceDbRow[]).map((row) => this.toPriceRow(row));
  }

  async findPriceById(priceId: string): Promise<PriceRow | null> {
    const { data, error } = await this.supabase
      .from("prices")
      .select("price_id,batch_id,price,date,created_at,batches(batch_id,products(name),suppliers(name))")
      .eq("price_id", priceId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.toPriceRow(data as PriceDbRow) : null;
  }

  async createPrice(input: {
    batchId: string | null;
    price: number;
    date: string;
  }): Promise<PriceRow> {
    const { data, error } = await this.supabase
      .from("prices")
      .insert({
        batch_id: input.batchId,
        price: input.price,
        date: input.date,
      })
      .select("price_id,batch_id,price,date,created_at,batches(batch_id,products(name),suppliers(name))")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.toPriceRow(data as PriceDbRow);
  }

  async updatePrice(input: {
    priceId: string;
    batchId?: string | null;
    price?: number;
    date?: string;
  }): Promise<PriceRow | null> {
    const payload: {
      batch_id?: string | null;
      price?: number;
      date?: string;
    } = {};

    if (typeof input.batchId !== "undefined") {
      payload.batch_id = input.batchId;
    }

    if (typeof input.price === "number") {
      payload.price = input.price;
    }

    if (typeof input.date === "string") {
      payload.date = input.date;
    }

    const { data, error } = await this.supabase
      .from("prices")
      .update(payload)
      .eq("price_id", input.priceId)
      .select("price_id,batch_id,price,date,created_at,batches(batch_id,products(name),suppliers(name))")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.toPriceRow(data as PriceDbRow) : null;
  }

  async deletePrice(priceId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("prices")
      .delete()
      .eq("price_id", priceId)
      .select("price_id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean((data as { price_id?: string } | null)?.price_id);
  }

  private toPriceRow(row: PriceDbRow): PriceRow {
    return {
      price_id: row.price_id,
      batch_id: row.batch_id,
      product_name: row.batches?.products?.name ?? null,
      supplier_name: row.batches?.suppliers?.name ?? null,
      price: Number(row.price),
      date: row.date,
      created_at: row.created_at,
    };
  }
}