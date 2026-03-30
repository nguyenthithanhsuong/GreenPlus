import { AppError } from "../../../core/errors";

export type SubscriptionFrequency = "weekly" | "monthly";

export interface SubscriptionStrategy {
  getNextDate(startDate: Date): Date;
}

class WeeklySubscriptionStrategy implements SubscriptionStrategy {
  getNextDate(startDate: Date): Date {
    const date = new Date(startDate);
    date.setDate(date.getDate() + 7);
    return date;
  }
}

class MonthlySubscriptionStrategy implements SubscriptionStrategy {
  getNextDate(startDate: Date): Date {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + 1);
    return date;
  }
}

export function createSubscriptionStrategy(frequency: string): SubscriptionStrategy {
  const normalized = frequency.trim().toLowerCase();

  switch (normalized) {
    case "weekly":
      return new WeeklySubscriptionStrategy();
    case "monthly":
      return new MonthlySubscriptionStrategy();
    default:
      throw new AppError("frequency must be one of: weekly, monthly", 400);
  }
}
