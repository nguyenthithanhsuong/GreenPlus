export type BatchStatus = "available" | "expired" | "sold_out";

export type BatchRow = {
  batch_id: string;
  product_id: string;
  product_name: string | null;
  supplier_id: string;
  supplier_name: string | null;
  harvest_date: string;
  expire_date: string;
  quantity: number;
  qr_code: string | null;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
};

export type CreateBatchInput = {
  productId: string;
  supplierId: string;
  harvestDate: string;
  expireDate: string;
  quantity: number;
  qrCode?: string | null;
  status?: BatchStatus;
};

export type UpdateBatchInput = {
  batchId: string;
  productId?: string;
  supplierId?: string;
  harvestDate?: string;
  expireDate?: string;
  quantity?: number;
  qrCode?: string | null;
  status?: BatchStatus;
};