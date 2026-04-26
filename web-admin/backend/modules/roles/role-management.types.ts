export type RoleRow = {
  role_id: string;
  role_name: string;
  description: string | null;
  user_count: number;

  is_customer: boolean | null;
  is_admin: boolean | null;
  is_manager: boolean | null;
  is_employee: boolean | null;
  is_shipper: boolean | null;
};

export type RoleSummary = RoleRow;

export type CreateRoleInput = {
  roleName: string;
  description?: string;

  isCustomer?: boolean;
  isAdmin?: boolean;
  isManager?: boolean;
  isEmployee?: boolean;
  isShipper?: boolean;
};

export type UpdateRoleInput = {
  roleId: string;
  roleName?: string;
  description?: string | null;

  isCustomer?: boolean;
  isAdmin?: boolean;
  isManager?: boolean;
  isEmployee?: boolean;
  isShipper?: boolean;
};