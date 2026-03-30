import { AppError } from "../../core/errors";
import { SubscriptionRepository } from "./subscription.repository";
import { createSubscriptionState } from "./states/subscription.state";
import { createSubscriptionStrategy } from "./strategies/subscription.strategy";

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

export class SubscriptionService {
  private readonly repository = new SubscriptionRepository();

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
      nextDeliveryPreview: state.canGenerateOrder() ? nextDelivery.toISOString().slice(0, 10) : "not-schedulable",
    };
  }
}

export const subscriptionService = new SubscriptionService();
