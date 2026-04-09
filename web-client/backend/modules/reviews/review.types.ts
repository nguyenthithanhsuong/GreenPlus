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

export type ReviewListItem = {
  reviewId: string;
  userId: string;
  userName: string;
  userImageUrl: string | null;
  productId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};
