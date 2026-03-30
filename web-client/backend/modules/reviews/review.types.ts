export type CreateReviewInput = {
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
};

export type ReviewCreatedResult = {
  reviewId: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  averageRatingAfterInsert: number;
};
