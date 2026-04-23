import { AppError } from "../../core/errors";
import { CreateRoleInput, RoleRow, UpdateRoleInput } from "./role-management.types";
import { RoleManagementRepository } from "./role-management.repository";
import { createRoleState } from "./states/role-state";
import { DefaultRoleNameStrategy } from "./strategies/role-name.strategy";

export class RoleManagementService {
  private readonly nameStrategy = new DefaultRoleNameStrategy();

  constructor(private readonly repository: RoleManagementRepository) {}

  async listRoles(): Promise<RoleRow[]> {
    return this.repository.listRoles();
  }

  async createRole(input: CreateRoleInput): Promise<RoleRow> {
    const roleName = this.nameStrategy.normalize(input.roleName);

    const existing = await this.repository.findByName(roleName);
    if (existing) {
      throw new AppError("role already exists", 400);
    }

    return this.repository.createRole({
      roleName,
      description: input.description?.trim() || null,
    });
  }

  async updateRole(input: UpdateRoleInput): Promise<RoleRow> {
    if (!input.roleId.trim()) {
      throw new AppError("roleId is required", 400);
    }

    const current = await this.repository.findById(input.roleId);
    if (!current) {
      throw new AppError("role not found", 404);
    }

    const currentState = createRoleState(current.role_name);
    if (!currentState.canRename()) {
      throw new AppError("role cannot be renamed", 400);
    }

    let normalizedRoleName = current.role_name;
    if (typeof input.roleName !== "undefined") {
      normalizedRoleName = this.nameStrategy.normalize(input.roleName);
      if (normalizedRoleName !== current.role_name) {
        const duplicate = await this.repository.findByName(normalizedRoleName);
        if (duplicate && duplicate.role_id !== input.roleId) {
          throw new AppError("role already exists", 400);
        }
      }
    }

    const updated = await this.repository.updateRole({
      roleId: input.roleId,
      roleName: typeof input.roleName !== "undefined" ? normalizedRoleName : undefined,
      description: input.description,
    });

    if (!updated) {
      throw new AppError("role not found", 404);
    }

    return updated;
  }

  async deleteRole(roleId: string): Promise<void> {
    if (!roleId.trim()) {
      throw new AppError("roleId is required", 400);
    }

    const current = await this.repository.findById(roleId);
    if (!current) {
      throw new AppError("role not found", 404);
    }

    const state = createRoleState(current.role_name);
    if (!state.canDelete()) {
      throw new AppError("role cannot be deleted", 400);
    }

    if (current.user_count > 0) {
      throw new AppError(`role is in use by ${current.user_count} user(s)`, 400);
    }

    const deleted = await this.repository.deleteRole(roleId);
    if (!deleted) {
      throw new AppError("role not found", 404);
    }
  }
}
