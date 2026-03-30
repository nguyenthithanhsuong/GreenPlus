import { CreateReviewInput, ReviewCreatedResult } from "../review.types";
import { ReviewService } from "../review.service";

// Facade cho use case danh gia san pham: route goi 1 diem vao duy nhat.
export class ReviewFacade {
  private readonly service = new ReviewService();

  async submitReview(input: CreateReviewInput): Promise<ReviewCreatedResult> {
    return this.service.createReview(input);
  }
}

export const reviewFacade = new ReviewFacade();
