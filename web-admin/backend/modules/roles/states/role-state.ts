import { RoleRow } from "../role-management.types";

export interface RoleState {
  readonly name: "system" | "custom";
  canDelete(): boolean;
  canRename(): boolean;
}

class SystemRoleState implements RoleState {
  readonly name = "system" as const;

  canDelete(): boolean {
    return true;
  }

  canRename(): boolean {
    return true;
  }
}

class CustomRoleState implements RoleState {
  readonly name = "custom" as const;

  canDelete(): boolean {
    return true;
  }

  canRename(): boolean {
    return true;
  }
}

const SYSTEM_ROLE_NAMES = new Set(["admin", "manager", "employee", "customer"]);

export function createRoleState(roleName: string): RoleState {
  const normalized = roleName.trim().toLowerCase();

  if (SYSTEM_ROLE_NAMES.has(normalized)) {
    return new SystemRoleState();
  }

  return new CustomRoleState();
}

export function isSystemRoleRow(role: Pick<RoleRow, "role_name">): boolean {
  return SYSTEM_ROLE_NAMES.has(role.role_name.trim().toLowerCase());
}
