export interface ReviewEligibilityState {
  canSubmit(): boolean;
}

class EligibleReviewState implements ReviewEligibilityState {
  canSubmit(): boolean {
    return true;
  }
}

class IneligibleReviewState implements ReviewEligibilityState {
  canSubmit(): boolean {
    return false;
  }
}

export function createReviewEligibilityState(hasDeliveredPurchase: boolean): ReviewEligibilityState {
  if (hasDeliveredPurchase) {
    return new EligibleReviewState();
  }

  return new IneligibleReviewState();
}
