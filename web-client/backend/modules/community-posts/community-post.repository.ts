import { supabaseServer } from "../../core/supabase";
import { CommunityPostType } from "./community-post.types";
import { createCommunityPostMediaStorageStrategy } from "./strategies/community-post-media-storage.strategy";

type PostRow = {
  post_id: string;
  user_id: string;
  title: string;
  content: string;
  type: CommunityPostType;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type PostMediaRow = {
  media_id: string;
  post_id: string;
  media_url: string | null;
};

const COMMUNITY_ATTACHMENT_BUCKET = "Post-Attachment";

export class CommunityPostRepository {
  private readonly mediaStorageStrategy = createCommunityPostMediaStorageStrategy();

  async createPost(input: {
    userId: string;
    title: string;
    content: string;
    type: CommunityPostType;
  }): Promise<{ post_id: string; user_id: string; type: CommunityPostType; status: "pending"; created_at: string }> {
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
      type: data.type as CommunityPostType,
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

  async getAllPosts(): Promise<PostRow[]> {
    const { data, error } = await supabaseServer
      .from("posts")
      .select("post_id,user_id,title,content,type,status,created_at")
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
    type: CommunityPostType;
  }): Promise<PostRow | null> {
    const updates: Record<string, string> = {
      title: input.title,
      content: input.content,
      type: input.type,
    };

    const { data, error } = await supabaseServer
      .from("posts")
      .update(updates)
      .eq("post_id", input.postId)
      .eq("user_id", input.userId)
      .select("post_id,user_id,title,content,type,status,created_at")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as PostRow | null) ?? null;
  }

  async hasPostOwnership(postId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabaseServer
      .from("posts")
      .select("post_id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data?.post_id);
  }

  async deletePost(input: { postId: string; userId: string }): Promise<boolean> {
    const { data, error } = await supabaseServer
      .from("posts")
      .delete()
      .eq("post_id", input.postId)
      .eq("user_id", input.userId)
      .select("post_id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data?.post_id);
  }

  async uploadAttachment(path: string, file: File): Promise<void> {
    const { error } = await supabaseServer.storage
      .from(COMMUNITY_ATTACHMENT_BUCKET)
      .upload(path, file, {
        contentType: file.type || undefined,
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  getAttachmentPublicUrl(path: string): string {
    const { data } = supabaseServer.storage.from(COMMUNITY_ATTACHMENT_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async listMediaByPostIds(postIds: string[]): Promise<Record<string, string[]>> {
    if (!postIds.length) {
      return {};
    }

    const { data, error } = await supabaseServer
      .from(this.mediaStorageStrategy.getTableName())
      .select("media_id,post_id,media_url")
      .in("post_id", postIds);

    if (error) {
      throw new Error(error.message);
    }

    const grouped: Record<string, string[]> = {};
    for (const row of (data ?? []) as PostMediaRow[]) {
      const url = row.media_url?.trim() ?? "";
      if (!url) {
        continue;
      }

      if (!grouped[row.post_id]) {
        grouped[row.post_id] = [];
      }

      grouped[row.post_id].push(url);
    }

    return grouped;
  }

  async replacePostMedia(postId: string, mediaUrls: string[]): Promise<void> {
    const { error: deleteError } = await supabaseServer
      .from(this.mediaStorageStrategy.getTableName())
      .delete()
      .eq("post_id", postId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    const normalizedUrls = mediaUrls.map((url) => url.trim()).filter(Boolean);
    if (!normalizedUrls.length) {
      return;
    }

    const rows = normalizedUrls.map((mediaUrl) => ({
      post_id: postId,
      media_url: mediaUrl,
    }));

    const { error: insertError } = await supabaseServer
      .from(this.mediaStorageStrategy.getTableName())
      .insert(rows);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}
