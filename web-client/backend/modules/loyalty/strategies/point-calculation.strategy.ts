export interface LoyaltyPointStrategy {
  calculate(orderAmount: number): number;
}

class DefaultLoyaltyPointStrategy implements LoyaltyPointStrategy {
  calculate(orderAmount: number): number {
    if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
      return 0;
    }

    return Math.floor(orderAmount / 10000);
  }
}

export function createLoyaltyPointStrategy(): LoyaltyPointStrategy {
  return new DefaultLoyaltyPointStrategy();
}
