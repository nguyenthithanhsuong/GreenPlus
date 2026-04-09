import { supabaseServer } from "../../core/supabase";
import { CommunityPostInteraction, CommunityPostInteractionType } from "./community-post.types";

type PostInteractionRow = {
  interaction_id: string;
  post_id: string;
  user_id: string;
  type: CommunityPostInteractionType;
  comment: string | null;
  created_at: string;
  status: string | null;
};

export class CommunityPostInteractionRepository {
  async listByPostId(postId: string): Promise<PostInteractionRow[]> {
    const { data, error } = await supabaseServer
      .from("post_interactions")
      .select("interaction_id,post_id,user_id,type,comment,created_at,status")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as PostInteractionRow[];
  }

  async findLike(postId: string, userId: string): Promise<PostInteractionRow | null> {
    const { data, error } = await supabaseServer
      .from("post_interactions")
      .select("interaction_id,post_id,user_id,type,comment,created_at,status")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("type", "like")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as PostInteractionRow | null) ?? null;
  }

  async findCommentById(interactionId: string): Promise<PostInteractionRow | null> {
    const { data, error } = await supabaseServer
      .from("post_interactions")
      .select("interaction_id,post_id,user_id,type,comment,created_at,status")
      .eq("interaction_id", interactionId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as PostInteractionRow | null) ?? null;
  }

  async create(input: {
    postId: string;
    userId: string;
    type: CommunityPostInteractionType;
    comment?: string | null;
    status?: string | null;
  }): Promise<PostInteractionRow> {
    const { data, error } = await supabaseServer
      .from("post_interactions")
      .insert({
        post_id: input.postId,
        user_id: input.userId,
        type: input.type,
        comment: input.comment ?? null,
        status: input.status ?? "active",
      })
      .select("interaction_id,post_id,user_id,type,comment,created_at,status")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as PostInteractionRow;
  }

  async updateComment(input: { interactionId: string; userId: string; comment: string }): Promise<PostInteractionRow | null> {
    const { data, error } = await supabaseServer
      .from("post_interactions")
      .update({ comment: input.comment, status: "edited" })
      .eq("interaction_id", input.interactionId)
      .eq("user_id", input.userId)
      .eq("type", "comment")
      .select("interaction_id,post_id,user_id,type,comment,created_at,status")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as PostInteractionRow | null) ?? null;
  }

  async markCommentDeleted(input: { interactionId: string; userId: string }): Promise<PostInteractionRow | null> {
    const { data, error } = await supabaseServer
      .from("post_interactions")
      .update({ status: "deleted" })
      .eq("interaction_id", input.interactionId)
      .eq("user_id", input.userId)
      .eq("type", "comment")
      .select("interaction_id,post_id,user_id,type,comment,created_at,status")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as PostInteractionRow | null) ?? null;
  }

  async deleteLike(input: { postId: string; userId: string }): Promise<number> {
    const { data, error } = await supabaseServer
      .from("post_interactions")
      .delete()
      .eq("post_id", input.postId)
      .eq("user_id", input.userId)
      .eq("type", "like")
      .select("interaction_id");

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).length;
  }
}

export function toCommunityPostInteractionSummary(row: PostInteractionRow): CommunityPostInteraction {
  return {
    interaction_id: String(row.interaction_id),
    post_id: String(row.post_id),
    user_id: String(row.user_id),
    type: row.type,
    comment: row.comment,
    created_at: String(row.created_at),
    status: (row.status as CommunityPostInteraction["status"]) ?? null,
  };
}