import { AppError } from "../../../core/errors";

export interface ReviewValidationStrategy {
  validate(rating: number, comment: string): void;
}

class DefaultReviewValidationStrategy implements ReviewValidationStrategy {
  validate(rating: number, comment: string): void {
    if (rating < 1 || rating > 5) {
      throw new AppError("Invalid rating value", 400);
    }

    if (comment.length > 500) {
      throw new AppError("Comment exceeds maximum length", 400);
    }
  }
}

export function createReviewValidationStrategy(): ReviewValidationStrategy {
  return new DefaultReviewValidationStrategy();
}
