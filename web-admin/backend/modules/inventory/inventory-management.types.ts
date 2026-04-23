export type InventoryTransactionType = "stock_in" | "stock_out" | "adjustment";

export type InventoryRow = {
  inventory_id: string;
  batch_id: string | null;
  product_name: string | null;
  supplier_name: string | null;
  batch_status: string | null;
  quantity_available: number;
  quantity_reserved: number;
  last_updated: string | null;
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
  quantityReserved?: number;
  note?: string;
  type?: InventoryTransactionType;
};