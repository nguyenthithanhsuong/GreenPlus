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

  private mapPostRow(row: PostDbRow): GreenCreatorPostRow {
    const status = this.normalizeStatus(row.status);
    const media = (row.post_medias ?? []).map((item) => this.mapMediaRow(item));
    const interactions = (row.post_interactions ?? []).map((item) => this.mapInteractionRow(item));
    const commentCount = interactions.filter((interaction) => Boolean(interaction.comment?.trim())).length;

    return {
      post_id: row.post_id,
      user_id: row.user_id,
      author_name: this.pickUserField(row.author ?? null, "name"),
      author_image_url: this.pickUserField(row.author ?? null, "image_url"),
      title: row.title,
      content: row.content,
      type: this.normalizeType(row.type),
      status,
      created_at: row.created_at,
      media,
      interactions,
      media_count: media.length,
      interaction_count: interactions.length,
      comment_count: commentCount,
    };
  }

  private mapMediaRow(row: { media_id?: string; media_url?: string | null }): GreenCreatorMediaRow {
    return {
      media_id: row.media_id ?? crypto.randomUUID(),
      media_url: row.media_url ?? null,
    };
  }

  private mapInteractionRow(row: {
    interaction_id?: string;
    post_id?: string | null;
    user_id?: string | null;
    type?: string | null;
    comment?: string | null;
    created_at?: string | null;
    status?: string | null;
    actor?: UserJoin;
  }): GreenCreatorInteractionRow {
    return {
      interaction_id: row.interaction_id ?? crypto.randomUUID(),
      post_id: row.post_id ?? null,
      user_id: row.user_id ?? null,
      user_name: this.pickUserField(row.actor ?? null, "name"),
      user_image_url: this.pickUserField(row.actor ?? null, "image_url"),
      type: row.type ?? "interaction",
      comment: row.comment ?? null,
      created_at: row.created_at ?? null,
      status: row.status ?? null,
    };
  }

  private pickUserField(user: UserJoin, field: "name" | "image_url"): string | null {
    if (Array.isArray(user)) {
      return user[0]?.[field] ?? null;
    }

    return user?.[field] ?? null;
  }

  private normalizeStatus(status: string | null | undefined): GreenCreatorPostStatus {
    if (status === "approved" || status === "rejected") {
      return status;
    }

    return "pending";
  }

  private normalizeType(type: string): GreenCreatorPostType {
    if (type === "video" || type === "community") {
      return type;
    }

    return "blog";
  }
}
