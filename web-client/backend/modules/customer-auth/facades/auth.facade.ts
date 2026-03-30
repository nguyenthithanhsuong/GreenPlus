import { randomUUID } from "crypto";
import { AppError } from "../../../core/errors";
import { isUsingServiceRoleKey } from "../../../core/supabase";
import { AuthRepository } from "../auth.repository";
import {
  ChangePasswordInput,
  RegisterInput,
  SessionInfo,
  SignInInput,
  UpdateProfileInput,
  UserStatus,
} from "../auth.types";
import {
  PasswordHasherStrategy,
  Pbkdf2HasherStrategy,
} from "../strategies/password-hasher.strategy";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{9,15}$/;

// Facade pattern: gom toan bo luong dang ky/dang nhap/quan ly tai khoan vao mot diem vao.
export class AuthFacade {
  private readonly repository: AuthRepository;
  private readonly hasher: PasswordHasherStrategy;

  constructor() {
    this.repository = new AuthRepository();
    this.hasher = new Pbkdf2HasherStrategy();
  }

  private ensureActiveStatus(status: UserStatus): void {
    if (status !== "active") {
      throw new AppError("MSG6: account is not active", 400);
    }
  }

  private isPbkdf2Hash(value: string): boolean {
    return value.startsWith("pbkdf2$");
  }

  async register(input: RegisterInput) {
    if (input.name.trim().length === 0) {
      throw new AppError("MSG1: name is required", 400);
    }

    if (input.email.trim().length === 0) {
      throw new AppError("MSG2: email is required", 400);
    }

    if (input.password.length < 6) {
      throw new AppError("MSG3: password must be at least 6 characters", 400);
    }

    if (input.password !== input.confirmPassword) {
      throw new AppError("MSG4: password and confirm password do not match", 400);
    }

    if (!EMAIL_REGEX.test(input.email.trim())) {
      throw new AppError("MSG5: invalid email format", 400);
    }

    const existing = await this.repository.findUserByEmail(input.email.trim().toLowerCase());
    if (existing) {
      throw new AppError("MSG6: email already exists", 400);
    }

    const passwordHash = await this.hasher.hash(input.password);
    const customerRoleId = await this.repository.findCustomerRoleId();

    const user = await this.repository.createUser({
      roleId: customerRoleId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash,
    });

    return {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      status: user.status,
      created_at: user.created_at,
    };
  }

  async signIn(input: SignInInput): Promise<{ session: SessionInfo; user: Record<string, unknown> }> {
    const email = input.email.trim().toLowerCase();

    if (email.length === 0) {
      throw new AppError("MSG1: email is required", 400);
    }

    if (input.password.length === 0) {
      throw new AppError("MSG2: password is required", 400);
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new AppError("MSG3: invalid email format", 400);
    }

    const user = await this.repository.findUserByEmail(email);
    if (!user) {
      if (!isUsingServiceRoleKey) {
        throw new AppError(
          "MSG4: account not found (backend is using anon key; if RLS is enabled, user rows may be hidden). Set SUPABASE_SERVICE_ROLE_KEY.",
          404
        );
      }
      throw new AppError("MSG4: account not found", 404);
    }

    let isValidPassword = false;

    if (this.isPbkdf2Hash(user.password)) {
      isValidPassword = await this.hasher.compare(input.password, user.password);
    } else {
      // Ho tro du lieu cu luu plaintext: cho phep dang nhap 1 lan roi nang cap len hash.
      isValidPassword = input.password === user.password;
      if (isValidPassword) {
        const upgradedHash = await this.hasher.hash(input.password);
        await this.repository.updatePassword(user.user_id, upgradedHash);
      }
    }

    if (!isValidPassword) {
      throw new AppError("MSG5: invalid credentials", 400);
    }

    this.ensureActiveStatus(user.status);

    const session: SessionInfo = {
      session_id: randomUUID(),
      user_id: user.user_id,
      login_time: new Date().toISOString(),
    };

    return {
      session,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        status: user.status,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      status: user.status,
    };
  }

  async updateProfile(input: UpdateProfileInput) {
    if (input.name.trim().length === 0) {
      throw new AppError("MSG1: name is required", 400);
    }

    if (input.phone.trim().length === 0) {
      throw new AppError("MSG2: phone is required", 400);
    }

    if (!PHONE_REGEX.test(input.phone.trim())) {
      throw new AppError("MSG3: invalid phone format", 400);
    }

    const updated = await this.repository.updateProfile({
      userId: input.userId,
      name: input.name.trim(),
      phone: input.phone.trim(),
      address: (input.address ?? "").trim(),
    });

    return {
      user_id: updated.user_id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      address: updated.address,
      status: updated.status,
    };
  }

  async changePassword(input: ChangePasswordInput): Promise<{ updated: true }> {
    if (input.currentPassword.length === 0) {
      throw new AppError("MSG4: current password is required", 400);
    }

    if (input.newPassword.length < 6) {
      throw new AppError("MSG5: new password must be at least 6 characters", 400);
    }

    if (input.newPassword !== input.confirmPassword) {
      throw new AppError("MSG6: new password and confirm password do not match", 400);
    }

    const user = await this.repository.findUserById(input.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const isCurrentPasswordCorrect = await this.hasher.compare(input.currentPassword, user.password);
    if (!isCurrentPasswordCorrect) {
      throw new AppError("MSG7: current password is incorrect", 400);
    }

    const newPasswordHash = await this.hasher.hash(input.newPassword);
    await this.repository.updatePassword(input.userId, newPasswordHash);

    return { updated: true };
  }
}

export const authFacade = new AuthFacade();
