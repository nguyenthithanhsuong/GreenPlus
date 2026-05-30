export type InventoryTransactionType =
  | "stock_in"
  | "stock_out"
  | "adjust_in"
  | "adjust_out"
  | "adjustment";

export type InventoryRow = {
  inventory_id: string;
  batch_id: string | null;
  quantity_available: number;
  quantity_reserved: number | null;
  last_updated: string | null;
  product_name?: string | null;
  supplier_name?: string | null;
  batch_status?: string | null;
};

export type InventoryTransactionRow = {
  transaction_id: string;
  batch_id: string | null;
  type: InventoryTransactionType;
  quantity: number;
  note: string | null;
  created_at: string | null;
};

export type UpdateInventoryInput = {
  inventoryId: string;
  quantityAvailable: number;
  quantityReserved?: number | null;
  note?: string;
  type?: InventoryTransactionType;
};