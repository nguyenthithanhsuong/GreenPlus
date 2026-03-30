import { supabaseServer } from "../../core/supabase";

type ProductActiveRow = {
  product_id: string;
  status: string;
};

type ActiveSubscriptionRow = {
  subscription_id: string;
  status: string;
};

type SubscriptionInsertRow = {
  subscription_id: string;
  user_id: string;
  product_id: string;
  schedule: string;
  status: string;
  start_date: string;
};

export class SubscriptionRepository {
  async findActiveProductById(productId: string): Promise<ProductActiveRow | null> {
    const { data, error } = await supabaseServer
      .from("products")
      .select("product_id,status")
      .eq("product_id", productId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as ProductActiveRow | null) ?? null;
  }

  async findActiveSubscription(userId: string, productId: string): Promise<ActiveSubscriptionRow | null> {
    const { data, error } = await supabaseServer
      .from("subscriptions")
      .select("subscription_id,status")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as ActiveSubscriptionRow | null) ?? null;
  }

  async createSubscription(input: {
    userId: string;
    productId: string;
    schedule: string;
    startDate: string;
  }): Promise<SubscriptionInsertRow> {
    const { data, error } = await supabaseServer
      .from("subscriptions")
      .insert({
        user_id: input.userId,
        product_id: input.productId,
        schedule: input.schedule,
        status: "active",
        start_date: input.startDate,
      })
      .select("subscription_id,user_id,product_id,schedule,status,start_date")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as SubscriptionInsertRow;
  }
}
