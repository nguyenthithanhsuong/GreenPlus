import { supabaseServer } from "../../core/supabase";
import { BlogStatus } from "./blog.types";

export type BlogRow = {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  status: BlogStatus;
  created_at: string;
};

export class BlogRepository {
  async listBlogPosts(): Promise<BlogRow[]> {
    const { data, error } = await supabaseServer
      .from("posts")
      .select("post_id,user_id,title,content,status,created_at")
      .in("type", ["blog", "community"])
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as BlogRow[];
  }

  async findBlogById(postId: string): Promise<BlogRow | null> {
    const { data, error } = await supabaseServer
      .from("posts")
      .select("post_id,user_id,title,content,status,created_at")
      .in("type", ["blog", "community"])
      .eq("post_id", postId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as BlogRow | null) ?? null;
  }
}
