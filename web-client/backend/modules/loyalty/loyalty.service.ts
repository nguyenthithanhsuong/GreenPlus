import { AppError } from "../../core/errors";
import { LoyaltyRepository } from "./loyalty.repository";
import { createLoyaltyEligibilityState } from "./states/loyalty-eligibility.state";
import { createLoyaltyPointStrategy } from "./strategies/point-calculation.strategy";
import { LoyaltyAwardInput, LoyaltyAwardResult } from "./loyalty.types";

export class LoyaltyService {
  private readonly repository = new LoyaltyRepository();
  private readonly pointStrategy = createLoyaltyPointStrategy();

  async awardPoints(input: LoyaltyAwardInput): Promise<LoyaltyAwardResult> {
    if (!input.orderId.trim()) {
      throw new AppError("orderId is required", 400);
    }

    let order: Awaited<ReturnType<LoyaltyRepository["findOrder"]>> = null;
    let paymentStatus: string | null = null;
    let deliveryStatus: string | null = null;

    try {
      [order, paymentStatus, deliveryStatus] = await Promise.all([
        this.repository.findOrder(input.orderId.trim()),
        this.repository.findPaymentStatus(input.orderId.trim()),
        this.repository.findDeliveryStatus(input.orderId.trim()),
      ]);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to validate order eligibility", 500);
    }

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const isDelivered = order.status === "completed" || deliveryStatus === "delivered";
    const isPaid = paymentStatus === "paid";
    const eligibility = createLoyaltyEligibilityState(isDelivered && isPaid);

    if (!eligibility.canAward()) {
      throw new AppError("Order is not eligible for loyalty points", 400);
    }

    const earnedPoints = this.pointStrategy.calculate(Number(order.total_amount));

    let currentPoints = 0;
    try {
      currentPoints = await this.repository.getUserPoints(order.user_id);
    } catch (error) {
      throw new AppError(
        error instanceof Error
          ? `${error.message}. Ensure users.loyalty_points column exists.`
          : "Failed to load current loyalty points",
        500
      );
    }

    const totalPoints = currentPoints + earnedPoints;

    try {
      await this.repository.updateUserPoints(order.user_id, totalPoints);
    } catch (error) {
      throw new AppError(
        error instanceof Error
          ? `${error.message}. Ensure users.loyalty_points column exists.`
          : "Failed to update loyalty points",
        500
      );
    }

    return {
      order_id: order.order_id,
      user_id: order.user_id,
      earned_points: earnedPoints,
      total_points: totalPoints,
      message: `You have earned ${earnedPoints} loyalty points from your recent purchase.`,
    };
  }
}

export const loyaltyService = new LoyaltyService();
