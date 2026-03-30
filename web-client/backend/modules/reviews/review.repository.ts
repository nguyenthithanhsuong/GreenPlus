import { supabaseServer } from "../../core/supabase";

type DeliveredOrderRow = {
  order_id: string;
};

type OrderItemRow = {
  order_item_id: string;
};

type ReviewInsertRow = {
  review_id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type ReviewRatingRow = {
  rating: number;
};

export class ReviewRepository {
  async listDeliveredOrderIdsByUser(userId: string): Promise<string[]> {
    const { data, error } = await supabaseServer
      .from("orders")
      .select("order_id")
      .eq("user_id", userId)
      .eq("status", "delivered");

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as DeliveredOrderRow[]).map((row) => String(row.order_id));
  }

  async hasDeliveredOrderItemForProduct(orderIds: string[], productId: string): Promise<boolean> {
    if (orderIds.length === 0) {
      return false;
    }

    const { data, error } = await supabaseServer
      .from("order_items")
      .select("order_item_id")
      .in("order_id", orderIds)
      .eq("product_id", productId)
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as OrderItemRow[]).length > 0;
  }

  async createReview(input: {
    userId: string;
    productId: string;
    rating: number;
    comment: string | null;
  }): Promise<ReviewInsertRow> {
    const { data, error } = await supabaseServer
      .from("reviews")
      .insert({
        user_id: input.userId,
        product_id: input.productId,
        rating: input.rating,
        comment: input.comment,
      })
      .select("review_id,user_id,product_id,rating,comment,created_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as ReviewInsertRow;
  }

  async listRatingsByProduct(productId: string): Promise<number[]> {
    const { data, error } = await supabaseServer
      .from("reviews")
      .select("rating")
      .eq("product_id", productId);

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as ReviewRatingRow[]).map((row) => Number(row.rating));
  }
}
