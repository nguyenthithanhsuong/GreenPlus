import { supabaseServer } from "../../core/supabase";

export class LoyaltyRepository {
  async findOrder(orderId: string): Promise<{ order_id: string; user_id: string; status: string; total_amount: number } | null> {
    const { data, error } = await supabaseServer
      .from("orders")
      .select("order_id,user_id,status,total_amount")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return null;
    }

    return {
      order_id: String(data.order_id),
      user_id: String(data.user_id),
      status: String(data.status),
      total_amount: Number(data.total_amount),
    };
  }

  async findPaymentStatus(orderId: string): Promise<string | null> {
    const { data, error } = await supabaseServer
      .from("payments")
      .select("status")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data?.status ? String(data.status) : null;
  }

  async findDeliveryStatus(orderId: string): Promise<string | null> {
    const { data, error } = await supabaseServer
      .from("deliveries")
      .select("status")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data?.status ? String(data.status) : null;
  }

  async getUserPoints(userId: string): Promise<number> {
    const { data, error } = await supabaseServer
      .from("users")
      .select("loyalty_points")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Number(data?.loyalty_points ?? 0);
  }

  async updateUserPoints(userId: string, points: number): Promise<void> {
    const { error } = await supabaseServer
      .from("users")
      .update({ loyalty_points: points })
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }
  }
}
