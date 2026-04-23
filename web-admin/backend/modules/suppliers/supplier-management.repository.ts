import { createServiceRoleSupabaseClient } from "../../core/supabase";
import { CreateSupplierInput, SupplierRow, SupplierStatus, UpdateSupplierInput } from "./supplier-management.types";

export class SupplierManagementRepository {
  private readonly supabase = createServiceRoleSupabaseClient();

  async listSuppliers(): Promise<SupplierRow[]> {
    const { data, error } = await this.supabase
      .from("suppliers")
      .select("supplier_id,name,address,certificate,status,description,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as SupplierRow[];
  }

  async findById(supplierId: string): Promise<SupplierRow | null> {
    const { data, error } = await this.supabase
      .from("suppliers")
      .select("supplier_id,name,address,certificate,status,description,created_at")
      .eq("supplier_id", supplierId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as SupplierRow | null) ?? null;
  }

  async createSupplier(input: CreateSupplierInput & { status: SupplierStatus }): Promise<SupplierRow> {
    const { data, error } = await this.supabase
      .from("suppliers")
      .insert({
        name: input.name,
        address: input.address,
        certificate: input.certificate?.trim() || null,
        status: input.status,
        description: input.description?.trim() || null,
      })
      .select("supplier_id,name,address,certificate,status,description,created_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as SupplierRow;
  }

  async updateSupplier(input: UpdateSupplierInput): Promise<SupplierRow | null> {
    const payload: Record<string, string | null> = {};

    if (typeof input.name !== "undefined") payload.name = input.name.trim();
    if (typeof input.address !== "undefined") payload.address = input.address.trim();
    if (typeof input.certificate !== "undefined") payload.certificate = input.certificate?.trim() || null;
    if (typeof input.description !== "undefined") payload.description = input.description?.trim() || null;
    if (typeof input.status !== "undefined") payload.status = input.status;

    const { data, error } = await this.supabase
      .from("suppliers")
      .update(payload)
      .eq("supplier_id", input.supplierId)
      .select("supplier_id,name,address,certificate,status,description,created_at")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as SupplierRow | null) ?? null;
  }

  async deleteSupplier(supplierId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("suppliers")
      .delete()
      .eq("supplier_id", supplierId)
      .select("supplier_id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data?.supplier_id);
  }
}
