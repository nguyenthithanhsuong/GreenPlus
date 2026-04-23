import { AppError } from "../../../core/errors";
import { UserStatus } from "../user-management.types";

export interface UserAccountState {
  readonly name: UserStatus;
  canDisable(): boolean;
  canTransitionTo(next: UserStatus): boolean;
}

class ActiveUserState implements UserAccountState {
  readonly name: UserStatus = "active";

  canDisable(): boolean {
    return true;
  }

  canTransitionTo(next: UserStatus): boolean {
    return next === "inactive" || next === "banned" || next === "active";
  }
}

class InactiveUserState implements UserAccountState {
  readonly name: UserStatus = "inactive";

  canDisable(): boolean {
    return false;
  }

  canTransitionTo(next: UserStatus): boolean {
    return next === "active" || next === "banned" || next === "inactive";
  }
}

class BannedUserState implements UserAccountState {
  readonly name: UserStatus = "banned";

  canDisable(): boolean {
    return false;
  }

  canTransitionTo(next: UserStatus): boolean {
    return next === "active" || next === "inactive" || next === "banned";
  }
}

export function createUserAccountState(status: string): UserAccountState {
  const normalized = status.trim().toLowerCase();

  if (normalized === "active") {
    return new ActiveUserState();
  }

  if (normalized === "inactive") {
    return new InactiveUserState();
  }

  if (normalized === "banned") {
    return new BannedUserState();
  }

  throw new AppError(`Unsupported user status: ${status}`, 400);
}
