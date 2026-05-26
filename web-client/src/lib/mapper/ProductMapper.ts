import type {
  ProductBrowseItem,
  ProductDetailData,
  ReviewItem,
} from "../singleton";

export interface ProductDetailUIModel {
  id: string;
  name: string;
  description: string | null;
  nutrition: string | null;
  images: string[];
  price: number | null;
  categoryId: string | null;
  categoryName: string | null;
  status: "in_stock" | "out_of_stock" | "expired";
  totalAvailable: number;
  certification: string | null;
  batches: Array<{
    id: string;
    status: "available" | "expired" | "sold_out";
    expiresAt: Date;
    quantity: number;
    available: number;
    reserved: number;
    sellable: boolean;
  }>;
  ratings: {
    average: number;
    total: number;
  };
}

export interface ProductBrowseUIModel {
  id: string;
  name: string;
  image: string | null;
  categoryId: string | null;
  categoryName: string | null;
  price: number | null;
  available: boolean;
}

export interface ReviewUIModel {
  id: string;
  author: string;
  avatar: string | null;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export class ProductMapper {
  static toDetailUIModel(
    data: ProductDetailData,
    reviews: ReviewItem[],
  ): ProductDetailUIModel {
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + Number(r.rating ?? 0), 0) /
          reviews.length
        : 0;

    return {
      id: data.productId,
      name: data.name,
      description: data.description,
      nutrition: data.nutrition,
      images: data.images,
      price: data.availablePrice,
      categoryId: data.category.id,
      categoryName: data.category.name,
      status: data.inventory.status,
      totalAvailable: data.inventory.totalAvailable,
      certification: data.supplier.certification,
      batches: data.batches.map((batch) => ({
        id: batch.batchId,
        status: batch.status,
        expiresAt: new Date(batch.expireDate),
        quantity: batch.quantity,
        available: batch.available,
        reserved: batch.reserved,
        sellable: batch.isSellable,
      })),
      ratings: {
        average: Math.round(averageRating * 10) / 10,
        total: reviews.length,
      },
    };
  }

  static toBrowseUIModel(item: ProductBrowseItem): ProductBrowseUIModel {
    return {
      id: item.productId,
      name: item.name,
      image: item.imageUrl,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      price: item.price,
      available: item.isAvailable,
    };
  }

  static toReviewUIModel(review: ReviewItem): ReviewUIModel {
    return {
      id: review.reviewId,
      author: review.userName,
      avatar: review.userImageUrl,
      rating: Math.max(0, Math.min(5, Math.round(review.rating))),
      comment: review.comment,
      createdAt: new Date(review.createdAt),
    };
  }
}
