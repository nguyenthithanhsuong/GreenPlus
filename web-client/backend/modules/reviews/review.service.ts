import { AppError } from "../../core/errors";
import { CreateReviewInput, ReviewCreatedResult } from "./review.types";
import { ReviewRepository } from "./review.repository";
import { createReviewEligibilityState } from "./states/review-eligibility.state";
import { createReviewValidationStrategy } from "./strategies/review-validation.strategy";
import {
  ProductRatingUpdaterObserver,
  ReviewSubject,
  SupplierNotificationObserver,
} from "./observers/review.observer";

export class ReviewService {
  private readonly subject = new ReviewSubject();
  private readonly repository = new ReviewRepository();
  private readonly validationStrategy = createReviewValidationStrategy();

  constructor() {
    this.subject.addObserver(new ProductRatingUpdaterObserver());
    this.subject.addObserver(new SupplierNotificationObserver());
  }

  private validateInput(input: CreateReviewInput): void {
    const comment = input.comment ?? "";
    this.validationStrategy.validate(input.rating, comment);
  }

  private async verifyPurchasedProduct(userId: string, productId: string): Promise<void> {
    let deliveredOrderIds: string[] = [];
    try {
      deliveredOrderIds = await this.repository.listDeliveredOrderIdsByUser(userId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to load delivered orders", 500);
    }

    if (deliveredOrderIds.length === 0) {
      throw new AppError("Review rejected: delivered order not found for this user", 400);
    }

    let hasDeliveredItem = false;
    try {
      hasDeliveredItem = await this.repository.hasDeliveredOrderItemForProduct(deliveredOrderIds, productId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to verify purchased product", 500);
    }

    const eligibilityState = createReviewEligibilityState(hasDeliveredItem);
    if (!eligibilityState.canSubmit()) {
      throw new AppError("Review rejected: product has not been purchased in delivered orders", 400);
    }
  }

  private async computeAverageRating(productId: string): Promise<number> {
    let ratings: number[] = [];
    try {
      ratings = await this.repository.listRatingsByProduct(productId);
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to compute average rating", 500);
    }

    if (ratings.length === 0) {
      return 0;
    }

    return ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  }

  async createReview(input: CreateReviewInput): Promise<ReviewCreatedResult> {
    this.validateInput(input);
    await this.verifyPurchasedProduct(input.userId, input.productId);

    const trimmedComment = (input.comment ?? "").trim() || null;

    let data: {
      review_id: string;
      user_id: string;
      product_id: string;
      rating: number;
      comment: string | null;
      created_at: string;
    };
    try {
      data = await this.repository.createReview({
        userId: input.userId,
        productId: input.productId,
        rating: input.rating,
        comment: trimmedComment,
      });
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : "Failed to create review", 500);
    }

    await this.subject.notify({
      productId: input.productId,
      rating: input.rating,
    });

    const avg = await this.computeAverageRating(input.productId);

    return {
      reviewId: String(data.review_id),
      userId: String(data.user_id),
      productId: String(data.product_id),
      rating: Number(data.rating),
      comment: (data.comment as string | null) ?? null,
      createdAt: String(data.created_at),
      averageRatingAfterInsert: avg,
    };
  }
}

export const reviewService = new ReviewService();
