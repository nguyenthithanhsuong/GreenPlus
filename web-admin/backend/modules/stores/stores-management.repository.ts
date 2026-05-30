import { createServiceRoleSupabaseClient } from "../../core/supabase";
import { CreateStoreInput, StoreRow, UpdateStoreInput } from "./stores-management.types";

export class StoresManagementRepository {
  private readonly supabase = createServiceRoleSupabaseClient();

  async listStores(): Promise<StoreRow[]> {
    const { data, error } = await this.supabase
      .from("stores")
      .select(
        "store_id,name,description,address,ward,district,city,phone,email,manager_id,status,latitude,longitude,opening_time,closing_time,created_at,updated_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as StoreRow[];
  }

  async findById(storeId: string): Promise<StoreRow | null> {
    const { data, error } = await this.supabase
      .from("stores")
      .select(
        "store_id,name,description,address,ward,district,city,phone,email,manager_id,status,latitude,longitude,opening_time,closing_time,created_at,updated_at",
      )
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as StoreRow | null) ?? null;
  }

  async createStore(input: CreateStoreInput & { status: StoreRow["status"] }): Promise<StoreRow> {
    const { data, error } = await this.supabase
      .from("stores")
      .insert({
        name: input.name,
        description: input.description ?? null,
        address: input.address,
        ward: input.ward ?? null,
        district: input.district ?? null,
        city: input.city ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        manager_id: input.managerId,
        status: input.status,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        opening_time: input.openingTime ?? null,
        closing_time: input.closingTime ?? null,
      })
      .select(
        "store_id,name,description,address,ward,district,city,phone,email,manager_id,status,latitude,longitude,opening_time,closing_time,created_at,updated_at",
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as StoreRow;
  }

  async updateStore(input: UpdateStoreInput): Promise<StoreRow | null> {
    const payload: Record<string, string | number | null> = {};

    if (typeof input.name !== "undefined") payload.name = input.name;
    if (typeof input.description !== "undefined") payload.description = input.description;
    if (typeof input.address !== "undefined") payload.address = input.address;
    if (typeof input.ward !== "undefined") payload.ward = input.ward;
    if (typeof input.district !== "undefined") payload.district = input.district;
    if (typeof input.city !== "undefined") payload.city = input.city;
    if (typeof input.phone !== "undefined") payload.phone = input.phone;
    if (typeof input.email !== "undefined") payload.email = input.email;
    if (typeof input.managerId !== "undefined") payload.manager_id = input.managerId;
    if (typeof input.status !== "undefined") payload.status = input.status;
    if (typeof input.latitude !== "undefined") payload.latitude = input.latitude as number | null;
    if (typeof input.longitude !== "undefined") payload.longitude = input.longitude as number | null;
    if (typeof input.openingTime !== "undefined") payload.opening_time = input.openingTime;
    if (typeof input.closingTime !== "undefined") payload.closing_time = input.closingTime;

    const { data, error } = await this.supabase
      .from("stores")
      .update(payload)
      .eq("store_id", input.storeId)
      .select(
        "store_id,name,description,address,ward,district,city,phone,email,manager_id,status,latitude,longitude,opening_time,closing_time,created_at,updated_at",
      )
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as StoreRow | null) ?? null;
  }

  async deleteStore(storeId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("stores")
      .delete()
      .eq("store_id", storeId)
      .select("store_id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data?.store_id);
  }
}