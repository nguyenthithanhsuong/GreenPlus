import { UserStatus } from "../auth.types";

export interface AccountState {
  canSignIn(): boolean;
}

export class ActiveAccountState implements AccountState {
  canSignIn(): boolean {
    return true;
  }
}

export class BlockedAccountState implements AccountState {
  canSignIn(): boolean {
    return false;
  }
}

export function createAccountState(status: UserStatus): AccountState {
  if (status === "active") {
    return new ActiveAccountState();
  }

  return new BlockedAccountState();
}
