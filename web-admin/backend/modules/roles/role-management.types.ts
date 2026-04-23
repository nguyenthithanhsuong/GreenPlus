export type RoleRow = {
  role_id: string;
  role_name: string;
  description: string | null;
  user_count: number;
  is_system_role: boolean;
};

export type RoleSummary = RoleRow;

export type CreateRoleInput = {
  roleName: string;
  description?: string;
};

export type UpdateRoleInput = {
  roleId: string;
  roleName?: string;
  description?: string | null;
};
