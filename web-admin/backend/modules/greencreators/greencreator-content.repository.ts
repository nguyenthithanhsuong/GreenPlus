import { createServiceRoleSupabaseClient } from "../../core/supabase";
import {
  GreenCreatorInteractionRow,
  GreenCreatorMediaRow,
  GreenCreatorPostRow,
  GreenCreatorPostStatus,
  GreenCreatorPostType,
} from "./greencreator-content.types";

type UserJoin =
  | {
      name?: string | null;
      image_url?: string | null;
    }
  | Array<{
      name?: string | null;
      image_url?: string | null;
    }>
  | null;

type MediaJoin = Array<{
  media_id?: string;
  media_url?: string | null;
}>;

type InteractionJoin = Array<{
  interaction_id?: string;
  post_id?: string | null;
  user_id?: string | null;
  type?: string | null;
  comment?: string | null;
  created_at?: string | null;
  status?: string | null;
  actor?: UserJoin;
}>;

type PostDbRow = {
  post_id: string;
  user_id: string | null;
  title: string;
  content: string;
  type: string;
  status: string | null;
  created_at: string | null;
  author?: UserJoin;
  post_medias?: MediaJoin;
  post_interactions?: InteractionJoin;
};

export class GreenCreatorContentRepository {
  private readonly supabase = createServiceRoleSupabaseClient();
  private readonly attachmentBucket = "Post-Attachment";

  async listPosts(): Promise<GreenCreatorPostRow[]> {
    const { data, error } = await this.supabase
      .from("posts")
      .select(`
        post_id,
        user_id,
        title,
        content,
        type,
        status,
        created_at,
        author:users!posts_user_id_fkey(name,image_url),
        post_medias(media_id,media_url),
        post_interactions(
          interaction_id,
          post_id,
          user_id,
          type,
          comment,
          created_at,
          status,
          actor:users!post_interactions_user_id_fkey(name,image_url)
        )
      `)
      .order("created_at", { ascending: false, nullsFirst: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => this.mapPostRow(row as PostDbRow));
  }

  async findPostById(postId: string): Promise<GreenCreatorPostRow | null> {
    const { data, error } = await this.supabase
      .from("posts")
      .select(`
        post_id,
        user_id,
        title,
        content,
        type,
        status,
        created_at,
        author:users!posts_user_id_fkey(name,image_url),
        post_medias(media_id,media_url),
        post_interactions(
          interaction_id,
          post_id,
          user_id,
          type,
          comment,
          created_at,
          status,
          actor:users!post_interactions_user_id_fkey(name,image_url)
        )
      `)
      .eq("post_id", postId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.mapPostRow(data as PostDbRow) : null;
  }

  async updatePostStatus(input: { postId: string; status: GreenCreatorPostStatus }): Promise<GreenCreatorPostRow | null> {
    const { data, error } = await this.supabase
      .from("posts")
      .update({
        status: input.status,
      })
      .eq("post_id", input.postId)
      .select(`
        post_id,
        user_id,
        title,
        content,
        type,
        status,
        created_at,
        author:users!posts_user_id_fkey(name,image_url),
        post_medias(media_id,media_url),
        post_interactions(
          interaction_id,
          post_id,
          user_id,
          type,
          comment,
          created_at,
          status,
          actor:users!post_interactions_user_id_fkey(name,image_url)
        )
      `)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.mapPostRow(data as PostDbRow) : null;
  }

  async createPost(input: {
    userId: string;
    title: string;
    content: string;
    type: GreenCreatorPostType;
  }): Promise<{ post_id: string; user_id: string; type: GreenCreatorPostType; status: GreenCreatorPostStatus; created_at: string | null }> {
    const { data, error } = await this.supabase
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
      type: this.normalizeType(String(data.type)),
      status: this.normalizeStatus(data.status),
      created_at: data.created_at ?? null,
    };
  }

  async hasPostOwnership(postId: string, userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
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

  async deletePost(postId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("posts")
      .delete()
      .eq("post_id", postId)
      .select("post_id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data?.post_id);
  }

  async deletePostWithRelations(postId: string): Promise<boolean> {
    const { error: deleteMediaError } = await this.supabase
      .from("post_medias")
      .delete()
      .eq("post_id", postId);

    if (deleteMediaError) {
      throw new Error(deleteMediaError.message);
    }

    const { error: deleteInteractionsError } = await this.supabase
      .from("post_interactions")
      .delete()
      .eq("post_id", postId);

    if (deleteInteractionsError) {
      throw new Error(deleteInteractionsError.message);
    }

    return this.deletePost(postId);
  }

  async uploadAttachment(path: string, file: File): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.attachmentBucket)
      .upload(path, file, {
        contentType: file.type || undefined,
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  getAttachmentPublicUrl(path: string): string {
    const { data } = this.supabase.storage.from(this.attachmentBucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async replacePostMedia(postId: string, mediaUrls: string[]): Promise<void> {
    const { error: deleteError } = await this.supabase
      .from("post_medias")
      .delete()
      .eq("post_id", postId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (!mediaUrls.length) {
      return;
    }

    const { error: insertError } = await this.supabase
      .from("post_medias")
      .insert(
        mediaUrls.map((mediaUrl) => ({
          post_id: postId,
          media_url: mediaUrl,
        }))
      );

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  private mapPostRow(row: PostDbRow): GreenCreatorPostRow {
    const media = Array.isArray(row.post_medias) ? row.post_medias : [];
    const interactions = Array.isArray(row.post_interactions) ? row.post_interactions : [];

    return {
      post_id: row.post_id,
      user_id: row.user_id,
      author_name: this.pickUserField(row.author ?? null, "name"),
      author_image_url: this.pickUserField(row.author ?? null, "image_url"),
      title: row.title,
      content: row.content,
      type: this.normalizeType(row.type),
      status: this.normalizeStatus(row.status),
      created_at: row.created_at,
      media: media.map((item) => ({
        media_id: item.media_id ?? "",
        media_url: item.media_url ?? null,
      })),
      interactions: interactions.map((interaction) => {
        const actor = interaction.actor ?? null;

        return {
          interaction_id: interaction.interaction_id ?? "",
          post_id: interaction.post_id ?? null,
          user_id: interaction.user_id ?? null,
          user_name: this.pickUserField(actor, "name"),
          user_image_url: this.pickUserField(actor, "image_url"),
          type: interaction.type ?? "",
          comment: interaction.comment ?? null,
          created_at: interaction.created_at ?? null,
          status: interaction.status ?? null,
        } satisfies GreenCreatorInteractionRow;
      }),
      media_count: media.length,
      interaction_count: interactions.length,
      comment_count: interactions.filter((interaction) => {
        const status = interaction.status?.toLowerCase() ?? "";
        return status === "comment" || Boolean(interaction.comment?.trim());
      }).length,
    };
  }

  private normalizeStatus(status: string | null | undefined): GreenCreatorPostStatus {
    if (status === "approved" || status === "rejected") {
      return status;
    }

    return "pending";
  }

  private normalizeType(type: string): GreenCreatorPostType {
    if (type === "blog" || type === "video" || type === "community") {
      return type;
    }

    return "blog";
  }

  private pickUserField(user: UserJoin, field: "name" | "image_url"): string | null {
    if (Array.isArray(user)) {
      return user[0]?.[field] ?? null;
    }

    return user?.[field] ?? null;
  }
}