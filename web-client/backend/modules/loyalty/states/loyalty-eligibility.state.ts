export interface LoyaltyEligibilityState {
  canAward(): boolean;
}

class EligibleLoyaltyState implements LoyaltyEligibilityState {
  canAward(): boolean {
    return true;
  }
}

class IneligibleLoyaltyState implements LoyaltyEligibilityState {
  canAward(): boolean {
    return false;
  }
}

export function createLoyaltyEligibilityState(isEligible: boolean): LoyaltyEligibilityState {
  if (isEligible) {
    return new EligibleLoyaltyState();
  }

  return new IneligibleLoyaltyState();
}
