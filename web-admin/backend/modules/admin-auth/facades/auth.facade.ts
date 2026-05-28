import { createHmac, randomUUID } from "crypto";
import { AppError } from "../../../core/errors";
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
const CUSTOM_TOKEN_PREFIX = "gpv1";


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
      throw new AppError("Account is not active", 400);
    }
  }

  private isPbkdf2Hash(value: string): boolean {
    return value.startsWith("pbkdf2$");
  }

  private getSessionSecret(): string {
    const secret = process.env.AUTH_HANDOFF_SECRET || process.env.AUTH_SESSION_SECRET;

    if (!secret) {
      throw new AppError("Session secret is not configured", 500);
    }

    return secret;
  }

  private createAccessToken(input: {
    userId: string;
    email: string;
    role: string;
    sessionId: string;
    loginTime: string;
  }): string {
    const payload = Buffer.from(JSON.stringify(input)).toString("base64url");
    const signature = createHmac("sha256", this.getSessionSecret()).update(payload).digest("base64url");

    return `${CUSTOM_TOKEN_PREFIX}.${payload}.${signature}`;
  }

  async register(input: RegisterInput) {
    if (input.name.trim().length === 0) {
      throw new AppError("Name is required", 400);
    }

    if (input.email.trim().length === 0) {
      throw new AppError("Email is required", 400);
    }

    if (input.password.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400);
    }

    if (input.password !== input.confirmPassword) {
      throw new AppError("Password and confirm password do not match", 400);
    }

    if (!EMAIL_REGEX.test(input.email.trim())) {
      throw new AppError("Invalid email format", 400);
    }

    const existing = await this.repository.findUserByEmail(input.email.trim().toLowerCase());
    if (existing) {
      throw new AppError("Email already exists", 400);
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
      throw new AppError("Email is required", 400);
    }

    if (input.password.length === 0) {
      throw new AppError("Password is required", 400);
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new AppError("Invalid email format", 400);
    }

    const user = await this.repository.findUserByEmail(email);
    if (!user) {
            throw new AppError("Account not found", 404);
    }
    console.log("========== LOGIN DEBUG ==========");

console.log("INPUT EMAIL:", email);
console.log("INPUT PASSWORD (RAW):", input.password);

console.log("USER FOUND:", {
  user_id: user?.user_id,
  email: user?.email,
  role_id: user?.role_id,
  status: user?.status,
});

console.log("STORED PASSWORD:", user?.password);

console.log(
  "IS PBKDF2 HASH:",
  user?.password?.startsWith("pbkdf2$")
);

if (user?.password?.startsWith("pbkdf2$")) {
  const [algorithm, iterationText, salt, hashHex] =
    user.password.split("$");

  console.log("HASH PARTS:", {
    algorithm,
    iterationText,
    salt,
    hashLength: hashHex?.length,
  });

  const compareResult = await this.hasher.compare(
    input.password,
    user.password
  );

  console.log("COMPARE RESULT:", compareResult);
} else {
  console.log(
    "PLAINTEXT MATCH:",
    input.password === user?.password
  );
}

console.log("=================================");
    let isValidPassword = false;

    if (this.isPbkdf2Hash(user.password)) {
      isValidPassword = await this.hasher.compare(input.password, user.password);
    } else {
      
      isValidPassword = input.password === user.password;
      if (isValidPassword) {
        const upgradedHash = await this.hasher.hash(input.password);
        await this.repository.updatePassword(user.user_id, upgradedHash);
      }
    }

    if (!isValidPassword) {
      throw new AppError("Invalid credentials", 400);
    }

    this.ensureActiveStatus(user.status);

    const session: SessionInfo = {
      session_id: randomUUID(),
      user_id: user.user_id,
      login_time: new Date().toISOString(),
      access_token: "",
    };

    const roleName = await this.repository.findRoleNameById(user.role_id);
    session.access_token = this.createAccessToken({
      userId: user.user_id,
      email: user.email,
      role: roleName || "",
      sessionId: session.session_id,
      loginTime: session.login_time,
    });

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
      throw new AppError("Name is required", 400);
    }

    if (input.phone.trim().length === 0) {
      throw new AppError("Phone is required", 400);
    }

    if (!PHONE_REGEX.test(input.phone.trim())) {
      throw new AppError("Invalid phone format", 400);
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
      throw new AppError("UserId is required", 400);
    }

    if (input.currentPassword.length === 0) {
      throw new AppError("Current password is required", 400);
    }

    if (input.newPassword.length < 6) {
      throw new AppError("New password must be at least 6 characters", 400);
    }

    if (input.newPassword !== input.confirmPassword) {
      throw new AppError("New password and confirm password do not match", 400);
    }

    const user = await this.repository.findUserById(input.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const isCurrentPasswordCorrect = this.isPbkdf2Hash(user.password)
      ? await this.hasher.compare(input.currentPassword, user.password)
      : input.currentPassword === user.password;

    if (!isCurrentPasswordCorrect) {
      throw new AppError("Current password is incorrect", 400);
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
      throw new AppError("UserId is required", 400);
    }

    const file = input.file;
    if (!file) {
      throw new AppError("File is required", 400);
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
