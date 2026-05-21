import { AppError } from "../../core/errors";
import { SubscriptionRepository } from "./subscription.repository";
import { createSubscriptionState } from "./states/subscription.state";
import { createSubscriptionStrategy } from "./strategies/subscription.strategy";

function formatVietnamDateKey(value: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}

export type CreateSubscriptionInput = {
  userId: string;
  productId: string;
  frequency: string;
};

export type CreateSubscriptionResult = {
  subscriptionId: string;
  userId: string;
  productId: string;
  schedule: string;
  status: string;
  startDate: string;
  nextDeliveryPreview: string;
};

export type SubscriptionSummary = {
  subscriptionId: string;
  userId: string;
  productId: string;
  schedule: string;
  status: string;
  startDate: string;
  nextDeliveryPreview: string;
};

export type CancelSubscriptionInput = {
  userId: string;
  subscriptionId: string;
};

export type CancelSubscriptionResult = {
  subscriptionId: string;
  userId: string;
  productId: string;
  status: string;
};

export type UpdateSubscriptionInput = {
  userId: string;
  subscriptionId: string;
  frequency?: string;
  status?: string;
  startDate?: string;
};

export class SubscriptionService {
  private readonly repository = new SubscriptionRepository();

  private toSummary(data: {
    subscription_id: string;
    user_id: string;
    product_id: string;
    schedule: string;
    status: string;
    start_date: string;
  }): SubscriptionSummary {
    const startDate = String(data.start_date);
    const status = String(data.status);
    const schedule = String(data.schedule);

    let nextDeliveryPreview = "not-schedulable";
    try {
      const strategy = createSubscriptionStrategy(schedule);
      const parsedStart = new Date(startDate);
      const state = createSubscriptionState((status as "active" | "paused" | "cancelled") ?? "cancelled");
      if (!Number.isNaN(parsedStart.getTime()) && state.canGenerateOrder()) {
        nextDeliveryPreview = formatVietnamDateKey(strategy.getNextDate(parsedStart));
      }
    } catch {
      nextDeliveryPreview = "not-schedulable";
    }

    return {
      subscriptionId: String(data.subscription_id),
      userId: String(data.user_id),
      productId: String(data.product_id),
      schedule,
      status,
      startDate,
      nextDeliveryPreview,
    };
  }

  async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
    if (!input.userId || !input.productId) {
      throw new AppError("userId and productId are required", 400);
    }

    const strategy = createSubscriptionStrategy(input.frequency);

    let productData: { product_id: string; status: string } | null = null;
    try {
      productData = await this.repository.findActiveProductById(input.productId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to verify product", 500);
    }

    if (!productData) {
      throw new AppError("Product is not available for subscription", 400);
    }

    let duplicate: { subscription_id: string; status: string } | null = null;
    try {
      duplicate = await this.repository.findActiveSubscription(input.userId, input.productId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to check duplicate subscription", 500);
    }

    if (duplicate) {
      throw new AppError("Duplicate active subscription is not allowed", 400);
    }

    const schedule = input.frequency.trim().toLowerCase();
    const startDate = new Date();
    const nextDelivery = strategy.getNextDate(startDate);

    let data: {
      subscription_id: string;
      user_id: string;
      product_id: string;
      schedule: string;
      status: string;
      start_date: string;
    };
    try {
      data = await this.repository.createSubscription({
        userId: input.userId,
        productId: input.productId,
        schedule,
        startDate: startDate.toISOString().slice(0, 10),
      });
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to create subscription", 500);
    }

    const state = createSubscriptionState((data.status as "active" | "paused" | "cancelled") ?? "active");

    return {
      subscriptionId: String(data.subscription_id),
      userId: String(data.user_id),
      productId: String(data.product_id),
      schedule: String(data.schedule),
      status: String(data.status),
      startDate: String(data.start_date),
      nextDeliveryPreview: state.canGenerateOrder() ? formatVietnamDateKey(nextDelivery) : "not-schedulable",
    };
  }

  async listSubscriptionsByUserId(userId: string): Promise<SubscriptionSummary[]> {
    if (!userId) {
      throw new AppError("userId is required", 400);
    }

    let rows: Array<{
      subscription_id: string;
      user_id: string;
      product_id: string;
      schedule: string;
      status: string;
      start_date: string;
    }> = [];
    try {
      rows = await this.repository.listSubscriptionsByUserId(userId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to list subscriptions", 500);
    }

    return rows.map((row) => this.toSummary(row));
  }

  async cancelSubscription(input: CancelSubscriptionInput): Promise<CancelSubscriptionResult> {
    if (!input.userId || !input.subscriptionId) {
      throw new AppError("userId and subscriptionId are required", 400);
    }

    let updated: {
      subscription_id: string;
      user_id: string;
      product_id: string;
      schedule: string;
      status: string;
      start_date: string;
    } | null = null;
    try {
      updated = await this.repository.cancelSubscription(input.userId, input.subscriptionId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to cancel subscription", 500);
    }

    if (!updated) {
      throw new AppError("Subscription not found or already cancelled", 404);
    }

    return {
      subscriptionId: String(updated.subscription_id),
      userId: String(updated.user_id),
      productId: String(updated.product_id),
      status: String(updated.status),
    };
  }

  async updateSubscription(input: UpdateSubscriptionInput): Promise<SubscriptionSummary> {
    if (!input.userId || !input.subscriptionId) {
      throw new AppError("userId and subscriptionId are required", 400);
    }

    const schedule = input.frequency?.trim().toLowerCase();
    const status = input.status?.trim().toLowerCase();
    const startDate = input.startDate?.trim();

    if (!schedule && !status && !startDate) {
      throw new AppError("frequency, status or startDate is required", 400);
    }

    if (schedule) {
      createSubscriptionStrategy(schedule);
    }

    if (status && !["active", "paused", "cancelled"].includes(status)) {
      throw new AppError("status must be one of: active, paused, cancelled", 400);
    }

    if (startDate) {
      const parsed = new Date(startDate);
      if (Number.isNaN(parsed.getTime())) {
        throw new AppError("startDate must be a valid date", 400);
      }
    }

    let updated: {
      subscription_id: string;
      user_id: string;
      product_id: string;
      schedule: string;
      status: string;
      start_date: string;
    } | null = null;

    try {
      updated = await this.repository.updateSubscription({
        userId: input.userId,
        subscriptionId: input.subscriptionId,
        schedule,
        status,
        startDate,
      });
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to update subscription", 500);
    }

    if (!updated) {
      throw new AppError("Subscription not found", 404);
    }

    return this.toSummary(updated);
  }
}

export const subscriptionService = new SubscriptionService();
