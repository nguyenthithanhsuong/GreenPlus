import { randomUUID } from "crypto";
import { AppError } from "../../../core/errors";
import { isUsingServiceRoleKey } from "../../../core/supabase";
import { AuthAuditObserver, AuthSubject } from "../observers/auth.observer";
import { AuthRepository } from "../auth.repository";
import { createAccountState } from "../states/account.state";
import {
  ChangePasswordInput,
  RegisterInput,
  SessionInfo,
  SignInInput,
  UploadProfileImageInput,
  UploadProfileImageResult,
  UpdateProfileInput,
  UserStatus,
} from "../auth.types";
import {
  PasswordHasherStrategy,
  Pbkdf2HasherStrategy,
} from "../strategies/password-hasher.strategy";
import { createProfileImageStorageStrategy } from "../strategies/profile-image.strategy";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{9,15}$/;

// Facade pattern: gom toan bo luong dang ky/dang nhap/quan ly tai khoan vao mot diem vao.
export class AuthFacade {
  private readonly repository: AuthRepository;
  private readonly hasher: PasswordHasherStrategy;
  private readonly authSubject: AuthSubject;
  private readonly profileImageStrategy = createProfileImageStorageStrategy();

  constructor() {
    this.repository = new AuthRepository();
    this.hasher = new Pbkdf2HasherStrategy();
    this.authSubject = new AuthSubject();
    this.authSubject.attach(new AuthAuditObserver());
  }

  private ensureActiveStatus(status: UserStatus): void {
    const accountState = createAccountState(status);
    if (!accountState.canSignIn()) {
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

    await this.authSubject.notify({
      type: "register_succeeded",
      userId: user.user_id,
      email: user.email,
    });

    return {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      status: user.status,
      created_at: user.created_at,
    };
  }

  async signIn(input: SignInInput): Promise<{ session: SessionInfo; user: Record<string, unknown>; role_name: string | null }> {
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

    const roleName = await this.repository.findRoleNameById(user.role_id);

    await this.authSubject.notify({
      type: "sign_in_succeeded",
      userId: user.user_id,
      email: user.email,
    });

    return {
      session,
      role_name: roleName,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        image_url: user.image_url,
        status: user.status,
      },
    };
  }

  async getProfile(userId: string) {
    if (userId.trim().length === 0) {
      throw new AppError("userId is required", 400);
    }

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
      image_url: user.image_url,
      status: user.status,
    };
  }

  async updateProfile(input: UpdateProfileInput) {
    if (input.userId.trim().length === 0) {
      throw new AppError("userId is required", 400);
    }

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
      imageUrl: (input.imageUrl ?? "").trim(),
    });

    await this.authSubject.notify({
      type: "profile_updated",
      userId: updated.user_id,
    });

    return {
      user_id: updated.user_id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      address: updated.address,
      image_url: updated.image_url,
      status: updated.status,
    };
  }

  async changePassword(input: ChangePasswordInput): Promise<{ updated: true }> {
    if (input.userId.trim().length === 0) {
      throw new AppError("userId is required", 400);
    }

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

    const isCurrentPasswordCorrect = this.isPbkdf2Hash(user.password)
      ? await this.hasher.compare(input.currentPassword, user.password)
      : input.currentPassword === user.password;

    if (!isCurrentPasswordCorrect) {
      throw new AppError("MSG7: current password is incorrect", 400);
    }

    const newPasswordHash = await this.hasher.hash(input.newPassword);
    await this.repository.updatePassword(input.userId, newPasswordHash);

    await this.authSubject.notify({
      type: "password_changed",
      userId: input.userId,
    });

    return { updated: true };
  }

  async uploadProfileImage(input: UploadProfileImageInput): Promise<UploadProfileImageResult> {
    const userId = input.userId.trim();

    if (!userId) {
      throw new AppError("userId is required", 400);
    }

    const file = input.file;
    if (!file) {
      throw new AppError("file is required", 400);
    }

    if (!file.type.startsWith("image/")) {
      throw new AppError("Only image files are supported", 400);
    }

    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new AppError("Profile image must be smaller than 5MB", 400);
    }

    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const path = this.profileImageStrategy.buildObjectPath(userId, file.name || "profile-image.jpg");

    try {
      await this.repository.uploadProfileImage(path, file);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to upload profile image", 400);
    }

    return {
      path,
      publicUrl: this.repository.getProfileImagePublicUrl(path),
    };
  }
}

export const authFacade = new AuthFacade();
