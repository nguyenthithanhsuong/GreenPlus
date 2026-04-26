import { createServiceRoleSupabaseClient } from "../../core/supabase";
import { CreateRoleInput, RoleRow, UpdateRoleInput } from "./role-management.types";
import { isSystemRoleRow } from "./states/role-state";

type RoleDbRow = {
  role_id: string;
  role_name: string;
  description: string | null;
  is_customer: boolean | null;
  is_admin: boolean | null;
  is_manager: boolean | null;
  is_employee: boolean | null;
  is_shipper: boolean | null;
};

type UserRoleRow = {
  role_id: string | null;
};

export class RoleManagementRepository {
  private readonly supabase = createServiceRoleSupabaseClient();

  async listRoles(): Promise<RoleRow[]> {
    const { data: roleRows, error: roleError } = await this.supabase
      .from("roles")
      .select("role_id,role_name,description,is_customer,is_admin,is_manager,is_employee,is_shipper")
      .order("role_name", { ascending: true });

    if (roleError) {
      throw new Error(roleError.message);
    }

    const { data: userRows, error: userError } = await this.supabase
      .from("users")
      .select("role_id");

    if (userError) {
      throw new Error(userError.message);
    }

    const userCounts = new Map<string, number>();
    for (const row of (userRows ?? []) as UserRoleRow[]) {
      if (!row.role_id) {
        continue;
      }

      userCounts.set(row.role_id, (userCounts.get(row.role_id) ?? 0) + 1);
    }

    return ((roleRows ?? []) as RoleDbRow[]).map((role) => ({
      role_id: role.role_id,
      role_name: role.role_name,
      description: role.description,
      user_count: userCounts.get(role.role_id) ?? 0,
      is_customer: role.is_customer,
      is_admin: role.is_admin,
      is_manager: role.is_manager,
      is_employee: role.is_employee,
      is_shipper: role.is_shipper,
    }));
  }

  async findById(roleId: string): Promise<RoleRow | null> {
    const roles = await this.listRoles();
    return roles.find((role) => role.role_id === roleId) ?? null;
  }

  async findByName(roleName: string): Promise<RoleRow | null> {
    const normalized = roleName.trim().toLowerCase();
    const roles = await this.listRoles();
    return roles.find((role) => role.role_name.trim().toLowerCase() === normalized) ?? null;
  }

  async createRole(input: CreateRoleInput): Promise<RoleRow> {
    const { data, error } = await this.supabase
      .from("roles")
      .insert({
        role_name: input.roleName,
        description: input.description?.trim() || null,
        is_customer: input.isCustomer ?? false,
        is_admin: input.isAdmin ?? false,
        is_manager: input.isManager ?? false,
        is_employee: input.isEmployee ?? false,
        is_shipper: input.isShipper ?? false,
      })
      .select("role_id,role_name,description,is_customer,is_admin,is_manager,is_employee,is_shipper")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      role_id: data.role_id,
      role_name: data.role_name,
      description: data.description,
      user_count: 0,
      is_customer: data.is_customer,
      is_admin: data.is_admin,
      is_manager: data.is_manager,
      is_employee: data.is_employee,
      is_shipper: data.is_shipper,
    };
  }

  async updateRole(input: UpdateRoleInput): Promise<RoleRow | null> {
    const payload: Record<string, string | boolean | null> = {};

    if (typeof input.roleName !== "undefined") payload.role_name = input.roleName;
    if (typeof input.description !== "undefined") payload.description = input.description?.trim() || null;
    if (typeof input.isCustomer !== "undefined") payload.is_customer = input.isCustomer;
    if (typeof input.isAdmin !== "undefined") payload.is_admin = input.isAdmin;
    if (typeof input.isManager !== "undefined") payload.is_manager = input.isManager;
    if (typeof input.isEmployee !== "undefined") payload.is_employee = input.isEmployee;
    if (typeof input.isShipper !== "undefined") payload.is_shipper = input.isShipper;

    const { data, error } = await this.supabase
      .from("roles")
      .update(payload)
      .eq("role_id", input.roleId)
      .select("role_id,role_name,description,is_customer,is_admin,is_manager,is_employee,is_shipper")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return {
      role_id: data.role_id,
      role_name: data.role_name,
      description: data.description,
      user_count: 0,
      is_customer: data.is_customer,
      is_admin: data.is_admin,
      is_manager: data.is_manager,
      is_employee: data.is_employee,
      is_shipper: data.is_shipper,
    };
  }

  async deleteRole(roleId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("roles")
      .delete()
      .eq("role_id", roleId)
      .select("role_id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data?.role_id);
  }
}
