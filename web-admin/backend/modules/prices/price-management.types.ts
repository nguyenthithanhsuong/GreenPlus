export type PriceStatus = "pending" | "active" | "inactive";

export type PriceRow = {
  price_id: string;
  batch_id: string | null;
  product_name: string | null;
  supplier_name: string | null;
  price: number;
  date: string;
  created_at: string | null;
  status: PriceStatus | null;
};

export type CreatePriceInput = {
  batchId?: string | null;
  price: number;
  date: string;
  status?: PriceStatus | null;
};

export type UpdatePriceInput = {
  priceId: string;
  batchId?: string | null;
  price?: number;
  date?: string;
  status?: PriceStatus | null;
};