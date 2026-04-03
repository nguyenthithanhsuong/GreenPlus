import { GroupPurchaseStatus } from "../group-purchase.types";

export interface GroupPurchaseState {
  canJoin(): boolean;
}

class OpenGroupPurchaseState implements GroupPurchaseState {
  canJoin(): boolean {
    return true;
  }
}

class ClosedGroupPurchaseState implements GroupPurchaseState {
  canJoin(): boolean {
    return false;
  }
}

export function createGroupPurchaseState(status: GroupPurchaseStatus): GroupPurchaseState {
  if (status === "open") {
    return new OpenGroupPurchaseState();
  }

  return new ClosedGroupPurchaseState();
}
