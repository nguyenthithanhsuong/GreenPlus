import { supabaseServer } from "../../core/supabase";
import { ComplaintStatus, ComplaintType } from "./complaint.types";

type ComplaintInsertRow = {
  complaint_id: string;
  user_id: string;
  order_id: string;
  type: ComplaintType;
  description: string;
  status: ComplaintStatus;
  created_at: string;
};

export class ComplaintRepository {
  async findOrderByIdAndUser(orderId: string, userId: string): Promise<{ order_id: string } | null> {
    const { data, error } = await supabaseServer
      .from("orders")
      .select("order_id")
      .eq("order_id", orderId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as { order_id: string } | null) ?? null;
  }

  async createComplaint(input: {
    userId: string;
    orderId: string;
    type: ComplaintType;
    description: string;
  }): Promise<ComplaintInsertRow> {
    const { data, error } = await supabaseServer
      .from("complaints")
      .insert({
        user_id: input.userId,
        order_id: input.orderId,
        type: input.type,
        description: input.description,
      })
      .select("complaint_id,user_id,order_id,type,description,status,created_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as ComplaintInsertRow;
  }
}
