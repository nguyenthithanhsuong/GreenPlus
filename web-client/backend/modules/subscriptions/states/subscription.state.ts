export type SubscriptionStatus = "active" | "paused" | "cancelled";

export interface SubscriptionState {
  canGenerateOrder(): boolean;
}

class ActiveSubscriptionState implements SubscriptionState {
  canGenerateOrder(): boolean {
    return true;
  }
}

class PausedSubscriptionState implements SubscriptionState {
  canGenerateOrder(): boolean {
    return false;
  }
}

class CancelledSubscriptionState implements SubscriptionState {
  canGenerateOrder(): boolean {
    return false;
  }
}

export function createSubscriptionState(status: SubscriptionStatus): SubscriptionState {
  switch (status) {
    case "active":
      return new ActiveSubscriptionState();
    case "paused":
      return new PausedSubscriptionState();
    case "cancelled":
      return new CancelledSubscriptionState();
    default:
      return new CancelledSubscriptionState();
  }
}
