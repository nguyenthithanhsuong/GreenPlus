import { supabaseServer } from "../../core/supabase";
import { GroupPurchaseStatus } from "./group-purchase.types";

type RelObj = Record<string, unknown> | Record<string, unknown>[] | null;

export type GroupPurchaseRow = {
  group_id: string;
  product_id: string;
  leader_id: string;
  target_quantity: number;
  current_quantity: number;
  min_quantity: number;
  discount_price: number | null;
  deadline: string;
  status: GroupPurchaseStatus;
  products: RelObj;
};

export class GroupPurchaseRepository {
  async findActiveProductById(productId: string): Promise<{ product_id: string } | null> {
    const { data, error } = await supabaseServer
      .from("products")
      .select("product_id")
      .eq("product_id", productId)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as { product_id: string } | null) ?? null;
  }

  async listOpenGroups(): Promise<GroupPurchaseRow[]> {
    const { data, error } = await supabaseServer
      .from("group_buys")
      .select(
        "group_id,product_id,leader_id,target_quantity,current_quantity,min_quantity,discount_price,deadline,status,products(name)"
      )
      .eq("status", "open")
      .order("deadline", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as GroupPurchaseRow[];
  }

  async findGroupById(groupId: string): Promise<GroupPurchaseRow | null> {
    const { data, error } = await supabaseServer
      .from("group_buys")
      .select(
        "group_id,product_id,leader_id,target_quantity,current_quantity,min_quantity,discount_price,deadline,status,products(name)"
      )
      .eq("group_id", groupId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as GroupPurchaseRow | null) ?? null;
  }

  async hasMember(groupId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabaseServer
      .from("group_buy_members")
      .select("id")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).length > 0;
  }

  async insertMember(groupId: string, userId: string, quantity: number): Promise<void> {
    const { error } = await supabaseServer.from("group_buy_members").insert({
      group_id: groupId,
      user_id: userId,
      quantity,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateGroupProgress(groupId: string, nextQuantity: number, nextStatus: GroupPurchaseStatus): Promise<void> {
    const { error } = await supabaseServer
      .from("group_buys")
      .update({ current_quantity: nextQuantity, status: nextStatus })
      .eq("group_id", groupId);

    if (error) {
      throw new Error(error.message);
    }
  }

  async createGroup(input: {
    productId: string;
    leaderId: string;
    targetQuantity: number;
    minQuantity: number;
    discountPrice: number | null;
    deadline: string;
  }): Promise<{ group_id: string; status: GroupPurchaseStatus }> {
    const { data, error } = await supabaseServer
      .from("group_buys")
      .insert({
        product_id: input.productId,
        leader_id: input.leaderId,
        target_quantity: input.targetQuantity,
        current_quantity: 0,
        min_quantity: input.minQuantity,
        discount_price: input.discountPrice,
        deadline: input.deadline,
        status: "open",
      })
      .select("group_id,status")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      group_id: String(data.group_id),
      status: data.status as GroupPurchaseStatus,
    };
  }
}

export function readRelationValue<T = string>(rel: RelObj, field: string): T | null {
  if (!rel) {
    return null;
  }

  if (Array.isArray(rel)) {
    const first = rel[0];
    if (!first) {
      return null;
    }

    return (first[field] as T) ?? null;
  }

  return (rel[field] as T) ?? null;
}
