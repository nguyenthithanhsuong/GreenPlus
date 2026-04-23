import { UserManagementRepository } from "../user-management.repository";
import { UserManagementService } from "../user-management.service";
import {
  UserManagementAuditObserver,
  UserManagementSubject,
} from "../observers/user-management.observer";
import { CreateUserInput, UpdateUserInput, UserSummary } from "../user-management.types";

export class UserManagementFacade {
  private readonly repository = new UserManagementRepository();
  private readonly service = new UserManagementService(this.repository);
  private readonly subject = new UserManagementSubject();

  constructor() {
    this.subject.attach(new UserManagementAuditObserver());
  }

  async listUsers(): Promise<UserSummary[]> {
    return this.service.listUsers();
  }

  async createUser(input: CreateUserInput): Promise<UserSummary> {
    const created = await this.service.createUser(input);
    await this.subject.notify({ type: "user_created", userId: created.user_id, actor: "admin" });
    return created;
  }

  async updateUser(input: UpdateUserInput): Promise<UserSummary> {
    const updated = await this.service.updateUser(input);
    await this.subject.notify({ type: "user_updated", userId: updated.user_id, actor: "admin" });
    return updated;
  }

  async disableUser(userId: string): Promise<UserSummary> {
    const updated = await this.service.disableUser(userId);
    await this.subject.notify({ type: "user_disabled", userId: updated.user_id, actor: "admin" });
    return updated;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.service.deleteUser(userId);
    await this.subject.notify({ type: "user_deleted", userId, actor: "admin" });
  }
}

export const userManagementFacade = new UserManagementFacade();
