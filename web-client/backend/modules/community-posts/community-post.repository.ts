import { supabaseServer } from "../../core/supabase";

type PostRow = {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  type: "community" | "video";
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export class CommunityPostRepository {
  async createPost(input: {
    userId: string;
    title: string;
    content: string;
    type: "community" | "video";
  }): Promise<{ post_id: string; user_id: string; type: "community" | "video"; status: "pending"; created_at: string }> {
    const { data, error } = await supabaseServer
      .from("posts")
      .insert({
        user_id: input.userId,
        title: input.title,
        content: input.content,
        type: input.type,
        status: "pending",
      })
      .select("post_id,user_id,type,status,created_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      post_id: String(data.post_id),
      user_id: String(data.user_id),
      type: data.type as "community" | "video",
      status: "pending",
      created_at: String(data.created_at),
    };
  }

  async getPostsByUserId(userId: string): Promise<PostRow[]> {
    const { data, error } = await supabaseServer
      .from("posts")
      .select("post_id,user_id,title,content,type,status,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as PostRow[];
  }

  async updatePost(input: {
    postId: string;
    userId: string;
    title: string;
    content: string;
    type: "community" | "video";
  }): Promise<PostRow | null> {
    const { data, error } = await supabaseServer
      .from("posts")
      .update({
        title: input.title,
        content: input.content,
        type: input.type,
      })
      .eq("post_id", input.postId)
      .eq("user_id", input.userId)
      .select("post_id,user_id,title,content,type,status,created_at")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as PostRow | null) ?? null;
  }
}
