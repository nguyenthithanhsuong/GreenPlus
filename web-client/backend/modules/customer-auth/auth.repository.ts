import { supabaseServer } from "../../core/supabase";
import { UserStatus } from "./auth.types";

export type UserRow = {
  user_id: string;
  role_id: string | null;
  name: string;
  email: string;
  password: string;
  phone: string | null;
  address: string | null;
  status: UserStatus;
  created_at: string;
};

export class AuthRepository {
  async findUserByEmail(email: string): Promise<UserRow | null> {
    const { data, error } = await supabaseServer
      .from("users")
      .select("user_id,role_id,name,email,password,phone,address,status,created_at")
      .ilike("email", email)
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []) as UserRow[];
    return rows[0] ?? null;
  }

  async findUserById(userId: string): Promise<UserRow | null> {
    const { data, error } = await supabaseServer
      .from("users")
      .select("user_id,role_id,name,email,password,phone,address,status,created_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as UserRow | null) ?? null;
  }

  async findCustomerRoleId(): Promise<string | null> {
    const { data, error } = await supabaseServer
      .from("roles")
      .select("role_id")
      .eq("role_name", "customer")
      .maybeSingle();

    if (error) {
      return null;
    }

    return data?.role_id ? String(data.role_id) : null;
  }

  async createUser(input: {
    roleId: string | null;
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<UserRow> {
    const { data, error } = await supabaseServer
      .from("users")
      .insert({
        role_id: input.roleId,
        name: input.name,
        email: input.email,
        password: input.passwordHash,
        status: "active",
      })
      .select("user_id,role_id,name,email,password,phone,address,status,created_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as UserRow;
  }

  async updateProfile(input: {
    userId: string;
    name: string;
    phone: string;
    address: string;
  }): Promise<UserRow> {
    const { data, error } = await supabaseServer
      .from("users")
      .update({
        name: input.name,
        phone: input.phone,
        address: input.address,
      })
      .eq("user_id", input.userId)
      .select("user_id,role_id,name,email,password,phone,address,status,created_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as UserRow;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const { error } = await supabaseServer
      .from("users")
      .update({ password: passwordHash })
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }
  }
}
