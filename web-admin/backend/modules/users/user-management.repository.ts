import { createServiceRoleSupabaseClient } from "../../core/supabase";
import { CreateUserInput, UpdateUserInput, UserRow } from "./user-management.types";

export class UserManagementRepository {
  private readonly supabase = createServiceRoleSupabaseClient();

  async findCustomerRoleId(): Promise<string | null> {
    const { data, error } = await this.supabase
      .from("roles")
      .select("role_id")
      .eq("role_name", "customer")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data?.role_id ? String(data.role_id) : null;
  }

  async listUsers(): Promise<UserRow[]> {
    const { data, error } = await this.supabase
      .from("users")
      .select(`
  user_id,
  role_id,
  name,
  email,
  password,
  phone,
  address,
  status,
  created_at,
  image_url,
  roles(
    role_name,
    is_customer,
    is_admin,
    is_manager,
    is_employee,
    is_shipper
  )
`)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as UserRow[];
  }

  async findById(userId: string): Promise<UserRow | null> {
    const { data, error } = await this.supabase
      .from("users")
      .select(`
  user_id,
  role_id,
  name,
  email,
  password,
  phone,
  address,
  status,
  created_at,
  image_url,
  roles(
    role_name,
    is_customer,
    is_admin,
    is_manager,
    is_employee,
    is_shipper
  )
`)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as UserRow | null) ?? null;
  }

  async createUser(input: CreateUserInput & { passwordHash: string }): Promise<UserRow> {
    const { data, error } = await this.supabase
      .from("users")
      .insert({
        role_id: input.roleId ?? (await this.findCustomerRoleId()),
        name: input.name,
        email: input.email,
        password: input.passwordHash,
        phone: input.phone?.trim() || null,
        address: input.address?.trim() || null,
        image_url: input.imageUrl?.trim() || null,
        status: input.status ?? "active",
      })
      .select(`
  user_id,
  role_id,
  name,
  email,
  password,
  phone,
  address,
  status,
  created_at,
  image_url,
  roles(
    role_name,
    is_customer,
    is_admin,
    is_manager,
    is_employee,
    is_shipper
  )
`)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as UserRow;
  }

  async updateUser(input: UpdateUserInput): Promise<UserRow | null> {
    const payload: Record<string, string | null> = {};

    if (typeof input.roleId !== "undefined") payload.role_id = input.roleId;
    if (typeof input.name !== "undefined") payload.name = input.name.trim();
    if (typeof input.email !== "undefined") payload.email = input.email.trim().toLowerCase();
    if (typeof input.phone !== "undefined") payload.phone = input.phone.trim() || null;
    if (typeof input.address !== "undefined") payload.address = input.address.trim() || null;
    if (typeof input.imageUrl !== "undefined") payload.image_url = input.imageUrl.trim() || null;
    if (typeof input.status !== "undefined") payload.status = input.status;

    const { data, error } = await this.supabase
      .from("users")
      .update(payload)
      .eq("user_id", input.userId)
      .select(`
  user_id,
  role_id,
  name,
  email,
  password,
  phone,
  address,
  status,
  created_at,
  image_url,
  roles(
    role_name,
    is_customer,
    is_admin,
    is_manager,
    is_employee,
    is_shipper
  )
`)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as UserRow | null) ?? null;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("users")
      .delete()
      .eq("user_id", userId)
      .select("user_id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data?.user_id);
  }
}
