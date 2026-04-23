import { AppError } from "../../core/errors";
import { UserManagementRepository } from "./user-management.repository";
import { createUserAccountState } from "./states/user-account.state";
import { createUserPasswordStrategy } from "./strategies/user-password.strategy";
import { CreateUserInput, UpdateUserInput, UserSummary } from "./user-management.types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UserManagementService {
  private readonly passwordStrategy = createUserPasswordStrategy();

  constructor(private readonly repository: UserManagementRepository) {}

  private toSummary(user: {
    user_id: string;
    role_id: string | null;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    status: "active" | "inactive" | "banned";
    created_at: string;
    image_url: string | null;
    roles?: { role_name?: string | null } | null;
  }): UserSummary {
    return {
      user_id: user.user_id,
      role_id: user.role_id,
      role_name: user.roles?.role_name ?? null,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      status: user.status,
      created_at: user.created_at,
      image_url: user.image_url,
    };
  }

  async listUsers(): Promise<UserSummary[]> {
    const users = await this.repository.listUsers();
    return users.map((user) => this.toSummary(user));
  }

  async createUser(input: CreateUserInput): Promise<UserSummary> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const password = input.password;

    if (!name) {
      throw new AppError("name is required", 400);
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      throw new AppError("valid email is required", 400);
    }

    if (password.length < 6) {
      throw new AppError("password must be at least 6 characters", 400);
    }

    const passwordHash = this.passwordStrategy.hash(password);

    const created = await this.repository.createUser({
      ...input,
      name,
      email,
      passwordHash,
    });

    return this.toSummary(created);
  }

  async updateUser(input: UpdateUserInput): Promise<UserSummary> {
    if (!input.userId.trim()) {
      throw new AppError("userId is required", 400);
    }

    if (typeof input.email !== "undefined") {
      const normalizedEmail = input.email.trim().toLowerCase();
      if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
        throw new AppError("valid email is required", 400);
      }
      input.email = normalizedEmail;
    }

    if (typeof input.status !== "undefined") {
      const existing = await this.repository.findById(input.userId);
      if (!existing) {
        throw new AppError("user not found", 404);
      }

      const currentState = createUserAccountState(existing.status);
      if (!currentState.canTransitionTo(input.status)) {
        throw new AppError(`Cannot change status from ${currentState.name} to ${input.status}`, 400);
      }
    }

    const updated = await this.repository.updateUser(input);

    if (!updated) {
      throw new AppError("user not found", 404);
    }

    return this.toSummary(updated);
  }

  async disableUser(userId: string): Promise<UserSummary> {
    const normalizedUserId = userId.trim();
    if (!normalizedUserId) {
      throw new AppError("userId is required", 400);
    }

    const existing = await this.repository.findById(normalizedUserId);
    if (!existing) {
      throw new AppError("user not found", 404);
    }

    const currentState = createUserAccountState(existing.status);
    if (!currentState.canDisable()) {
      throw new AppError(`Cannot disable user with status ${currentState.name}`, 400);
    }

    const updated = await this.repository.updateUser({
      userId: normalizedUserId,
      status: "inactive",
    });

    if (!updated) {
      throw new AppError("user not found", 404);
    }

    return this.toSummary(updated);
  }

  async deleteUser(userId: string): Promise<void> {
    const normalizedUserId = userId.trim();
    if (!normalizedUserId) {
      throw new AppError("userId is required", 400);
    }

    const deleted = await this.repository.deleteUser(normalizedUserId);
    if (!deleted) {
      throw new AppError("user not found", 404);
    }
  }
}
