export type SupplierStatus = "pending" | "approved" | "rejected";

export type SupplierRow = {
  supplier_id: string;
  name: string;
  address: string;
  certificate: string | null;
  status: SupplierStatus;
  description: string | null;
  created_at: string;
};

export type SupplierSummary = SupplierRow;

export type CreateSupplierInput = {
  name: string;
  address: string;
  certificate?: string;
  description?: string;
  status?: SupplierStatus;
};

export type UpdateSupplierInput = {
  supplierId: string;
  name?: string;
  address?: string;
  certificate?: string | null;
  description?: string | null;
  status?: SupplierStatus;
};
