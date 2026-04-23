import { RoleManagementRepository } from "../role-management.repository";
import { RoleManagementService } from "../role-management.service";
import {
  RoleManagementAuditObserver,
  RoleManagementSubject,
} from "../observers/role-management.observer";
import { CreateRoleInput, RoleRow, UpdateRoleInput } from "../role-management.types";

export class RoleManagementFacade {
  private readonly repository = new RoleManagementRepository();
  private readonly service = new RoleManagementService(this.repository);
  private readonly subject = new RoleManagementSubject();

  constructor() {
    this.subject.attach(new RoleManagementAuditObserver());
  }

  async listRoles(): Promise<RoleRow[]> {
    return this.service.listRoles();
  }

  async createRole(input: CreateRoleInput): Promise<RoleRow> {
    const created = await this.service.createRole(input);
    await this.subject.notify({ type: "role_created", roleId: created.role_id, actor: "admin" });
    return created;
  }

  async updateRole(input: UpdateRoleInput): Promise<RoleRow> {
    const updated = await this.service.updateRole(input);
    await this.subject.notify({ type: "role_updated", roleId: updated.role_id, actor: "admin" });
    return updated;
  }

  async deleteRole(roleId: string): Promise<void> {
    await this.service.deleteRole(roleId);
    await this.subject.notify({ type: "role_deleted", roleId, actor: "admin" });
  }
}

export const roleManagementFacade = new RoleManagementFacade();
